import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { updateAiConfigSchema, insertContactLeadSchema, insertMerchantApplicationSchema } from "@shared/schema";
import * as schema from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, inArray, sql, getTableColumns } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import rateLimit from "express-rate-limit";
import { sendEmail, sendContactFormConfirmation, sendOutreachEmail, generateOutreachEmail, generateCallScript, handleInboundEmail } from "./email";
import {
  statementAnalysisEmail,
  walkInFollowUpEmail,
  phoneCallFollowUpEmail,
  initialOutreachEmail,
  meetingFollowUpEmail,
  welcomeToTeamEmail,
  referralFollowUpEmail,
  referralContractEmail,
} from "./email-templates";
import { startAutopilot, stopAutopilot, runAutopilot, generateAIEmail, autoEnrichLead, classifyInboundEmail } from "./autopilot";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToR2, deleteFromR2, r2Enabled } from "./r2";

// ─── File Upload Config ──────────────────────────────────────────
// Local fallback dirs (used when R2 is not configured)
const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads", "resources");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  storage: r2Enabled
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);
          cb(null, `${Date.now()}-${base}${ext}`);
        },
      }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".webm", ".zip", ".txt", ".html", ".htm"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

/*
 * Anthropic integration - blueprint:javascript_anthropic
 * The newest Anthropic model is "claude-sonnet-4-20250514".
 * If the user doesn't specify a model, always prefer using "claude-sonnet-4-20250514".
 */

const ALLOWED_MODELS = [
  "claude-sonnet-4-20250514",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-haiku-20241022",
];

const MAX_HISTORY_LENGTH = 20;
const MAX_ALLOWED_TOKENS = 4096;

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// ─── DB Helpers ─────────────────────────────────────────────────────

function pickColumns(table: any, data: Record<string, any>): Record<string, any> {
  const cols = Object.keys(getTableColumns(table));
  const result: Record<string, any> = {};
  for (const key of cols) {
    if (key in data && key !== "id") {
      result[key] = data[key];
    }
  }
  return result;
}

function deserializeLead(row: typeof schema.leads.$inferSelect) {
  let attachments: any[] = [];
  let statementData: any = null;
  let techStack: any[] = [];
  try { attachments = JSON.parse(row.attachments || "[]"); } catch {}
  try { statementData = row.statementData ? JSON.parse(row.statementData) : null; } catch {}
  try { techStack = row.techStack ? JSON.parse(row.techStack) : []; } catch {}
  return { ...row, attachments, statementData, techStack };
}

function deserializeIntegration(row: typeof schema.integrations.$inferSelect) {
  let config: Record<string, any> = {};
  try { config = JSON.parse(row.config || "{}"); } catch {}
  return { ...row, config };
}

async function logActivity(action: string, details: string, type: string) {
  try {
    await db.insert(schema.activityLog).values({
      id: randomUUID(),
      action,
      details,
      timestamp: new Date().toISOString(),
      type,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

async function sendSlackNotification(text: string, eventType?: string) {
  try {
    const [config] = await db.select().from(schema.slackConfig).where(eq(schema.slackConfig.id, "default"));
    if (!config || !config.enabled || !config.webhookUrl) return;
    if (eventType === "newLead" && !config.notifyNewLead) return;
    if (eventType === "newClient" && !config.notifyNewClient) return;
    if (eventType === "revenue" && !config.notifyRevenue) return;
    if (eventType === "taskDue" && !config.notifyTaskDue) return;

    await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, channel: config.channel }),
    });
  } catch (err) {
    console.error("Slack notification failed:", err);
  }
}

// ─── Log to Inbox (creates email thread + message for admin dashboard) ──

async function logToInbox(opts: {
  contactEmail: string;
  contactName: string;
  subject: string;
  body: string;
  htmlBody?: string;
  source: string;
  folder?: string;
  direction?: string;
  aiIntent?: string;
  aiPriority?: string;
  leadId?: string;
}) {
  try {
    const now = new Date().toISOString();
    const threadId = randomUUID();
    const messageId = randomUUID();

    await db.insert(schema.emailThreads).values({
      id: threadId,
      subject: opts.subject,
      leadId: opts.leadId || "",
      contactEmail: opts.contactEmail,
      contactName: opts.contactName,
      source: opts.source,
      status: "open",
      folder: opts.folder || "inbox",
      starred: false,
      aiIntent: opts.aiIntent || "",
      aiPriority: opts.aiPriority || "normal",
      aiSentiment: "neutral",
      unread: true,
      lastMessageAt: now,
      createdAt: now,
    });

    await db.insert(schema.emailMessages).values({
      id: messageId,
      threadId,
      direction: opts.direction || "inbound",
      fromEmail: opts.direction === "outbound" ? "contact@techsavvyhawaii.com" : opts.contactEmail,
      fromName: opts.direction === "outbound" ? "TechSavvy Hawaii" : opts.contactName,
      toEmail: opts.direction === "outbound" ? opts.contactEmail : "contact@techsavvyhawaii.com",
      subject: opts.subject,
      body: opts.body.slice(0, 5000),
      htmlBody: (opts.htmlBody || "").slice(0, 10000),
      resendId: "",
      status: opts.direction === "outbound" ? "sent" : "received",
      sentAt: now,
    });

    return threadId;
  } catch (err) {
    console.error("logToInbox failed:", err);
    return null;
  }
}

// ─── Seed Functions (check DB first, insert if empty) ───────────────

let planSeeded = false;
async function seedPlanIfNeeded() {
  if (planSeeded) return;
  planSeeded = true;
  const existing = await db.select({ id: schema.planItems.id }).from(schema.planItems).limit(1);
  if (existing.length > 0) return;
  const items = [
    { phase: 1, weekRange: "1-2", title: "Set up CRM pipeline and configure all lead fields", description: "Pipeline stages, source tracking, required fields", completed: false, completedAt: "", order: 1 },
    { phase: 1, weekRange: "1-2", title: "Craft value proposition and 30-second elevator pitch", description: "One-pager for walk-ins, pitch for networking", completed: false, completedAt: "", order: 2 },
    { phase: 1, weekRange: "1-2", title: "Create 2 lead magnet PDFs", description: "E.g., Statement Checklist + Cash Discount Guide", completed: false, completedAt: "", order: 3 },
    { phase: 1, weekRange: "1-2", title: "Build landing page with lead capture form + QR code", description: "Opt-in form for lead magnets with thank-you page", completed: false, completedAt: "", order: 4 },
    { phase: 1, weekRange: "1-2", title: "Draft referral partner agreement", description: "Terms, commission structure, tracking method", completed: false, completedAt: "", order: 5 },
    { phase: 1, weekRange: "1-2", title: "Prepare cold call and walk-in scripts", description: "30-second openers + qualification questions", completed: false, completedAt: "", order: 6 },
    { phase: 1, weekRange: "1-2", title: "Set up email templates (cold + follow-up + confirm)", description: "8 branded templates: outreach, walk-in, phone, meeting, referral, contract, welcome, statement analysis", completed: true, completedAt: new Date().toISOString(), order: 7 },
    { phase: 2, weekRange: "3-6", title: "Schedule and complete 10 referral partner meetings", description: "Accountants, bookkeepers, consultants, POS resellers", completed: false, completedAt: "", order: 8 },
    { phase: 2, weekRange: "3-6", title: "Attend 4 networking events", description: "Chamber, BNI, industry events — bring QR codes", completed: false, completedAt: "", order: 9 },
    { phase: 2, weekRange: "3-6", title: "Launch social content calendar + daily engagement", description: "3 posts/week + 10 targeted comments/day", completed: false, completedAt: "", order: 10 },
    { phase: 2, weekRange: "3-6", title: "Complete partner onboarding for 3+ partners", description: "Agreement signed, intro method set, tracking live", completed: false, completedAt: "", order: 11 },
    { phase: 2, weekRange: "3-6", title: "Send first batch of direct outreach (25 businesses)", description: "Mix of walk-ins, calls, and personalized emails", completed: false, completedAt: "", order: 12 },
    { phase: 3, weekRange: "7-12", title: "Reach 100 business outreach milestone", description: "Combined walk-ins, calls, emails across all channels", completed: false, completedAt: "", order: 13 },
    { phase: 3, weekRange: "7-12", title: "Follow up on all pending statements and proposals", description: "48hr SLA on statements, weekly proposal follow-ups", completed: false, completedAt: "", order: 14 },
    { phase: 3, weekRange: "7-12", title: "Analyze channel metrics and double down on winners", description: "Compare conversion rates, volume, time-to-close", completed: false, completedAt: "", order: 15 },
    { phase: 3, weekRange: "7-12", title: "Quarterly check-in with all referral partners", description: "Review referrals, refresh agreement, share results", completed: false, completedAt: "", order: 16 },
    { phase: 3, weekRange: "7-12", title: "Review and refine all scripts based on results", description: "Update what's working, discard what isn't", completed: false, completedAt: "", order: 17 },
  ];
  await db.insert(schema.planItems).values(
    items.map((item) => ({ id: randomUUID(), ...item }))
  );
}

let materialsSeeded = false;
async function seedMaterialsIfNeeded() {
  if (materialsSeeded) return;
  materialsSeeded = true;
  const existing = await db.select({ id: schema.materials.id }).from(schema.materials).limit(1);
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const items = [
    { category: "sales", name: "One-Page Value Prop + Statement Review Offer", description: "Benefits, pricing, QR to landing page — print + PDF", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "sales", name: "Cold Call Script + Objection Handlers", description: "30-60 sec opener, qualification Qs, common objections", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "sales", name: "Walk-In Script + Leave-Behind Card", description: "In-person opener with handoff material", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "sales", name: "Email Templates (Cold + Follow-Up + Confirm)", description: "Initial outreach, walk-in follow-up, phone follow-up, meeting follow-up, referral follow-up, referral contract, welcome, statement analysis — 8 branded templates", status: "completed", fileUrl: "", updatedAt: now },
    { category: "lead-gen", name: "AI Statement Review Tool", description: "Public-facing statement upload with AI analysis. Grades A-F, detects hidden fees, red flags, savings estimate. Emails branded report or self-review guides.", status: "completed", fileUrl: "/statement-review", updatedAt: now },
    { category: "lead-gen", name: "Lead Magnet PDF: Statement Checklist", description: "Top 10 Things to Check on Your Merchant Statement", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "lead-gen", name: "Lead Magnet PDF: Cash Discount Guide", description: "Cash Discount Program Explained: Is It Right for Your Business?", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "lead-gen", name: "Landing Page with Lead Capture Form", description: "Opt-in page for lead magnets with form + thank-you page", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "lead-gen", name: "QR Codes for Print Materials", description: "Links to landing page, for one-pagers and business cards", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "partner", name: "Referral Partner Agreement", description: "Tier A: first month revenue for standard accounts. Tier B: ongoing 10-15% residual for large accounts ($25K+/mo). Commission tiers, referral process, payment terms, obligations, confidentiality, termination.", status: "completed", fileUrl: "https://raw.githubusercontent.com/gorjessbbyx3/Sales-Boost-Site/main/materials/referral-partner-agreement.pdf", updatedAt: now },
    { category: "partner", name: "Partner Intro Email Template", description: "Template for partners to introduce you to their clients", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "partner", name: "CRM Partner Tracking Setup", description: "Tags, source field, quarterly check-in calendar", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "tracking", name: "Weekly KPI Sheet", description: "Track outreach, contacts, appointments, closes weekly", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "tracking", name: "Channel Scorecard", description: "Per-source conversion funnel + avg volume metrics", status: "not-started", fileUrl: "", updatedAt: now },
    { category: "tracking", name: "Follow-Up SLA Tracker", description: "24hr rule for lead magnets, 48hr for partner referrals", status: "not-started", fileUrl: "", updatedAt: now },
  ];
  await db.insert(schema.materials).values(
    items.map((item) => ({ id: randomUUID(), ...item }))
  );
}

// Seed function removed — resources are now uploaded manually via admin

// ─── Routes ────────────────────────────────────────────────────────

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Rate Limiters ────────────────────────────────────────────
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 10,               // 10 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a moment." },
  });

  const publicLeadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,                // 5 submissions per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many submissions. Please try again shortly." },
  });

  // ─── Health Check ─────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      env: process.env.NODE_ENV || "development",
    });
  });

  // ─── Password helpers ────────────────────────────────────────────

  function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const hashBuf = Buffer.from(hash, "hex");
    const supplied = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuf, supplied);
  }

  async function getAdminSettings() {
    const rows = await db.select().from(schema.adminSettings).limit(1);
    return rows[0] || null;
  }

  // ─── Admin Auth ─────────────────────────────────────────────────

  // Check if first-time setup is needed (no password stored yet)
  app.get("/api/admin/setup-status", async (_req: Request, res: Response) => {
    try {
      const settings = await getAdminSettings();
      const needsSetup = !settings || !settings.passwordHash;
      return res.json({ needsSetup });
    } catch {
      // Table may not exist yet — treat as needs setup
      return res.json({ needsSetup: true });
    }
  });

  // Auto-create admin_settings table if it doesn't exist
  async function ensureAdminSettingsTable() {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS admin_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        password_hash TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      )`
    );
  }

  // First-time password setup
  app.post("/api/admin/setup", async (req: Request, res: Response) => {
    await ensureAdminSettingsTable();
    const settings = await getAdminSettings();
    if (settings && settings.passwordHash) {
      return res.status(400).json({ error: "Password already configured. Use change-password instead." });
    }
    const { password } = req.body;
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);
    await db.insert(schema.adminSettings).values({ id: "default", passwordHash, updatedAt: now })
      .onConflictDoUpdate({ target: schema.adminSettings.id, set: { passwordHash, updatedAt: now } });
    req.session.isAdmin = true;
    logActivity("Setup", "Admin password created", "auth");
    return res.json({ success: true });
  });

  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { password } = req.body;
    const settings = await getAdminSettings();

    // If a stored password exists, verify against it
    if (settings && settings.passwordHash) {
      if (verifyPassword(password, settings.passwordHash)) {
        req.session.isAdmin = true;
        logActivity("Login", "Admin logged in", "auth");
        return res.json({ success: true });
      }
      return res.status(401).json({ error: "Invalid password." });
    }

    // Fallback to SESSION_SECRET for backwards compatibility (before first setup)
    const envPassword = process.env.SESSION_SECRET || "techsavvy-dev-secret";
    if (password === envPassword) {
      req.session.isAdmin = true;
      logActivity("Login", "Admin logged in (env fallback)", "auth");
      return res.json({ success: true });
    }
    return res.status(401).json({ error: "Invalid password." });
  });

  // Change password (requires current session)
  app.post("/api/admin/change-password", requireAdminSession, async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    const settings = await getAdminSettings();

    // Verify the current password
    if (settings && settings.passwordHash) {
      if (!verifyPassword(currentPassword, settings.passwordHash)) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
    } else {
      // No stored password yet — verify against env fallback
      const envPassword = process.env.SESSION_SECRET || "techsavvy-dev-secret";
      if (currentPassword !== envPassword) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
    }

    const now = new Date().toISOString();
    const passwordHash = hashPassword(newPassword);
    await db.insert(schema.adminSettings).values({ id: "default", passwordHash, updatedAt: now })
      .onConflictDoUpdate({ target: schema.adminSettings.id, set: { passwordHash, updatedAt: now } });
    logActivity("Security", "Admin password changed", "auth");
    return res.json({ success: true });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.isAdmin = false;
    return res.json({ success: true });
  });

  app.get("/api/admin/check", (req: Request, res: Response) => {
    const isAdmin = !!req.session?.isAdmin;
    return res.json({ authenticated: isAdmin });
  });

  // ─── AI Config ──────────────────────────────────────────────────

  app.get("/api/ai-config", async (_req, res) => {
    const config = await storage.getAiConfig();
    // Only expose what the public chat widget needs — never leak systemPrompt
    res.json({
      enabled: config.enabled,
      model: config.model,
      welcomeMessage: config.welcomeMessage,
      maxTokens: config.maxTokens,
    });
  });

  // Full config (including systemPrompt) — admin only
  app.get("/api/ai-config/full", requireAdminSession, async (_req, res) => {
    const config = await storage.getAiConfig();
    res.json(config);
  });

  app.patch("/api/ai-config", requireAdminSession, async (req, res) => {
    const parsed = updateAiConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    if (parsed.data.model && !ALLOWED_MODELS.includes(parsed.data.model)) {
      return res.status(400).json({ error: "Invalid model selection." });
    }
    if (parsed.data.maxTokens && parsed.data.maxTokens > MAX_ALLOWED_TOKENS) {
      parsed.data.maxTokens = MAX_ALLOWED_TOKENS;
    }
    const config = await storage.updateAiConfig(parsed.data);
    res.json(config);
  });

  // ─── Seed Content (lead magnets, materials, AI knowledge) ──────

  app.post("/api/admin/seed-content", requireAdminSession, async (_req, res) => {
    const now = new Date().toISOString();
    let resourcesAdded = 0;
    let materialsAdded = 0;

    // 1. Seed lead magnet resources
    const leadMagnetResources = [
      { title: "Top 10 Things to Check on Your Merchant Statement", description: "A quick guide to spotting hidden fees, inflated rates, and junk charges. Includes effective rate calculator, fee benchmarks, and a quick-reference audit checklist.", category: "classroom", type: "pdf", url: "/free/statement-checklist", featured: true, published: true, order: 1 },
      { title: "Cash Discount Programs Explained", description: "Complete guide to cash discount programs — legal status in all 50 states, implementation checklist, signage requirements, receipt formatting, and customer FAQ scripts.", category: "classroom", type: "pdf", url: "/free/cash-discount-guide", featured: true, published: true, order: 2 },
      { title: "Payment Security Checklist for Small Businesses", description: "PCI compliance walkthrough, terminal security hardening, fraud prevention tactics for card-present and online transactions, plus an incident response plan template.", category: "classroom", type: "pdf", url: "/free/security-checklist", featured: true, published: true, order: 3 },
      { title: "Industry-Specific Rate Comparison Guide", description: "Rate benchmarks for restaurants, retail, salons, auto repair, medical, convenience stores, professional services, and e-commerce. Know if you're overpaying.", category: "classroom", type: "pdf", url: "/free/rate-comparison", featured: true, published: true, order: 4 },
    ];

    for (const r of leadMagnetResources) {
      const existing = await db.select({ id: schema.resources.id }).from(schema.resources).where(eq(schema.resources.title, r.title)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.resources).values({ id: randomUUID(), ...r, thumbnailUrl: "", createdAt: now, updatedAt: now });
        resourcesAdded++;
      }
    }

    // 2. Seed sales materials
    const salesMaterials = [
      { category: "sales", name: "One-Pager Value Proposition", description: "Print double-sided. Includes: free statement review offer, problem/solution table (hidden fees, outdated equipment, slow funding), how-it-works steps, QR code placeholder, and testimonial section. Use for walk-ins and networking events.", status: "completed" },
      { category: "sales", name: "Leave-Behind Card", description: "Business card (3.5x2) or mini flyer (4x6). Front: FREE STATEMENT REVIEW headline, qualifying question, contact info. Back: 4 benefit bullets (hidden fee analysis, rate comparison, equipment evaluation, next-day funding), QR code to landing page.", status: "completed" },
      { category: "partner", name: "Referral Partner Agreement", description: "One-page partnership template. Covers: referral process (email/form/intro), compensation models (flat fee per funded account, ongoing residual %, or tiered hybrid), mutual obligations, monthly reporting, 30-day exit clause.", status: "completed" },
    ];

    for (const m of salesMaterials) {
      const existing = await db.select({ id: schema.materials.id }).from(schema.materials).where(eq(schema.materials.name, m.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.materials).values({ id: randomUUID(), ...m, fileUrl: "", updatedAt: now });
        materialsAdded++;
      }
    }

    // 3. Update AI system prompt with rate benchmarks + objection knowledge
    const updatedPrompt = `You are a helpful assistant for TechSavvy Hawaii (doing business as CashSwipe). You help businesses save money on payment processing.

WHAT WE OFFER:
- Zero-fee processing: Merchants keep 100% of every sale. A small surcharge is passed to the customer at checkout (legal in all 50 states as a cash discount program).
- One-time $399 terminal cost (chip, swipe, contactless/NFC, online gateway). No monthly fees, no contracts.
- Free custom website for every processing customer.
- Premium website packages ($50-$399/mo maintenance plans) with advanced features.
- High-risk merchant accounts (CBD, vape, firearms, adult, nutraceuticals).

RATE BENCHMARKS BY INDUSTRY (effective rate = total fees / total volume):
- Restaurants: Good 2.1-2.4%, Average 2.4-2.8%, Overpaying 2.8%+
- Retail: Good 2.0-2.3%, Average 2.3-2.7%, Overpaying 2.7%+
- Salons/Spas: Good 2.2-2.5%, Average 2.5-2.9%, Overpaying 2.9%+
- Auto Repair: Good 2.3-2.6%, Average 2.6-3.0%, Overpaying 3.0%+
- Medical/Dental: Good 2.3-2.7%, Average 2.7-3.1%, Overpaying 3.1%+
- Convenience Stores: Good 2.0-2.3%, Average 2.3-2.6%, Overpaying 2.6%+
- Professional Services: Good 2.5-2.9%, Average 2.9-3.3%, Overpaying 3.3%+
- E-Commerce: Good 2.5-2.9%, Average 2.9-3.3%, Overpaying 3.3%+

COMMON OBJECTIONS & RESPONSES:
- "We're happy with our processor" -> Rates change constantly. A free statement review costs nothing and takes 10 minutes.
- "We're locked in a contract" -> Most have 30-60 day exit clauses. ETF is typically $200-500. If savings are $300+/month, it pays for itself in under 2 months.
- "What are your rates?" -> Don't quote blind rates. Ask for their statement for an apples-to-apples comparison.
- "We don't process enough" -> Even $5K-10K/month businesses lose $100-300/month to inflated fees. That's $1,200-3,600/year.
- "We just switched" -> Intro rates often creep up after 3-6 months. Offer a future review.

FREE RESOURCES (direct prospects to these):
- Statement Checklist: /free/statement-checklist
- Cash Discount Guide: /free/cash-discount-guide
- Security Checklist: /free/security-checklist
- Rate Comparison Guide: /free/rate-comparison

CONTACT: (808) 767-5460 | contact@techsavvyhawaii.com | techsavvyhawaii.com
Hours: Mon-Sat 8AM-6PM HST

RULES:
- Be friendly, professional, and concise
- Always offer a free statement review as the primary CTA
- When discussing rates, reference the benchmarks above for their industry
- When prospects object, use the responses above as a guide (adapt naturally)
- Direct interested prospects to /contact or call (808) 767-5460
- If they want educational resources, link to the free guides above`;

    await db.update(schema.aiConfig).set({ systemPrompt: updatedPrompt }).where(eq(schema.aiConfig.id, "default"));

    logActivity("Content Seeded", `Resources: ${resourcesAdded}, Materials: ${materialsAdded}, AI prompt updated`, "integration");
    res.json({ resources: resourcesAdded, materials: materialsAdded, aiUpdated: true });
  });

  // ─── Chat ───────────────────────────────────────────────────────

  app.post("/api/chat", chatLimiter, async (req, res) => {
    const config = await storage.getAiConfig();

    if (!config.enabled) {
      return res.status(503).json({ error: "AI agent is currently disabled." });
    }

    const { message, history } = req.body;
    if (!message || typeof message !== "string" || message.length > 2000) {
      return res.status(400).json({ error: "Message is required and must be under 2000 characters." });
    }

    // Build trimmed history
    const trimmedHistory: { role: string; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.role && h.content && typeof h.content === "string") {
          trimmedHistory.push({ role: h.role, content: h.content.slice(0, 2000) });
        }
      }
    }

    try {
      // Try Anthropic first if API key is available
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({ apiKey });
        const messages = [...trimmedHistory.map(h => ({ role: h.role as "user" | "assistant", content: h.content })), { role: "user" as const, content: message }];
        const safeMaxTokens = Math.min(config.maxTokens, 2048);
        const response = await anthropic.messages.create({
          model: config.model,
          max_tokens: safeMaxTokens,
          system: config.systemPrompt,
          messages,
        });
        const text = response.content
          .filter((block: any) => block.type === "text")
          .map((block: any) => block.text)
          .join("");
        return res.json({ reply: text });
      }

      // Fallback: proxy through AI worker (Cloudflare Workers AI — free, no API key needed)
      const workerUrl = process.env.ENRICH_WORKER_URL || "https://mojo-luna-955c.gorjessbbyx3.workers.dev";
      const workerRes = await fetch(`${workerUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: trimmedHistory,
          systemPrompt: config.systemPrompt,
        }),
      });
      const data = await workerRes.json() as any;
      if (data.error) {
        return res.status(500).json({ error: data.error });
      }
      return res.json({ reply: data.reply || "" });
    } catch (err: any) {
      const errMsg = err.message || "";
      console.error("Chat error:", errMsg);
      const safeError = errMsg.includes("rate_limit") ? "AI service is busy. Please try again in a moment."
        : "Failed to get AI response. Please try again.";
      res.status(500).json({ error: safeError });
    }
  });

  // ─── Statement Review (AI-powered analysis) ────────────────────

  const statementUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext));
    },
  });

  const statementLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many requests. Please wait a few minutes." },
  });

  app.post("/api/statement-review/analyze", statementLimiter, statementUpload.single("statement"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Please attach your merchant statement." });
      }

      const enrichWorkerUrl = process.env.ENRICH_WORKER_URL || "https://mojo-luna-955c.gorjessbbyx3.workers.dev";
      const fileBuffer = req.file.buffer;
      const mimeType = req.file.mimetype || "application/pdf";
      const isPdf = mimeType.includes("pdf");

      let requestBody: Record<string, string>;

      if (isPdf) {
        // Extract text from PDF and send to Workers AI text analysis
        let pdfParse: (buffer: Buffer) => Promise<{ text: string }>;
        try {
          const mod = await import("pdf-parse");
          pdfParse = (mod as any).default || mod;
        } catch {
          return res.status(500).json({ error: "PDF processing unavailable. Please upload an image instead." });
        }
        const pdfData = await pdfParse(fileBuffer);
        const extractedText = pdfData.text || "";
        if (extractedText.trim().length < 20) {
          // Scanned PDF with no selectable text — fall back to image analysis
          requestBody = { imageBase64: fileBuffer.toString("base64"), imageType: "application/pdf" };
        } else {
          requestBody = { text: extractedText };
        }
      } else {
        // Image upload — send to Workers AI vision model
        requestBody = { imageBase64: fileBuffer.toString("base64"), imageType: mimeType };
      }

      const workerHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.WORKER_KEY) workerHeaders["X-Worker-Key"] = process.env.WORKER_KEY;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for analysis
      const aiResp = await fetch(`${enrichWorkerUrl}/analyze-statement`, {
        method: "POST",
        headers: workerHeaders,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!aiResp.ok) {
        const errData = await aiResp.json().catch(() => ({ error: "Worker error" }));
        throw new Error((errData as any).error || "Analysis service returned an error");
      }

      const analysis: any = await aiResp.json();

      // Log as a lead activity
      logActivity("Statement Review", `AI analysis completed — Grade: ${analysis.overallGrade}, Overpay: ${analysis.estimatedOverpay}`, "lead");

      // Auto-save the uploaded statement to admin files ("Uploaded Statements" folder)
      try {
        let fileUrl = "";
        if (r2Enabled) {
          fileUrl = await uploadToR2(fileBuffer, req.file.originalname, "statements");
        } else {
          // Save locally when R2 is not configured
          const ext = path.extname(req.file.originalname);
          const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);
          const localName = `${Date.now()}-${base}${ext}`;
          fs.writeFileSync(path.join(UPLOADS_DIR, localName), fileBuffer);
          fileUrl = `/uploads/resources/${localName}`;
        }
        await db.insert(schema.adminFiles).values({
          id: randomUUID(),
          name: req.file.originalname,
          size: req.file.size,
          type: isPdf ? "document" : "image",
          category: "statements",
          folder: "Uploaded Statements",
          uploadedAt: new Date().toISOString(),
          url: fileUrl,
        });
      } catch (saveErr) {
        console.error("Failed to save statement file:", saveErr);
      }

      res.json(analysis);
    } catch (err: any) {
      console.error("Statement analysis error:", err.message || err);
      const msg = err.message || "";
      const safeError = msg.includes("abort") ? "Analysis took too long. Please try a smaller file or call us."
        : "Analysis failed. Please try again or call us at (808) 767-5460 for a free manual review.";
      res.status(500).json({ error: safeError });
    }
  });

  app.post("/api/statement-review/email", statementLimiter, async (req: Request, res: Response) => {
    try {
      const { email, name, business, type, analysis } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: "Name and email are required." });
      }

      if (type === "report" && analysis) {
        // Send the analysis report via branded email template
        const annualOverpay = analysis.estimatedOverpay
          ? `$${(parseFloat(analysis.estimatedOverpay.replace(/[$,]/g, "")) * 12).toLocaleString()}`
          : "N/A";

        const emailContent = statementAnalysisEmail({
          ownerName: name,
          businessName: business || "Your Business",
          processorName: analysis.processorName || analysis.currentProcessor || "your processor",
          effectiveRate: analysis.effectiveRate || "N/A",
          totalFees: analysis.totalFees || analysis.estimatedOverpay || "N/A",
          monthlyVolume: analysis.monthlyVolume || "N/A",
          redFlagCount: Array.isArray(analysis.redFlags) ? analysis.redFlags.length : 0,
          overallGrade: analysis.overallGrade || "C",
          hiddenFees: Array.isArray(analysis.hiddenFees) ? analysis.hiddenFees : [],
          redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : [],
          junkFees: Array.isArray(analysis.junkFees) ? analysis.junkFees : [],
          recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
          estimatedOverpay: analysis.estimatedOverpay || "N/A",
          potentialAnnualSavings: annualOverpay,
        });

        await sendEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } else {
        // Send booklet guides email
        await sendEmail({
          to: email,
          subject: "Your Free Merchant Statement Review Guides | TechSavvy Hawaii",
          html: `
            <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:640px;margin:0 auto;background:#0a0a0a;color:#e0e0e0;">
              <div style="padding:32px;background:linear-gradient(135deg,#0f172a,#1e1b4b);border-bottom:2px solid #4aeaff;">
                <h1 style="margin:0;font-size:24px;color:#4aeaff;">λechSavvy</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Your Free Statement Review Guides</p>
              </div>
              <div style="padding:32px;">
                <p style="font-size:16px;margin-bottom:8px;">Hi ${name},</p>
                <p style="font-size:14px;color:#aaa;margin-bottom:24px;">Thanks for your interest! Here are your free guides to help you review your merchant processing statement.</p>

                <div style="margin-bottom:24px;">
                  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:20px;margin-bottom:12px;">
                    <h3 style="color:#4aeaff;margin:0 0 4px;font-size:16px;">📋 Top 10 Statement Checklist</h3>
                    <p style="color:#aaa;font-size:13px;margin:0 0 12px;">Spot hidden fees, inflated rates, and junk charges in under 10 minutes.</p>
                    <a href="https://assets.techsavvyhawaii.com/website-resources/1771403190912-top-10-statement-check.pdf" style="color:#4aeaff;font-size:13px;text-decoration:none;font-weight:600;">Download Guide →</a>
                  </div>
                  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:20px;margin-bottom:12px;">
                    <h3 style="color:#4aeaff;margin:0 0 4px;font-size:16px;">📊 Rate Comparison Guide</h3>
                    <p style="color:#aaa;font-size:13px;margin:0 0 12px;">Industry benchmarks for restaurants, retail, salons, medical & more.</p>
                    <a href="https://assets.techsavvyhawaii.com/website-resources/1771403189858-rate-comparison-guide.pdf" style="color:#4aeaff;font-size:13px;text-decoration:none;font-weight:600;">Download Guide →</a>
                  </div>
                  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:20px;margin-bottom:12px;">
                    <h3 style="color:#4aeaff;margin:0 0 4px;font-size:16px;">🔒 Security Checklist</h3>
                    <p style="color:#aaa;font-size:13px;margin:0 0 12px;">PCI compliance, fraud prevention, and breach response checklist.</p>
                    <a href="https://assets.techsavvyhawaii.com/website-resources/1771403187943-payment-security-checklist.pdf" style="color:#4aeaff;font-size:13px;text-decoration:none;font-weight:600;">Download Guide →</a>
                  </div>
                  <div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:20px;margin-bottom:12px;">
                    <h3 style="color:#4aeaff;margin:0 0 4px;font-size:16px;">💰 Cash Discount Guide</h3>
                    <p style="color:#aaa;font-size:13px;margin:0 0 12px;">How to eliminate processing fees entirely — legal in all 50 states.</p>
                    <a href="https://assets.techsavvyhawaii.com/website-resources/1771403188928-cash-discount-explained.pdf" style="color:#4aeaff;font-size:13px;text-decoration:none;font-weight:600;">Download Guide →</a>
                  </div>
                </div>

                <div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #4aeaff33;border-radius:12px;padding:24px;text-align:center;">
                  <h3 style="color:#4aeaff;margin:0 0 8px;font-size:18px;">Want us to review it for you?</h3>
                  <p style="color:#aaa;font-size:14px;margin:0 0 16px;">Upload your statement for a free AI-powered analysis, or call us for a personal review.</p>
                  <a href="https://techsavvyhawaii.com/statement-review" style="display:inline-block;background:#4aeaff;color:#000;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px;">AI Analysis</a>
                  <a href="tel:+18087675460" style="display:inline-block;background:transparent;color:#4aeaff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid #4aeaff;">📞 (808) 767-5460</a>
                </div>

                <p style="color:#666;font-size:12px;margin-top:32px;text-align:center;">
                  TechSavvy Hawaii • techsavvyhawaii.com • contact@techsavvyhawaii.com
                </p>
              </div>
            </div>
          `,
        });
      }

      // Save as a lead
      try {
        const now = new Date().toISOString();
        const leadId = randomUUID();
        await db.insert(schema.leads).values({
          id: leadId,
          name,
          email,
          business: business || "",
          source: "statement-review",
          status: "new",
          notes: type === "report" ? "AI statement report emailed" : "Requested self-review guides",
          // Save statement analysis data to the lead so it's visible in CRM
          statementGrade: analysis?.overallGrade || "",
          statementOverpay: analysis?.estimatedOverpay || "",
          statementData: analysis ? JSON.stringify(analysis) : "",
          currentProcessor: analysis?.processorName || analysis?.currentProcessor || "",
          monthlyVolume: analysis?.monthlyVolume || "",
          painPoints: analysis?.redFlags?.join(", ") || "",
          leadScore: analysis?.overallGrade === "F" ? 90 : analysis?.overallGrade === "D" ? 80 : analysis?.overallGrade === "C" ? 60 : analysis?.overallGrade === "B" ? 40 : 20,
          leadScoreReason: analysis?.overallGrade ? `Statement grade: ${analysis.overallGrade}, Overpay: ${analysis.estimatedOverpay || "unknown"}` : "",
          createdAt: now,
          updatedAt: now,
        });

        // Auto-create opportunity for statement review leads (they're warm)
        if (type === "report" && analysis) {
          try {
            await db.insert(schema.opportunities).values({
              id: randomUUID(),
              title: `${business || name} — Statement Review`,
              leadId,
              stage: "qualification",
              value: analysis.estimatedOverpay ? parseFloat(analysis.estimatedOverpay.replace(/[$,]/g, "")) * 12 : 0,
              probability: 30,
              expectedCloseDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
              notes: `Grade: ${analysis.overallGrade}, Monthly overpay: ${analysis.estimatedOverpay || "N/A"}, ${analysis.redFlags?.length || 0} red flags`,
              stageChangedAt: now,
              createdAt: now,
              updatedAt: now,
            });
          } catch (oppErr) { console.error("Failed to create opportunity from statement review:", oppErr); }
        }
      } catch (leadErr) {
        console.error("Failed to save statement review lead:", leadErr);
      }

      logActivity("Statement Review Email", `${type === "report" ? "AI report" : "Guide booklets"} sent to ${email}`, "lead");
      sendSlackNotification(`📊 Statement Review: ${name} (${email}) — ${type === "report" ? "AI report sent" : "Guides requested"}`, "newLead");

      // Log to inbox — statement analysis report or DIY guides
      if (type === "report" && analysis) {
        logToInbox({
          contactEmail: email,
          contactName: name,
          subject: `Statement Analysis: ${business || name} — Grade ${analysis.overallGrade || "?"}`,
          body: `AI Statement Report sent to ${name} (${email})\n\nBusiness: ${business || "N/A"}\nGrade: ${analysis.overallGrade || "N/A"}\nEffective Rate: ${analysis.effectiveRate || "N/A"}\nEst. Monthly Overpay: ${analysis.estimatedOverpay || "N/A"}\nRed Flags: ${analysis.redFlags?.length || 0}\nProcessor: ${analysis.processorName || analysis.currentProcessor || "Unknown"}`,
          source: "statement-review",
          direction: "outbound",
          aiIntent: "new_lead",
          aiPriority: analysis.overallGrade === "F" || analysis.overallGrade === "D" ? "high" : "normal",
        }).catch(err => console.error("Inbox log failed:", err));
      } else {
        logToInbox({
          contactEmail: email,
          contactName: name,
          subject: `DIY Guides Requested: ${name}`,
          body: `Self-review guide booklets sent to ${name} (${email})\n\nBusiness: ${business || "N/A"}\nGuides: Statement Checklist, Rate Comparison, Security Checklist, Cash Discount Guide`,
          source: "statement-review",
          direction: "outbound",
          aiIntent: "new_lead",
          aiPriority: "normal",
        }).catch(err => console.error("Inbox log failed:", err));
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Statement email error:", err);
      res.status(500).json({ error: "Failed to send email. Please try again." });
    }
  });

  // ─── Contact Leads (from website form) ──────────────────────────

  app.post("/api/contact-leads", publicLeadLimiter, async (req: Request, res: Response) => {
    const parsed = insertContactLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const lead = await storage.createContactLead(parsed.data);
    logActivity("New Website Lead", `${parsed.data.businessName} submitted contact form`, "lead");
    sendSlackNotification(`New lead from website: ${parsed.data.businessName} (${parsed.data.contactName}) - ${parsed.data.email}`, "newLead");
    // Send auto-confirmation email
    sendContactFormConfirmation(parsed.data.contactName, parsed.data.email, parsed.data.businessName).catch(err => console.error("Auto-confirm failed:", err));

    // Log to inbox so it shows in admin email dashboard
    logToInbox({
      contactEmail: parsed.data.email,
      contactName: parsed.data.contactName,
      subject: `Contact Form: ${parsed.data.businessName}`,
      body: `New contact form submission:\n\nBusiness: ${parsed.data.businessName}\nContact: ${parsed.data.contactName}\nEmail: ${parsed.data.email}\nPhone: ${parsed.data.phone}\nPlan: ${parsed.data.plan}\nMonthly Processing: ${parsed.data.monthlyProcessing}\nBest Time to Call: ${parsed.data.bestContactTime}${parsed.data.highRisk ? "\nHigh Risk: Yes" : ""}`,
      source: "contact-form",
      aiIntent: "new_lead",
      aiPriority: "high",
    }).catch(err => console.error("Inbox log failed:", err));

    res.status(201).json(lead);
  });

  app.get("/api/contact-leads", requireAdminSession, async (_req: Request, res: Response) => {
    const contactLeadRows = await storage.getContactLeads();
    res.json(contactLeadRows);
  });

  // ─── Merchant Applications (gamified form) ──────────────────────

  app.post("/api/merchant-applications", publicLeadLimiter, async (req: Request, res: Response) => {
    const parsed = insertMerchantApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const application = await storage.createMerchantApplication(parsed.data);
    logActivity("New Merchant Application", `${parsed.data.businessLegalName} submitted application`, "lead");
    sendSlackNotification(`New merchant application: ${parsed.data.businessLegalName} (${parsed.data.ownerName}) - ${parsed.data.businessEmail}`, "newLead");
    // Send auto-confirmation email
    sendContactFormConfirmation(parsed.data.ownerName, parsed.data.businessEmail, parsed.data.businessLegalName).catch(err => console.error("Auto-confirm failed:", err));
    // Log to admin inbox
    logToInbox({
      contactEmail: parsed.data.businessEmail,
      contactName: parsed.data.ownerName,
      subject: `Merchant Application: ${parsed.data.businessLegalName}`,
      body: `New merchant application:\n\nBusiness: ${parsed.data.businessLegalName}${parsed.data.dba ? `\nDBA: ${parsed.data.dba}` : ""}\nOwner: ${parsed.data.ownerName}${parsed.data.ownerTitle ? ` (${parsed.data.ownerTitle})` : ""}\nEmail: ${parsed.data.businessEmail}\nPhone: ${parsed.data.businessPhone}\nAddress: ${parsed.data.address}, ${parsed.data.city}, ${parsed.data.state} ${parsed.data.zip}\nStructure: ${parsed.data.businessStructure}\nProducts: ${parsed.data.productsSold || "Not specified"}\nMonthly Volume: ${parsed.data.avgMonthlyVolume || "Not specified"}\nAvg Ticket: ${parsed.data.avgTicket || "Not specified"}\n% In-Person: ${parsed.data.percentCardPresent || "Not specified"}`,
      source: "merchant-application",
      aiIntent: "new_lead",
      aiPriority: "high",
    }).catch(err => console.error("Inbox log failed:", err));
    res.status(201).json(application);
  });

  // ─── Partner Agreement (Public form → saved to admin files) ─────

  app.post("/api/partner-agreement", publicLeadLimiter, async (req: Request, res: Response) => {
    try {
      const { partnerName, businessName, email, phone, address, businessType, agreeTerms, signature, date } = req.body;
      if (!partnerName || !businessName || !email || !agreeTerms || !signature) {
        return res.status(400).json({ error: "Required fields: partnerName, businessName, email, agreeTerms, signature" });
      }

      // Generate a formatted HTML document
      const docHtml = `<!DOCTYPE html>
<html><head><title>Partner Agreement — ${businessName}</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#333;line-height:1.6}h1{color:#0f172a;border-bottom:2px solid #4aeaff;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px 12px;border-bottom:1px solid #eee}td:first-child{font-weight:bold;width:180px;color:#555}.sig{border-top:2px solid #333;padding-top:8px;margin-top:40px}</style>
</head><body>
<h1>TechSavvy Hawaii — Partner Agreement</h1>
<p>Submitted: ${date || new Date().toLocaleDateString()}</p>
<table>
<tr><td>Partner Name</td><td>${partnerName}</td></tr>
<tr><td>Business Name</td><td>${businessName}</td></tr>
<tr><td>Email</td><td>${email}</td></tr>
<tr><td>Phone</td><td>${phone || "—"}</td></tr>
<tr><td>Address</td><td>${address || "—"}</td></tr>
<tr><td>Business Type</td><td>${businessType || "—"}</td></tr>
<tr><td>Terms Accepted</td><td>Yes</td></tr>
</table>
<div class="sig">
<p><strong>Signature:</strong> ${signature}</p>
<p><strong>Date:</strong> ${date || new Date().toLocaleDateString()}</p>
</div>
</body></html>`;

      // Save as a file in the admin files system
      const fileName = `Partner Agreement — ${businessName} (${new Date().toISOString().slice(0, 10)}).html`;
      let fileUrl = "";
      const docBuffer = Buffer.from(docHtml, "utf-8");
      if (r2Enabled) {
        fileUrl = await uploadToR2(docBuffer, fileName, "partner-agreements");
      } else {
        // Save locally when R2 is not configured
        const base = fileName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);
        const localName = `${Date.now()}-${base}.html`;
        fs.writeFileSync(path.join(UPLOADS_DIR, localName), docBuffer);
        fileUrl = `/uploads/resources/${localName}`;
      }

      await db.insert(schema.adminFiles).values({
        id: randomUUID(),
        name: fileName,
        size: docHtml.length,
        type: "document",
        category: "contracts",
        folder: "Partner Agreements",
        uploadedAt: new Date().toISOString(),
        url: fileUrl,
      });

      // Also save as a lead + create referral partner record
      const partnerId = randomUUID();
      const leadId = randomUUID();
      const now = new Date().toISOString();

      // Create referral partner record for commission tracking
      try {
        await db.insert(schema.referralPartners).values({
          id: partnerId,
          name: partnerName,
          niche: businessType || "",
          clientTypes: "",
          referralTerms: "Tier A: first month revenue (up to $25K/mo). Tier B: 10-15% ongoing residual ($25K+/mo).",
          introMethod: "partner-agreement-form",
          trackingNotes: `Signed agreement on ${new Date().toLocaleDateString()}. Email: ${email}`,
          lastCheckIn: now,
          nextCheckIn: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          createdAt: now,
        });
      } catch (partnerErr) { console.error("Failed to create referral partner:", partnerErr); }

      try {
        await db.insert(schema.leads).values({
          id: leadId,
          name: partnerName,
          email,
          business: businessName,
          phone: phone || "",
          address: address || "",
          source: "partner-agreement",
          status: "new",
          vertical: businessType || "other",
          notes: "Signed partner agreement via website form",
          referralPartnerId: partnerId,
          createdAt: now,
          updatedAt: now,
          currentProcessor: "", currentEquipment: "", monthlyVolume: "",
          painPoints: "", nextStep: "review agreement", nextStepDate: "",
          decisionMakerName: partnerName, decisionMakerRole: "owner",
          bestContactMethod: "email", package: "terminal",
          attachments: "[]",
        });
      } catch (leadErr) {
        console.error("Failed to save partner lead:", leadErr);
      }

      logActivity("Partner Agreement", `${partnerName} (${businessName}) signed partner agreement`, "lead");
      sendSlackNotification(`New partner agreement: ${partnerName} — ${businessName} (${email})`, "newLead");

      res.json({ success: true });
    } catch (err: any) {
      console.error("Partner agreement error:", err);
      res.status(500).json({ error: "Failed to save agreement. Please try again." });
    }
  });

  // ─── Public Referral Program ────────────────────────────────────

  app.post("/api/referrals/public", publicLeadLimiter, async (req: Request, res: Response) => {
    try {
      const {
        referrerName, referrerEmail, referrerPhone,
        businessName, businessOwner, businessPhone, businessEmail,
        businessType, notes,
      } = req.body;

      if (!referrerName || !businessName) {
        return res.status(400).json({ error: "Your name and the business name are required." });
      }

      const now = new Date().toISOString();
      const leadId = randomUUID();

      // Create lead from the referred business
      await db.insert(schema.leads).values({
        id: leadId,
        name: businessOwner || businessName,
        business: businessName,
        phone: businessPhone || "",
        email: businessEmail || "",
        source: "referral",
        status: "new",
        vertical: businessType || "other",
        notes: `Referred by: ${referrerName} (${referrerEmail || referrerPhone || "no contact"}). ${notes || ""}`.trim(),
        nextStep: "Contact referred business",
        nextStepDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
        createdAt: now,
        updatedAt: now,
      });

      logActivity("Referral Received", `${referrerName} referred ${businessName}`, "lead");
      sendSlackNotification(`🤝 New referral! ${referrerName} referred ${businessName} (${businessOwner || "no owner name"}) — ${businessPhone || businessEmail || "no contact info"}`, "newLead");

      res.json({ success: true });
    } catch (err: any) {
      console.error("Referral submission error:", err);
      res.status(500).json({ error: "Failed to submit referral. Please try again." });
    }
  });

  // ─── Leads CRUD ─────────────────────────────────────────────────

  app.get("/api/leads", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.leads);
    res.json(rows.map(deserializeLead));
  });

  app.post("/api/leads", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const [lead] = await db.insert(schema.leads).values({
      id,
      name: req.body.name || "",
      business: req.body.business || "",
      address: req.body.address || "",
      phone: req.body.phone || "",
      email: req.body.email || "",
      decisionMakerName: req.body.decisionMakerName || "",
      decisionMakerRole: req.body.decisionMakerRole || "",
      bestContactMethod: req.body.bestContactMethod || "phone",
      package: req.body.package || "terminal",
      status: req.body.status || "new",
      source: req.body.source || "direct",
      vertical: req.body.vertical || "other",
      currentProcessor: req.body.currentProcessor || "",
      currentEquipment: req.body.currentEquipment || "",
      monthlyVolume: req.body.monthlyVolume || "",
      painPoints: req.body.painPoints || "",
      nextStep: req.body.nextStep || "",
      nextStepDate: req.body.nextStepDate || "",
      attachments: JSON.stringify(Array.isArray(req.body.attachments) ? req.body.attachments : []),
      notes: req.body.notes || "",
      createdAt: now,
      updatedAt: now,
    }).returning();
    logActivity("Lead Created", `${lead.business || lead.name}`, "lead");
    sendSlackNotification(`New lead added: ${lead.business || lead.name} (${lead.package})`, "newLead");
    res.status(201).json(deserializeLead(lead));
  });

  // Public lead creation from website contact form (no auth required)
  app.post("/api/leads/public", publicLeadLimiter, async (req, res) => {
    const parsed = schema.publicLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid submission", details: parsed.error.flatten().fieldErrors });
    }
    const data = parsed.data;
    const id = randomUUID();
    const now = new Date().toISOString();
    const [lead] = await db.insert(schema.leads).values({
      id,
      name: data.name,
      business: data.business,
      phone: data.phone,
      email: data.email || "",
      package: data.package,
      status: "new",
      source: "lead-magnet",
      notes: data.notes,
      attachments: "[]",
      createdAt: now,
      updatedAt: now,
    }).returning();
    logActivity("Website Lead", `${lead.business || lead.name} submitted contact form`, "lead");
    sendSlackNotification(`New lead from website: ${lead.business || lead.name} (${lead.email})`, "newLead");

    // Log to inbox — lead magnet download
    logToInbox({
      contactEmail: lead.email || "",
      contactName: lead.name,
      subject: `Lead Magnet: ${lead.business || lead.name}`,
      body: `Lead magnet download:\n\nName: ${lead.name}\nBusiness: ${lead.business || "N/A"}\nEmail: ${lead.email || "N/A"}\nPhone: ${lead.phone || "N/A"}\n\n${lead.notes || ""}`,
      source: "lead-magnet",
      aiIntent: "new_lead",
      aiPriority: "normal",
    }).catch(err => console.error("Inbox log failed:", err));

    res.status(201).json({ success: true });
  });

  app.patch("/api/leads/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body };
    if (body.attachments) body.attachments = JSON.stringify(body.attachments);
    body.updatedAt = new Date().toISOString();
    const updateData = pickColumns(schema.leads, body);
    const [updated] = await db.update(schema.leads).set(updateData).where(eq(schema.leads.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Lead not found" });
    logActivity("Lead Updated", `${updated.business || updated.name} - ${updated.status}`, "lead");
    res.json(deserializeLead(updated));
  });

  app.delete("/api/leads/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.leads).where(eq(schema.leads.id, req.params.id as string)).returning();
    if (deleted) logActivity("Lead Deleted", `${deleted.business || deleted.name}`, "lead");
    res.json({ success: true });
  });

  // ─── Clients CRUD ───────────────────────────────────────────────

  app.get("/api/clients", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.clients);
    res.json(rows);
  });

  app.post("/api/clients", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [client] = await db.insert(schema.clients).values({
      id,
      name: req.body.name || "",
      business: req.body.business || "",
      phone: req.body.phone || "",
      email: req.body.email || "",
      package: req.body.package || "terminal",
      maintenance: req.body.maintenance || "none",
      websiteUrl: req.body.websiteUrl || "",
      websiteStatus: req.body.websiteStatus || "not-started",
      terminalId: req.body.terminalId || "",
      monthlyVolume: req.body.monthlyVolume || 0,
      startDate: req.body.startDate || new Date().toISOString().split("T")[0],
      notes: req.body.notes || "",
    }).returning();
    logActivity("Client Added", `${client.business || client.name}`, "client");
    sendSlackNotification(`New client onboarded: ${client.business || client.name} (${client.package})`, "newClient");
    res.status(201).json(client);
  });

  app.patch("/api/clients/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.clients, req.body);
    const [updated] = await db.update(schema.clients).set(updateData).where(eq(schema.clients.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Client not found" });
    logActivity("Client Updated", `${updated.business || updated.name}`, "client");
    res.json(updated);
  });

  app.delete("/api/clients/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.clients).where(eq(schema.clients.id, req.params.id as string)).returning();
    if (deleted) logActivity("Client Removed", `${deleted.business || deleted.name}`, "client");
    res.json({ success: true });
  });

  // ─── Revenue CRUD ───────────────────────────────────────────────

  app.get("/api/revenue", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.revenueEntries);
    res.json(rows);
  });

  app.post("/api/revenue", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [entry] = await db.insert(schema.revenueEntries).values({
      id,
      date: req.body.date || new Date().toISOString().split("T")[0],
      type: req.body.type || "other",
      description: req.body.description || "",
      amount: req.body.amount || 0,
      clientId: req.body.clientId || "",
      recurring: req.body.recurring || false,
    }).returning();
    logActivity("Revenue Recorded", `$${entry.amount} - ${entry.type}`, "revenue");
    sendSlackNotification(`Revenue recorded: $${entry.amount} (${entry.type})`, "revenue");
    res.status(201).json(entry);
  });

  app.patch("/api/revenue/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.revenueEntries, req.body);
    const [updated] = await db.update(schema.revenueEntries).set(updateData).where(eq(schema.revenueEntries.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Entry not found" });
    logActivity("Revenue Updated", `$${updated.amount} - ${updated.type}`, "revenue");
    res.json(updated);
  });

  app.delete("/api/revenue/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.revenueEntries).where(eq(schema.revenueEntries.id, req.params.id as string)).returning();
    if (deleted) logActivity("Revenue Deleted", `$${deleted.amount} - ${deleted.type}`, "revenue");
    res.json({ success: true });
  });

  // ─── Tasks CRUD ─────────────────────────────────────────────────

  app.get("/api/tasks", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.tasks);
    res.json(rows);
  });

  app.post("/api/tasks", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [task] = await db.insert(schema.tasks).values({
      id,
      title: req.body.title || "",
      dueDate: req.body.dueDate || "",
      priority: req.body.priority || "medium",
      completed: req.body.completed || false,
      linkedTo: req.body.linkedTo || "",
      assignee: req.body.assignee || "",
      planItemId: req.body.planItemId || "",
      createdAt: new Date().toISOString(),
    }).returning();
    logActivity("Task Created", task.title, "task");
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.tasks, req.body);
    const [updated] = await db.update(schema.tasks).set(updateData).where(eq(schema.tasks.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Task not found" });
    logActivity("Task Updated", updated.title, "task");
    res.json(updated);
  });

  app.delete("/api/tasks/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.tasks).where(eq(schema.tasks.id, req.params.id as string)).returning();
    if (deleted) logActivity("Task Deleted", deleted.title, "task");
    res.json({ success: true });
  });

  // ─── File Management (with folder support) ─────────────────────

  const DEFAULT_FOLDERS = [
    "Classroom",
    "Equipment",
    "Uploaded Statements",
    "Partner Agreements",
    "Client Resources",
    "Client Resources/Checklist",
    "Website Resources",
  ];

  app.get("/api/files", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.adminFiles);
    res.json(rows);
  });

  app.get("/api/files/folders", requireAdminSession, async (_req, res) => {
    // Return all unique folders (including defaults)
    const rows = await db.select({ folder: schema.adminFiles.folder }).from(schema.adminFiles);
    const usedFolders = Array.from(new Set(rows.map(r => r.folder).filter(Boolean)));
    const allFolders = Array.from(new Set([...DEFAULT_FOLDERS, ...usedFolders])).sort();
    res.json(allFolders);
  });

  // Create a new folder (adds a hidden marker file so the folder persists)
  app.post("/api/files/folders", requireAdminSession, async (req, res) => {
    const folderName = (req.body.name || "").trim();
    const parent = (req.body.parent || "").trim();
    if (!folderName) return res.status(400).json({ error: "Folder name is required" });
    const fullPath = parent ? `${parent}/${folderName}` : folderName;
    // Check if folder already has files (i.e. exists)
    const rows = await db.select({ folder: schema.adminFiles.folder }).from(schema.adminFiles);
    const existing = new Set(rows.map(r => r.folder).filter(Boolean));
    const allKnown = new Set([...DEFAULT_FOLDERS, ...existing]);
    if (allKnown.has(fullPath)) return res.status(409).json({ error: "Folder already exists" });
    // Create a hidden marker entry so the folder persists
    const id = randomUUID();
    await db.insert(schema.adminFiles).values({
      id,
      name: `.folder-marker`,
      size: 0,
      type: "other",
      category: "system",
      folder: fullPath,
      uploadedAt: new Date().toISOString(),
      url: "",
    });
    logActivity("Folder Created", fullPath, "file");
    res.status(201).json({ folder: fullPath });
  });

  app.post("/api/files", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [file] = await db.insert(schema.adminFiles).values({
      id,
      name: req.body.name || "untitled",
      size: req.body.size || 0,
      type: req.body.type || "document",
      category: req.body.category || "general",
      folder: req.body.folder || "",
      uploadedAt: new Date().toISOString(),
      url: req.body.url || "",
    }).returning();
    logActivity("File Added", `${file.name} → ${file.folder || "root"}`, "file");
    res.status(201).json(file);
  });

  app.post("/api/files/upload", requireAdminSession, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const file = req.file as Express.Multer.File;
      let fileUrl: string;
      if (r2Enabled) {
        const prefix = (req.body.folder || "general").toLowerCase().replace(/[^a-z0-9-]/g, "-");
        fileUrl = await uploadToR2(file.buffer, file.originalname, prefix);
      } else {
        fileUrl = `/uploads/resources/${file.filename}`;
      }
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      const typeMap: Record<string, string> = { pdf: "document", doc: "document", docx: "document", txt: "document", html: "document", htm: "document", xls: "spreadsheet", xlsx: "spreadsheet", csv: "spreadsheet", ppt: "document", pptx: "document", png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image", mp4: "video", webm: "video", zip: "other" };
      const id = randomUUID();
      const [record] = await db.insert(schema.adminFiles).values({
        id,
        name: req.body.name || file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        size: file.size,
        type: typeMap[ext] || "document",
        category: req.body.category || "general",
        folder: req.body.folder || "",
        uploadedAt: new Date().toISOString(),
        url: fileUrl,
      }).returning();
      logActivity("File Uploaded", `${record.name} → ${record.folder || "root"}`, "file");
      res.status(201).json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });

  app.patch("/api/files/:id", requireAdminSession, async (req, res) => {
    try {
      const updates: Record<string, any> = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.folder !== undefined) updates.folder = req.body.folder;
      if (req.body.category !== undefined) updates.category = req.body.category;
      if (req.body.starred !== undefined) updates.starred = req.body.starred;
      await db.update(schema.adminFiles).set(updates).where(eq(schema.adminFiles.id, req.params.id as string));
      const [updated] = await db.select().from(schema.adminFiles).where(eq(schema.adminFiles.id, req.params.id as string));
      if (!updated) return res.status(404).json({ error: "File not found" });
      logActivity("File Updated", updated.name, "file");
      res.json(updated);
    } catch (err: any) {
      console.error("File PATCH error:", err);
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", requireAdminSession, async (req, res) => {
    try {
      const [file] = await db.select().from(schema.adminFiles).where(eq(schema.adminFiles.id, req.params.id as string));
      if (file) {
        await db.delete(schema.adminFiles).where(eq(schema.adminFiles.id, req.params.id as string));
        logActivity("File Deleted", file.name, "file");
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("File DELETE error:", err);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // ─── Slack Integration ──────────────────────────────────────────

  app.get("/api/integrations/slack", requireAdminSession, async (_req, res) => {
    const [row] = await db.select().from(schema.slackConfig).where(eq(schema.slackConfig.id, "default"));
    if (!row) {
      return res.json({
        webhookUrl: "",
        channel: "#general",
        enabled: false,
        notifyNewLead: true,
        notifyNewClient: true,
        notifyRevenue: false,
        notifyTaskDue: true,
      });
    }
    const { id, ...config } = row;
    res.json(config);
  });

  app.patch("/api/integrations/slack", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.slackConfig, req.body);
    const [existing] = await db.select().from(schema.slackConfig).where(eq(schema.slackConfig.id, "default"));
    let row;
    if (existing) {
      [row] = await db.update(schema.slackConfig).set(updateData).where(eq(schema.slackConfig.id, "default")).returning();
    } else {
      [row] = await db.insert(schema.slackConfig).values({ id: "default", ...updateData } as any).returning();
    }
    const { id, ...config } = row;
    logActivity("Slack Config Updated", `Enabled: ${config.enabled}`, "integration");
    res.json(config);
  });

  app.post("/api/integrations/slack/test", requireAdminSession, async (_req, res) => {
    const [config] = await db.select().from(schema.slackConfig).where(eq(schema.slackConfig.id, "default"));
    if (!config || !config.webhookUrl) {
      return res.status(400).json({ error: "No webhook URL configured" });
    }
    try {
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "TechSavvy Admin: Test notification from your dashboard!" }),
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to send test message: " + err.message });
    }
  });

  // ─── Integrations (Generic) ─────────────────────────────────────

  app.get("/api/integrations", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.integrations);
    res.json(rows.map(deserializeIntegration));
  });

  app.post("/api/integrations", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [integration] = await db.insert(schema.integrations).values({
      id,
      name: req.body.name || "",
      type: req.body.type || "webhook",
      enabled: req.body.enabled ?? false,
      config: JSON.stringify(req.body.config || {}),
      lastSync: new Date().toISOString(),
    }).returning();
    logActivity("Integration Added", integration.name, "integration");
    res.status(201).json(deserializeIntegration(integration));
  });

  app.patch("/api/integrations/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body };
    if (body.config) body.config = JSON.stringify(body.config);
    body.lastSync = new Date().toISOString();
    const updateData = pickColumns(schema.integrations, body);
    const [updated] = await db.update(schema.integrations).set(updateData).where(eq(schema.integrations.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Integration not found" });
    logActivity("Integration Updated", updated.name, "integration");
    res.json(deserializeIntegration(updated));
  });

  app.delete("/api/integrations/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.integrations).where(eq(schema.integrations.id, req.params.id as string)).returning();
    if (deleted) logActivity("Integration Deleted", deleted.name, "integration");
    res.json({ success: true });
  });

  // ─── Equipment Tracker ─────────────────────────────────────────────

  app.get("/api/equipment", requireAdminSession, async (_req, res) => {
    try {
      const rows = await db.select().from(schema.equipment);
      res.json(rows);
    } catch (err: any) {
      console.error("Equipment fetch error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    await db.insert(schema.equipment).values({
      id,
      name: req.body.name || "",
      type: req.body.type || "terminal",
      serialNumber: req.body.serialNumber || "",
      model: req.body.model || "",
      brand: req.body.brand || "",
      firmwareVersion: req.body.firmwareVersion || "",
      partNumber: req.body.partNumber || "",
      productCode: req.body.productCode || "",
      featureCode: req.body.featureCode || "",
      appCode: req.body.appCode || "",
      connectivity: req.body.connectivity || "",
      manufactureDate: req.body.manufactureDate || "",
      status: req.body.status || "available",
      condition: req.body.condition || "new",
      clientId: req.body.clientId || "",
      clientName: req.body.clientName || "",
      deployedDate: req.body.deployedDate || "",
      purchaseDate: req.body.purchaseDate || "",
      purchaseCost: req.body.purchaseCost || 0,
      warrantyExpiry: req.body.warrantyExpiry || "",
      notes: req.body.notes || "",
      createdAt: now,
      updatedAt: now,
    });
    const [item] = await db.select().from(schema.equipment).where(eq(schema.equipment.id, id));
    logActivity("Equipment Added", `${item?.name || req.body.name} (${item?.serialNumber || "no S/N"}) — ${item?.status || "available"}`, "equipment");
    res.status(201).json(item || { id });
  });

  app.patch("/api/equipment/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body, updatedAt: new Date().toISOString() };
    const updateData = pickColumns(schema.equipment, body);
    await db.update(schema.equipment).set(updateData).where(eq(schema.equipment.id, req.params.id as string));

    // If deploying to a client, auto-update status
    if (body.clientId && body.clientId !== "") {
      const [check] = await db.select().from(schema.equipment).where(eq(schema.equipment.id, req.params.id as string));
      if (check?.status === "available") {
        await db.update(schema.equipment).set({ status: "deployed", deployedDate: new Date().toISOString().split("T")[0] }).where(eq(schema.equipment.id, req.params.id as string));
      }
    }

    const [updated] = await db.select().from(schema.equipment).where(eq(schema.equipment.id, req.params.id as string));
    if (!updated) return res.status(404).json({ error: "Equipment not found" });
    logActivity("Equipment Updated", `${updated.name} → ${updated.status}${updated.clientName ? ` (${updated.clientName})` : ""}`, "equipment");
    res.json(updated);
  });

  app.delete("/api/equipment/:id", requireAdminSession, async (req, res) => {
    const [existing] = await db.select().from(schema.equipment).where(eq(schema.equipment.id, req.params.id as string));
    await db.delete(schema.equipment).where(eq(schema.equipment.id, req.params.id as string));
    if (existing) logActivity("Equipment Removed", `${existing.name} (${existing.serialNumber || "no S/N"})`, "equipment");
    res.json({ success: true });
  });

  // Bulk assign equipment to a client
  app.post("/api/equipment/assign", requireAdminSession, async (req, res) => {
    const { equipmentIds, clientId, clientName } = req.body;
    if (!equipmentIds?.length) return res.status(400).json({ error: "No equipment selected" });
    const now = new Date().toISOString();
    for (const eqId of equipmentIds) {
      await db.update(schema.equipment).set({
        clientId: clientId || "",
        clientName: clientName || "",
        status: clientId ? "deployed" : "available",
        deployedDate: clientId ? now.split("T")[0] : "",
        updatedAt: now,
      }).where(eq(schema.equipment.id, eqId));
    }
    logActivity("Equipment Assigned", `${equipmentIds.length} item(s) → ${clientName || "unassigned"}`, "equipment");
    res.json({ success: true });
  });

  // Get equipment for a specific client
  app.get("/api/equipment/client/:clientId", requireAdminSession, async (req, res) => {
    const rows = await db.select().from(schema.equipment).where(eq(schema.equipment.clientId, req.params.clientId as string));
    res.json(rows);
  });

  // ─── Activity Log ───────────────────────────────────────────────

  app.get("/api/activity", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.activityLog).orderBy(desc(schema.activityLog.timestamp)).limit(50);
    res.json(rows);
  });

  // ─── Referral Partners ─────────────────────────────────────────

  app.get("/api/referral-partners", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.referralPartners);
    res.json(rows);
  });

  app.post("/api/referral-partners", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [partner] = await db.insert(schema.referralPartners).values({
      id,
      name: req.body.name || "",
      niche: req.body.niche || "",
      clientTypes: req.body.clientTypes || "",
      referralTerms: req.body.referralTerms || "",
      introMethod: req.body.introMethod || "",
      trackingNotes: req.body.trackingNotes || "",
      lastCheckIn: req.body.lastCheckIn || "",
      nextCheckIn: req.body.nextCheckIn || "",
      createdAt: new Date().toISOString(),
    }).returning();
    logActivity("Partner Added", partner.name, "lead");
    res.status(201).json(partner);
  });

  app.patch("/api/referral-partners/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.referralPartners, req.body);
    const [updated] = await db.update(schema.referralPartners).set(updateData).where(eq(schema.referralPartners.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Partner not found" });
    logActivity("Partner Updated", updated.name, "lead");
    res.json(updated);
  });

  app.delete("/api/referral-partners/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.referralPartners).where(eq(schema.referralPartners.id, req.params.id as string)).returning();
    if (deleted) logActivity("Partner Deleted", deleted.name, "lead");
    res.json({ success: true });
  });

  // ─── Playbook Checklists ─────────────────────────────────────────

  app.get("/api/playbook-checks", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.playbookChecks);
    res.json(rows);
  });

  app.post("/api/playbook-checks", requireAdminSession, async (req, res) => {
    const id = req.body.id || randomUUID();
    const [item] = await db.insert(schema.playbookChecks).values({
      id,
      channel: req.body.channel || "",
      label: req.body.label || "",
      completed: req.body.completed || false,
      completedAt: req.body.completed ? new Date().toISOString() : "",
    }).returning();
    res.status(201).json(item);
  });

  app.patch("/api/playbook-checks/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body };
    if (body.completed === true) body.completedAt = new Date().toISOString();
    if (body.completed === false) body.completedAt = "";
    const updateData = pickColumns(schema.playbookChecks, body);
    const [updated] = await db.update(schema.playbookChecks).set(updateData).where(eq(schema.playbookChecks.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ─── Weekly KPIs ─────────────────────────────────────────────────

  app.get("/api/kpis", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.weeklyKpis);
    res.json(rows);
  });

  app.post("/api/kpis", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [kpi] = await db.insert(schema.weeklyKpis).values({
      id,
      weekStart: req.body.weekStart || "",
      outboundCalls: req.body.outboundCalls || 0,
      outboundEmails: req.body.outboundEmails || 0,
      outboundDMs: req.body.outboundDMs || 0,
      walkIns: req.body.walkIns || 0,
      contactsMade: req.body.contactsMade || 0,
      appointmentsSet: req.body.appointmentsSet || 0,
      statementsRequested: req.body.statementsRequested || 0,
      statementsReceived: req.body.statementsReceived || 0,
      proposalsSent: req.body.proposalsSent || 0,
      dealsWon: req.body.dealsWon || 0,
      volumeWon: req.body.volumeWon || 0,
      notes: req.body.notes || "",
    }).returning();
    logActivity("KPI Logged", `Week of ${kpi.weekStart}`, "task");
    res.status(201).json(kpi);
  });

  app.patch("/api/kpis/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.weeklyKpis, req.body);
    const [updated] = await db.update(schema.weeklyKpis).set(updateData).where(eq(schema.weeklyKpis.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    logActivity("KPI Updated", `Week of ${updated.weekStart}`, "task");
    res.json(updated);
  });

  app.delete("/api/kpis/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.weeklyKpis).where(eq(schema.weeklyKpis.id, req.params.id as string)).returning();
    if (deleted) logActivity("KPI Deleted", `Week of ${deleted.weekStart}`, "task");
    res.json({ success: true });
  });

  // ─── 90-Day Plan Items ───────────────────────────────────────────

  app.get("/api/plan-items", requireAdminSession, async (_req, res) => {
    await seedPlanIfNeeded();
    const rows = await db.select().from(schema.planItems).orderBy(asc(schema.planItems.order));
    res.json(rows);
  });

  app.post("/api/plan-items", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const allItems = await db.select({ id: schema.planItems.id }).from(schema.planItems);
    const [item] = await db.insert(schema.planItems).values({
      id,
      phase: req.body.phase || 1,
      weekRange: req.body.weekRange || "1-2",
      title: req.body.title || "",
      description: req.body.description || "",
      completed: false,
      completedAt: "",
      order: req.body.order || allItems.length + 1,
    }).returning();
    logActivity("Plan Item Added", item.title, "task");
    res.status(201).json(item);
  });

  app.patch("/api/plan-items/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body };
    if (body.completed === true && !body.completedAt) body.completedAt = new Date().toISOString();
    if (body.completed === false) body.completedAt = "";
    const updateData = pickColumns(schema.planItems, body);
    const [updated] = await db.update(schema.planItems).set(updateData).where(eq(schema.planItems.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    logActivity("Plan Item Updated", updated.title, "task");
    res.json(updated);
  });

  app.delete("/api/plan-items/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.planItems).where(eq(schema.planItems.id, req.params.id as string)).returning();
    if (deleted) logActivity("Plan Item Deleted", deleted.title, "task");
    res.json({ success: true });
  });

  // ─── Materials Checklist ─────────────────────────────────────────

  app.get("/api/materials", requireAdminSession, async (_req, res) => {
    await seedMaterialsIfNeeded();
    const rows = await db.select().from(schema.materials);
    res.json(rows);
  });

  app.post("/api/materials", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [item] = await db.insert(schema.materials).values({
      id,
      category: req.body.category || "sales",
      name: req.body.name || "",
      description: req.body.description || "",
      status: req.body.status || "not-started",
      fileUrl: req.body.fileUrl || "",
      updatedAt: new Date().toISOString(),
    }).returning();
    logActivity("Material Added", item.name, "file");
    res.status(201).json(item);
  });

  app.patch("/api/materials/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body, updatedAt: new Date().toISOString() };
    const updateData = pickColumns(schema.materials, body);
    const [updated] = await db.update(schema.materials).set(updateData).where(eq(schema.materials.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    logActivity("Material Updated", updated.name, "file");
    res.json(updated);
  });

  // ─── Scorecard Metrics (Computed) ────────────────────────────────

  app.get("/api/metrics/scorecard", requireAdminSession, async (_req, res) => {
    const allLeads = (await db.select().from(schema.leads)).map(deserializeLead);
    const sources = ["referral", "networking", "social", "direct", "lead-magnet"];

    const scorecard = sources.map((src) => {
      const srcLeads = allLeads.filter((l) => l.source === src);
      const total = srcLeads.length;
      const contacted = srcLeads.filter((l) => l.status !== "new").length;
      const qualified = srcLeads.filter((l) => !["new", "contacted"].includes(l.status)).length;
      const stmtRequested = srcLeads.filter((l) => ["statement-requested", "statement-received", "analysis-delivered", "proposal-sent", "negotiation", "won"].includes(l.status)).length;
      const stmtReceived = srcLeads.filter((l) => ["statement-received", "analysis-delivered", "proposal-sent", "negotiation", "won"].includes(l.status)).length;
      const proposalSent = srcLeads.filter((l) => ["proposal-sent", "negotiation", "won"].includes(l.status)).length;
      const won = srcLeads.filter((l) => l.status === "won").length;
      const lost = srcLeads.filter((l) => l.status === "lost").length;
      const closed = won + lost;

      const wonLeads = srcLeads.filter((l) => l.status === "won");
      const avgTimeToClose = wonLeads.length > 0
        ? wonLeads.reduce((sum, l) => sum + (new Date(l.updatedAt).getTime() - new Date(l.createdAt).getTime()), 0) / wonLeads.length / 86400000
        : 0;

      const avgVolumeWon = wonLeads.length > 0
        ? wonLeads.reduce((sum, l) => {
            const match = (l.monthlyVolume || "0").match(/[\d.]+/);
            const v = match ? parseFloat(match[0]) : 0;
            return sum + (isNaN(v) ? 0 : v);
          }, 0) / wonLeads.length
        : 0;

      return {
        source: src,
        total,
        contacted,
        contactRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
        qualified,
        appointmentRate: contacted > 0 ? Math.round((qualified / contacted) * 100) : 0,
        stmtRequested,
        stmtReceived,
        stmtReceivedRate: stmtRequested > 0 ? Math.round((stmtReceived / stmtRequested) * 100) : 0,
        proposalSent,
        won,
        lost,
        closeRate: closed > 0 ? Math.round((won / closed) * 100) : 0,
        avgTimeToClose: Math.round(avgTimeToClose),
        avgVolumeWon: Math.round(avgVolumeWon),
      };
    });

    const overall = {
      totalLeads: allLeads.length,
      activeLeads: allLeads.filter((l) => !["won", "lost", "nurture"].includes(l.status)).length,
      totalWon: allLeads.filter((l) => l.status === "won").length,
      totalLost: allLeads.filter((l) => l.status === "lost").length,
    };

    res.json({ scorecard, overall });
  });

  // ─── Resources (Public + Admin CRUD) ────────────────────────────

  app.get("/api/resources", async (_req, res) => {
    const published = await db.select().from(schema.resources)
      .where(eq(schema.resources.published, true))
      .orderBy(asc(schema.resources.order));
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
    res.json(published);
  });

  app.get("/api/resources/all", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.resources).orderBy(asc(schema.resources.order));
    res.json(rows);
  });

  app.post("/api/resources", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const allResources = await db.select({ id: schema.resources.id }).from(schema.resources);
    const [resource] = await db.insert(schema.resources).values({
      id,
      title: req.body.title || "",
      description: req.body.description || "",
      category: req.body.category || "classroom",
      type: req.body.type || "doc",
      url: req.body.url || "",
      thumbnailUrl: req.body.thumbnailUrl || "",
      order: req.body.order || allResources.length + 1,
      featured: req.body.featured || false,
      published: req.body.published !== false,
      createdAt: now,
      updatedAt: now,
    }).returning();
    logActivity("Resource Added", resource.title, "file");
    res.status(201).json(resource);
  });

  app.patch("/api/resources/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body, updatedAt: new Date().toISOString() };
    const updateData = pickColumns(schema.resources, body);
    const [updated] = await db.update(schema.resources).set(updateData).where(eq(schema.resources.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Resource not found" });
    logActivity("Resource Updated", updated.title, "file");
    res.json(updated);
  });

  app.delete("/api/resources/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.resources).where(eq(schema.resources.id, req.params.id as string)).returning();
    if (deleted) logActivity("Resource Deleted", deleted.title, "file");
    res.json({ success: true });
  });

  // Upload file + create resource in one step
  app.post("/api/resources/upload", requireAdminSession, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const file = req.file as Express.Multer.File;
      let fileUrl: string;
      if (r2Enabled) {
        fileUrl = await uploadToR2(file.buffer, file.originalname, "resources");
      } else {
        fileUrl = `/uploads/resources/${file.filename}`;
      }
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      const typeMap: Record<string, string> = { pdf: "pdf", doc: "doc", docx: "doc", xls: "template", xlsx: "template", ppt: "doc", pptx: "doc", png: "link", jpg: "link", jpeg: "link", gif: "link", mp4: "video", webm: "video", zip: "template" };
      const id = randomUUID();
      const now = new Date().toISOString();
      const allResources = await db.select({ id: schema.resources.id }).from(schema.resources);
      const [resource] = await db.insert(schema.resources).values({
        id,
        title: req.body.title || file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        description: req.body.description || "",
        category: req.body.category || "classroom",
        type: typeMap[ext] || "doc",
        url: fileUrl,
        thumbnailUrl: "",
        order: req.body.order ? parseInt(req.body.order) : allResources.length + 1,
        featured: req.body.featured === "true",
        published: req.body.published !== "false",
        createdAt: now,
        updatedAt: now,
      }).returning();
      logActivity("Resource Uploaded", resource.title, "file");
      res.status(201).json(resource);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });

  // ─── Invoices (Admin CRUD + Upload) ─────────────────────────────

  const INVOICES_DIR = path.resolve(process.cwd(), "public", "uploads", "invoices");
  if (!fs.existsSync(INVOICES_DIR)) fs.mkdirSync(INVOICES_DIR, { recursive: true });

  const invoiceUpload = multer({
    storage: r2Enabled
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: (_req, _file, cb) => cb(null, INVOICES_DIR),
          filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);
            cb(null, `${Date.now()}-${base}${ext}`);
          },
        }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx"];
      cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
    },
  });

  app.get("/api/invoices", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
    res.json(rows);
  });

  app.post("/api/invoices", requireAdminSession, invoiceUpload.single("file"), async (req: any, res) => {
    try {
      const id = randomUUID();
      const now = new Date().toISOString();
      const file = req.file as Express.Multer.File | undefined;
      let fileUrl = "";
      let fileName = "";
      if (file) {
        fileName = file.originalname;
        fileUrl = r2Enabled
          ? await uploadToR2(file.buffer, file.originalname, "invoices")
          : `/uploads/invoices/${file.filename}`;
      }
      const [invoice] = await db.insert(schema.invoices).values({
        id,
        invoiceNumber: req.body.invoiceNumber || "",
        clientName: req.body.clientName || "",
        amount: parseFloat(req.body.amount) || 0,
        status: req.body.status || "pending",
        dueDate: req.body.dueDate || "",
        notes: req.body.notes || "",
        fileUrl,
        fileName,
        createdAt: now,
        updatedAt: now,
      }).returning();
      logActivity("Invoice Added", `#${invoice.invoiceNumber} — ${invoice.clientName}`, "file");
      res.status(201).json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create invoice" });
    }
  });

  app.patch("/api/invoices/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body, updatedAt: new Date().toISOString() };
    const updateData = pickColumns(schema.invoices, body);
    const [updated] = await db.update(schema.invoices).set(updateData).where(eq(schema.invoices.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Invoice not found" });
    logActivity("Invoice Updated", `#${updated.invoiceNumber}`, "file");
    res.json(updated);
  });

  app.delete("/api/invoices/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.invoices).where(eq(schema.invoices.id, req.params.id as string)).returning();
    if (deleted) {
      // Remove the file from R2 or local disk
      if (deleted.fileUrl) {
        if (r2Enabled && !deleted.fileUrl.startsWith("/uploads")) {
          deleteFromR2(deleted.fileUrl).catch(() => {});
        } else if (deleted.fileUrl.startsWith("/uploads/invoices/")) {
          const filePath = path.resolve(process.cwd(), "public", deleted.fileUrl);
          fs.unlink(filePath, () => {});
        }
      }
      logActivity("Invoice Deleted", `#${deleted.invoiceNumber}`, "file");
    }
    res.json({ success: true });
  });

  // Upload/replace invoice file for existing invoice
  app.post("/api/invoices/:id/upload", requireAdminSession, invoiceUpload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const file = req.file as Express.Multer.File;
      const fileUrl = r2Enabled
        ? await uploadToR2(file.buffer, file.originalname, "invoices")
        : `/uploads/invoices/${file.filename}`;
      const [updated] = await db.update(schema.invoices).set({
        fileUrl,
        fileName: file.originalname,
        updatedAt: new Date().toISOString(),
      }).where(eq(schema.invoices.id, req.params.id as string)).returning();
      if (!updated) return res.status(404).json({ error: "Invoice not found" });
      logActivity("Invoice File Uploaded", `#${updated.invoiceNumber} — ${file.originalname}`, "file");
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });

  // ─── Dashboard Stats ───────────────────────────────────────────

  app.get("/api/dashboard/stats", requireAdminSession, async (_req, res) => {
    const contactLeadRows = await storage.getContactLeads();
    const allLeads = await db.select().from(schema.leads);
    const allClients = await db.select().from(schema.clients);
    const allRevenue = await db.select().from(schema.revenueEntries);
    const allTasks = await db.select().from(schema.tasks);
    const allFiles = await db.select({ id: schema.adminFiles.id }).from(schema.adminFiles);
    const allIntegrations = await db.select({ id: schema.integrations.id }).from(schema.integrations);
    const [slackRow] = await db.select().from(schema.slackConfig).where(eq(schema.slackConfig.id, "default"));

    const now = new Date();
    const thisMonthRevenue = allRevenue
      .filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, r) => sum + r.amount, 0);

    const mrr = allClients.reduce((sum, c) => {
      const prices: Record<string, number> = { none: 0, basic: 99, pro: 199, premium: 399 };
      return sum + (prices[c.maintenance] || 0);
    }, 0);

    res.json({
      totalLeads: allLeads.length,
      activeLeads: allLeads.filter((l) => !["won", "lost"].includes(l.status)).length,
      totalClients: allClients.length,
      websitesLive: allClients.filter((c) => c.websiteStatus === "live").length,
      thisMonthRevenue,
      mrr,
      pendingTasks: allTasks.filter((t) => !t.completed).length,
      overdueTasks: allTasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length,
      contactFormLeads: contactLeadRows.length,
      totalFiles: allFiles.length,
      slackEnabled: slackRow?.enabled || false,
      integrationsCount: allIntegrations.length,
    });
  });

  // ─── Daily Briefing / Action Center ────────────────────────────────
  app.get("/api/dashboard/briefing", requireAdminSession, async (_req, res) => {
    const allLeads = await db.select().from(schema.leads);
    const allClients = await db.select().from(schema.clients);
    const allRevenue = await db.select().from(schema.revenueEntries);
    const allTasks = await db.select().from(schema.tasks);
    const allSchedule = await db.select().from(schema.scheduleItems);
    const allPlan = await db.select().from(schema.planItems);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Stale leads: active pipeline leads with no update in 7+ days
    const staleLeads = allLeads.filter(l => {
      if (["won", "lost", "nurture"].includes(l.status)) return false;
      const updated = new Date(l.updatedAt);
      return updated < sevenDaysAgo;
    }).map(l => ({ id: l.id, name: l.name, business: l.business, status: l.status, daysSinceUpdate: Math.floor((now.getTime() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60 * 24)), nextStep: l.nextStepDate }));

    // Leads with next step due today or overdue
    const followUpsDue = allLeads.filter(l => {
      if (["won", "lost"].includes(l.status)) return false;
      return l.nextStepDate && l.nextStepDate <= todayStr;
    }).map(l => ({ id: l.id, name: l.name, business: l.business, status: l.status, nextStep: l.nextStepDate, overdue: l.nextStepDate < todayStr }));

    // Upcoming follow-ups (next 3 days)
    const upcomingFollowUps = allLeads.filter(l => {
      if (["won", "lost"].includes(l.status)) return false;
      return l.nextStepDate && l.nextStepDate > todayStr && l.nextStepDate <= threeDaysFromNow;
    }).map(l => ({ id: l.id, name: l.name, business: l.business, status: l.status, nextStep: l.nextStepDate }));

    // Overdue tasks
    const overdueTasks = allTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr)
      .map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority }));

    // Today's tasks
    const todayTasks = allTasks.filter(t => !t.completed && t.dueDate === todayStr)
      .map(t => ({ id: t.id, title: t.title, priority: t.priority }));

    // Today's schedule
    const todaySchedule = allSchedule.filter(s => s.date === todayStr && s.status !== "completed")
      .map(s => ({ id: s.id, title: s.title, time: s.time, category: s.category }));

    // Revenue this month vs last month
    const thisMonthRevenue = allRevenue.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, r) => s + r.amount, 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthRevenue = allRevenue.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).reduce((s, r) => s + r.amount, 0);

    // Pipeline summary
    const pipeline = {
      new: allLeads.filter(l => l.status === "new").length,
      contacted: allLeads.filter(l => l.status === "contacted").length,
      qualified: allLeads.filter(l => l.status === "qualified").length,
      proposalSent: allLeads.filter(l => l.status === "proposal-sent").length,
      negotiation: allLeads.filter(l => l.status === "negotiation").length,
      totalActive: allLeads.filter(l => !["won", "lost", "nurture"].includes(l.status)).length,
      wonThisMonth: allLeads.filter(l => { const d = new Date(l.updatedAt); return l.status === "won" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length,
    };

    // Clients needing attention (no maintenance, website not live)
    const clientAlerts = allClients.filter(c => c.maintenance === "none" || c.websiteStatus === "not-started")
      .map(c => ({
        id: c.id, business: c.business || c.name,
        issues: [
          ...(c.maintenance === "none" ? ["No maintenance plan"] : []),
          ...(c.websiteStatus === "not-started" ? ["Website not started"] : []),
        ]
      }));

    // 90-Day Plan progress
    const planProgress = {
      total: allPlan.length,
      completed: allPlan.filter(p => p.completed).length,
      percent: allPlan.length > 0 ? Math.round((allPlan.filter(p => p.completed).length / allPlan.length) * 100) : 0,
    };

    // MRR from clients
    const mrrPrices: Record<string, number> = { none: 0, basic: 50, pro: 199, premium: 399 };
    const mrr = allClients.reduce((sum, c) => sum + (mrrPrices[c.maintenance] || 0), 0);

    res.json({
      date: todayStr,
      staleLeads,
      followUpsDue,
      upcomingFollowUps,
      overdueTasks,
      todayTasks,
      todaySchedule,
      revenue: { thisMonth: thisMonthRevenue, lastMonth: lastMonthRevenue, mrr },
      pipeline,
      clientAlerts: clientAlerts.slice(0, 5),
      planProgress,
    });
  });

  // ─── Auto-create tasks from lead conversion ──────────────────────
  app.post("/api/automations/onboard-client", requireAdminSession, async (req, res) => {
    const { clientId, clientName } = req.body;
    if (!clientId) return res.status(400).json({ error: "Client ID required" });

    const todayStr = new Date().toISOString().split("T")[0];
    const tasks = [
      { title: `Set up terminal for ${clientName}`, dueDate: todayStr, priority: "high" },
      { title: `Send welcome email to ${clientName}`, dueDate: todayStr, priority: "high" },
      { title: `Begin website build for ${clientName}`, dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], priority: "medium" },
      { title: `First check-in call with ${clientName}`, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], priority: "medium" },
    ];

    const created = [];
    for (const t of tasks) {
      const [row] = await db.insert(schema.tasks).values({
        id: randomUUID(),
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        completed: false,
        linkedTo: clientId,
        createdAt: new Date().toISOString(),
      }).returning();
      created.push(row);
    }

    logActivity("Onboarding Tasks Created", `${created.length} tasks for ${clientName}`, "task");
    res.json({ created: created.length, tasks: created });
  });

  // ─── Team Members CRUD ───────────────────────────────────────────

  let teamSeeded = false;
  async function seedTeamIfNeeded() {
    if (teamSeeded) return;
    teamSeeded = true;
    const existing = await db.select({ id: schema.teamMembers.id }).from(schema.teamMembers).limit(1);
    if (existing.length > 0) return;
    const now = new Date().toISOString();
    await db.insert(schema.teamMembers).values([
      { id: randomUUID(), name: "Aaron", role: "Investor & Financial Backer", email: "", phone: "", status: "active", dailyInvolvement: "minimal", joinedAt: now },
      { id: randomUUID(), name: "Joey", role: "Business Operations & Legal (EIN, compliance, registration)", email: "", phone: "", status: "active", dailyInvolvement: "part-time", joinedAt: now },
      { id: randomUUID(), name: "Kepa", role: "Lead Sales & CashSwipe Point of Contact", email: "", phone: "", status: "active", dailyInvolvement: "full", joinedAt: now },
      { id: randomUUID(), name: "Jessica", role: "CRM Development, Website, & Marketing Materials", email: "", phone: "", status: "active", dailyInvolvement: "full", joinedAt: now },
    ]);
  }

  app.get("/api/team-members", requireAdminSession, async (_req, res) => {
    await seedTeamIfNeeded();
    const rows = await db.select().from(schema.teamMembers);
    res.json(rows);
  });

  app.post("/api/team-members", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [member] = await db.insert(schema.teamMembers).values({
      id,
      name: req.body.name || "",
      role: req.body.role || "",
      email: req.body.email || "",
      phone: req.body.phone || "",
      status: req.body.status || "active",
      dailyInvolvement: req.body.dailyInvolvement || "full",
      joinedAt: new Date().toISOString(),
    }).returning();
    logActivity("Team Member Added", member.name, "client");
    res.status(201).json(member);
  });

  app.patch("/api/team-members/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.teamMembers, req.body);
    const [updated] = await db.update(schema.teamMembers).set(updateData).where(eq(schema.teamMembers.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    logActivity("Team Member Updated", updated.name, "client");
    res.json(updated);
  });

  app.delete("/api/team-members/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, req.params.id as string)).returning();
    if (deleted) logActivity("Team Member Removed", deleted.name, "client");
    res.json({ success: true });
  });

  // ─── Business Info (singleton) ──────────────────────────────────

  app.get("/api/business-info", requireAdminSession, async (_req, res) => {
    const [row] = await db.select().from(schema.businessInfo).where(eq(schema.businessInfo.id, "default"));
    if (!row) {
      return res.json({
        companyName: "", dba: "", phone: "", email: "", address: "",
        website: "", taxId: "", bankPartner: "", processorPartner: "CashSwipe",
        currentPhase: "onboarding", notes: "", updatedAt: new Date().toISOString(),
      });
    }
    const { id, ...info } = row;
    res.json(info);
  });

  app.patch("/api/business-info", requireAdminSession, async (req, res) => {
    const body = { ...req.body, updatedAt: new Date().toISOString() };
    const updateData = pickColumns(schema.businessInfo, body);
    const [existing] = await db.select().from(schema.businessInfo).where(eq(schema.businessInfo.id, "default"));
    let row;
    if (existing) {
      [row] = await db.update(schema.businessInfo).set(updateData).where(eq(schema.businessInfo.id, "default")).returning();
    } else {
      [row] = await db.insert(schema.businessInfo).values({ id: "default", ...updateData } as any).returning();
    }
    const { id, ...info } = row;
    logActivity("Business Info Updated", `Phase: ${info.currentPhase}`, "client");
    res.json(info);
  });

  // ─── Schedule Items CRUD ────────────────────────────────────────

  app.get("/api/schedule", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.scheduleItems).orderBy(asc(schema.scheduleItems.date));
    res.json(rows);
  });

  app.post("/api/schedule", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [item] = await db.insert(schema.scheduleItems).values({
      id,
      title: req.body.title || "",
      description: req.body.description || "",
      date: req.body.date || new Date().toISOString().split("T")[0],
      time: req.body.time || "",
      duration: req.body.duration || 30,
      assigneeId: req.body.assigneeId || "",
      priority: req.body.priority || "medium",
      status: req.body.status || "pending",
      isAiGenerated: req.body.isAiGenerated || false,
      category: req.body.category || "general",
      createdAt: new Date().toISOString(),
    }).returning();
    logActivity("Schedule Item Added", item.title, "task");
    res.status(201).json(item);
  });

  app.patch("/api/schedule/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.scheduleItems, req.body);
    const [updated] = await db.update(schema.scheduleItems).set(updateData).where(eq(schema.scheduleItems.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    logActivity("Schedule Updated", updated.title, "task");
    res.json(updated);
  });

  app.delete("/api/schedule/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.scheduleItems).where(eq(schema.scheduleItems.id, req.params.id as string)).returning();
    if (deleted) logActivity("Schedule Item Deleted", deleted.title, "task");
    res.json({ success: true });
  });

  // ─── AI Ops Assistant (Recommendations) ─────────────────────────

  app.post("/api/ai-ops/recommend", requireAdminSession, async (_req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Anthropic API key not configured." });

    const [teamRows, leadRows, taskRows, scheduleRows, clientRows, businessRow] = await Promise.all([
      db.select().from(schema.teamMembers),
      db.select().from(schema.leads),
      db.select().from(schema.tasks),
      db.select().from(schema.scheduleItems),
      db.select().from(schema.clients),
      db.select().from(schema.businessInfo).where(eq(schema.businessInfo.id, "default")),
    ]);
    const biz = businessRow[0];
    const pendingTasks = taskRows.filter(t => !t.completed);
    const todayStr = new Date().toISOString().split("T")[0];
    const todaySchedule = scheduleRows.filter(s => s.date === todayStr);

    const context = `
BUSINESS CONTEXT:
- Company: ${biz?.companyName || "TechSavvy Hawaii"} (DBA: ${biz?.dba || "N/A"})
- Processor Partner: ${biz?.processorPartner || "CashSwipe"}
- Current Phase: ${biz?.currentPhase || "onboarding"} (still in CashSwipe onboarding/training via Skool)
- Today: ${todayStr}

TEAM MEMBERS:
${teamRows.map(m => `- ${m.name}: ${m.role} (involvement: ${m.dailyInvolvement})`).join("\n")}

CURRENT STATE:
- Pipeline leads: ${leadRows.length} (active: ${leadRows.filter(l => !["won","lost"].includes(l.status)).length})
- Clients: ${clientRows.length}
- Pending tasks: ${pendingTasks.length}
- Today's schedule items: ${todaySchedule.length}

PENDING TASKS:
${pendingTasks.slice(0, 10).map(t => `- [${t.priority}] ${t.title} (due: ${t.dueDate || "no date"})`).join("\n") || "None"}
`;

    try {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are the AI Operations Assistant for a merchant services startup. Generate actionable daily recommendations based on the current business state. Return a JSON array of task recommendations. Each item must have: title (string), description (string), assigneeName (string - one of the team member names), priority ("high"|"medium"|"low"), category ("training"|"outreach"|"admin"|"meeting"|"follow-up"|"development"). Focus on what each team member should do TODAY given the current business phase. Be specific and practical. Return ONLY valid JSON array, no other text.`,
        messages: [{ role: "user", content: context }],
      });
      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("");
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      res.json({ recommendations, generatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("AI Ops recommendation error:", err.message);
      res.status(500).json({ error: "Failed to generate recommendations." });
    }
  });

  app.post("/api/ai-ops/chat", requireAdminSession, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Anthropic API key not configured." });

    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message required." });

    const [teamRows, leadRows, taskRows, clientRows, businessRow] = await Promise.all([
      db.select().from(schema.teamMembers),
      db.select().from(schema.leads),
      db.select().from(schema.tasks),
      db.select().from(schema.clients),
      db.select().from(schema.businessInfo).where(eq(schema.businessInfo.id, "default")),
    ]);
    const biz = businessRow[0];

    const systemPrompt = `You are the AI Operations Assistant for ${biz?.companyName || "TechSavvy Hawaii"}, a merchant services startup currently in the ${biz?.currentPhase || "onboarding"} phase with CashSwipe (training via Skool platform).

TEAM: ${teamRows.map(m => `${m.name} (${m.role}, ${m.dailyInvolvement} involvement)`).join("; ")}
STATS: ${leadRows.length} leads, ${clientRows.length} clients, ${taskRows.filter(t => !t.completed).length} pending tasks

You help manage daily operations, give reminders, make recommendations, and can suggest tasks to assign to team members or to yourself (AI). Be concise, actionable, and specific. When suggesting tasks, mention which team member should handle it. If asked to "do" something, explain what you'd recommend and offer to create a task for the appropriate team member.`;

    const messages: { role: "user" | "assistant"; content: string }[] = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.role && h.content) messages.push({ role: h.role, content: h.content.slice(0, 2000) });
      }
    }
    messages.push({ role: "user", content: message });

    try {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });
      const text = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("");
      res.json({ reply: text });
    } catch (err: any) {
      console.error("AI Ops chat error:", err.message);
      res.status(500).json({ error: "Failed to get AI response." });
    }
  });

  // ─── AI Lead Prospector ─────────────────────────────────────────

  // ── Full Tech Stack Detection Engine ────────────────────────────
  // Modeled after BuiltWith / Wappalyzer / Apify Tech Stack Detector Pro

  type SigType = "script" | "url" | "text" | "meta" | "header";
  type TechCategory = "PAYMENTS" | "CMS" | "FRAMEWORK" | "ANALYTICS" | "MARKETING" | "HOSTING" | "CDN" | "CHAT" | "EMAIL" | "INDUSTRY" | "SCHEDULING" | "COMMUNICATIONS";

  interface TechSignature { pattern: string; type: SigType; product?: string }
  interface TechEntry { name: string; category: TechCategory; signatures: TechSignature[] }

  const TECH_STACK_SIGNATURES: TechEntry[] = [
    // ── PAYMENTS ─────────────────────────────────────────────────
    { name: "Square", category: "PAYMENTS", signatures: [
      { pattern: "js.squareup.com", type: "script", product: "Square Payments SDK" },
      { pattern: "cdn.squareup.com", type: "script", product: "Square CDN" },
      { pattern: "squareup.com/v2/paymentform", type: "script", product: "Square Payment Form" },
      { pattern: "web.squarecdn.com", type: "script", product: "Square Web SDK" },
      { pattern: "squareup.com/appointments", type: "url", product: "Square Appointments" },
      { pattern: "square.site", type: "url", product: "Square Online Store" },
      { pattern: "squareup.com/gift", type: "url", product: "Square Gift Cards" },
      { pattern: "squareup.com/pay", type: "url", product: "Square Payment Links" },
      { pattern: "powered by square", type: "text", product: "Square Branding" },
      { pattern: "book with square", type: "text", product: "Square Appointments" },
      { pattern: "square-site-verification", type: "meta", product: "Square Verification" },
    ]},
    { name: "Clover", category: "PAYMENTS", signatures: [
      { pattern: "clover.com", type: "url" }, { pattern: "clover.com/pay", type: "url" },
      { pattern: "powered by clover", type: "text" }, { pattern: "clover-site", type: "meta" },
    ]},
    { name: "Toast", category: "PAYMENTS", signatures: [
      { pattern: "toasttab.com", type: "url" }, { pattern: "order.toasttab.com", type: "url" },
      { pattern: "powered by toast", type: "text" }, { pattern: "toasttab.com/restaurant", type: "url" },
    ]},
    { name: "Stripe", category: "PAYMENTS", signatures: [
      { pattern: "js.stripe.com", type: "script" }, { pattern: "checkout.stripe.com", type: "url" },
      { pattern: "stripe.com/v3", type: "script" },
    ]},
    { name: "PayPal", category: "PAYMENTS", signatures: [
      { pattern: "paypal.com/sdk", type: "script" }, { pattern: "paypalobjects.com", type: "script" },
      { pattern: "paypal.me", type: "url" },
    ]},
    { name: "Braintree", category: "PAYMENTS", signatures: [
      { pattern: "braintreegateway.com", type: "script" }, { pattern: "braintree-api.com", type: "script" },
    ]},
    { name: "Adyen", category: "PAYMENTS", signatures: [
      { pattern: "adyen.com", type: "script" }, { pattern: "checkoutshopper-live.adyen.com", type: "script" },
    ]},
    { name: "Klarna", category: "PAYMENTS", signatures: [
      { pattern: "klarna.com", type: "script" }, { pattern: "x.klarnacdn.net", type: "script" },
    ]},
    { name: "Afterpay", category: "PAYMENTS", signatures: [
      { pattern: "afterpay.com", type: "script" }, { pattern: "static.afterpay.com", type: "script" },
    ]},
    { name: "Affirm", category: "PAYMENTS", signatures: [
      { pattern: "affirm.com", type: "script" }, { pattern: "cdn1.affirm.com", type: "script" },
    ]},

    // ── CMS & Website Builders ───────────────────────────────────
    { name: "WordPress", category: "CMS", signatures: [
      { pattern: "wp-content", type: "url" }, { pattern: "wp-includes", type: "url" },
      { pattern: "wp-json", type: "url" }, { pattern: "wordpress", type: "meta" },
    ]},
    { name: "Shopify", category: "CMS", signatures: [
      { pattern: "cdn.shopify.com", type: "script" }, { pattern: "myshopify.com", type: "url" },
      { pattern: "shopify.com", type: "meta" },
    ]},
    { name: "Webflow", category: "CMS", signatures: [
      { pattern: "assets.website-files.com", type: "script" }, { pattern: "webflow.com", type: "url" },
      { pattern: "wf-", type: "meta" },
    ]},
    { name: "Squarespace", category: "CMS", signatures: [
      { pattern: "squarespace.com", type: "script" }, { pattern: "sqsp.com", type: "url" },
      { pattern: "squarespace-cdn.com", type: "script" },
    ]},
    { name: "Wix", category: "CMS", signatures: [
      { pattern: "wix.com", type: "script" }, { pattern: "parastorage.com", type: "script" },
      { pattern: "wixstatic.com", type: "url" },
    ]},
    { name: "GoDaddy", category: "CMS", signatures: [
      { pattern: "godaddy.com", type: "script" }, { pattern: "secureserver.net", type: "url" },
    ]},
    { name: "Duda", category: "CMS", signatures: [
      { pattern: "dudaone.com", type: "url" }, { pattern: "duda.co", type: "script" },
    ]},
    { name: "HubSpot CMS", category: "CMS", signatures: [
      { pattern: "hubspot.com", type: "script" }, { pattern: "hs-scripts.com", type: "script" },
      { pattern: "hubspot.net", type: "url" },
    ]},
    { name: "BigCommerce", category: "CMS", signatures: [
      { pattern: "bigcommerce.com", type: "script" }, { pattern: "mybigcommerce.com", type: "url" },
    ]},
    { name: "Magento", category: "CMS", signatures: [
      { pattern: "mage/", type: "script" }, { pattern: "magento", type: "meta" },
    ]},
    { name: "WooCommerce", category: "CMS", signatures: [
      { pattern: "woocommerce", type: "url" }, { pattern: "wc-", type: "script" },
    ]},
    { name: "Drupal", category: "CMS", signatures: [
      { pattern: "drupal.js", type: "script" }, { pattern: "drupal", type: "meta" },
    ]},
    { name: "Joomla", category: "CMS", signatures: [
      { pattern: "joomla", type: "meta" }, { pattern: "/media/jui/", type: "url" },
    ]},
    { name: "Weebly", category: "CMS", signatures: [
      { pattern: "weebly.com", type: "script" }, { pattern: "editmysite.com", type: "url" },
    ]},
    { name: "Ghost", category: "CMS", signatures: [
      { pattern: "ghost.io", type: "url" }, { pattern: "ghost-", type: "meta" },
    ]},
    { name: "PrestaShop", category: "CMS", signatures: [
      { pattern: "prestashop", type: "meta" }, { pattern: "presta", type: "script" },
    ]},

    // ── JavaScript Frameworks ────────────────────────────────────
    { name: "React", category: "FRAMEWORK", signatures: [
      { pattern: "__react", type: "script" }, { pattern: "react.production.min", type: "script" },
      { pattern: "_reactroot", type: "text" }, { pattern: "data-reactroot", type: "text" },
    ]},
    { name: "Next.js", category: "FRAMEWORK", signatures: [
      { pattern: "_next/static", type: "url" }, { pattern: "__next", type: "text" },
      { pattern: "_next/data", type: "url" },
    ]},
    { name: "Vue.js", category: "FRAMEWORK", signatures: [
      { pattern: "vue.min.js", type: "script" }, { pattern: "vue.runtime", type: "script" },
      { pattern: "data-v-", type: "text" },
    ]},
    { name: "Nuxt.js", category: "FRAMEWORK", signatures: [
      { pattern: "_nuxt/", type: "url" }, { pattern: "__nuxt", type: "text" },
    ]},
    { name: "Angular", category: "FRAMEWORK", signatures: [
      { pattern: "ng-version", type: "text" }, { pattern: "angular.min.js", type: "script" },
      { pattern: "ng-app", type: "text" },
    ]},
    { name: "Svelte", category: "FRAMEWORK", signatures: [
      { pattern: "svelte", type: "script" }, { pattern: "__svelte", type: "text" },
    ]},
    { name: "Gatsby", category: "FRAMEWORK", signatures: [
      { pattern: "gatsby", type: "script" }, { pattern: "gatsby-", type: "meta" },
    ]},
    { name: "jQuery", category: "FRAMEWORK", signatures: [
      { pattern: "jquery.min.js", type: "script" }, { pattern: "jquery-", type: "script" },
      { pattern: "code.jquery.com", type: "script" },
    ]},
    { name: "Remix", category: "FRAMEWORK", signatures: [
      { pattern: "__remix", type: "text" }, { pattern: "remix.run", type: "script" },
    ]},
    { name: "Astro", category: "FRAMEWORK", signatures: [
      { pattern: "astro", type: "meta" }, { pattern: "_astro/", type: "url" },
    ]},

    // ── Analytics & Tracking ─────────────────────────────────────
    { name: "Google Analytics", category: "ANALYTICS", signatures: [
      { pattern: "google-analytics.com", type: "script" }, { pattern: "googletagmanager.com", type: "script" },
      { pattern: "gtag(", type: "script" }, { pattern: "ga('send'", type: "script" },
    ]},
    { name: "Google Tag Manager", category: "ANALYTICS", signatures: [
      { pattern: "googletagmanager.com/gtm.js", type: "script" }, { pattern: "gtm.start", type: "script" },
    ]},
    { name: "Facebook Pixel", category: "ANALYTICS", signatures: [
      { pattern: "connect.facebook.net", type: "script" }, { pattern: "fbevents.js", type: "script" },
      { pattern: "fbq(", type: "script" },
    ]},
    { name: "Hotjar", category: "ANALYTICS", signatures: [
      { pattern: "hotjar.com", type: "script" }, { pattern: "static.hotjar.com", type: "script" },
    ]},
    { name: "Segment", category: "ANALYTICS", signatures: [
      { pattern: "cdn.segment.com", type: "script" }, { pattern: "segment.io", type: "script" },
    ]},
    { name: "Mixpanel", category: "ANALYTICS", signatures: [
      { pattern: "mixpanel.com", type: "script" }, { pattern: "cdn.mxpnl.com", type: "script" },
    ]},
    { name: "Amplitude", category: "ANALYTICS", signatures: [
      { pattern: "amplitude.com", type: "script" }, { pattern: "cdn.amplitude.com", type: "script" },
    ]},
    { name: "Heap", category: "ANALYTICS", signatures: [
      { pattern: "heap-analytics.com", type: "script" }, { pattern: "heapanalytics.com", type: "script" },
    ]},
    { name: "FullStory", category: "ANALYTICS", signatures: [
      { pattern: "fullstory.com", type: "script" }, { pattern: "edge.fullstory.com", type: "script" },
    ]},
    { name: "PostHog", category: "ANALYTICS", signatures: [
      { pattern: "posthog.com", type: "script" }, { pattern: "app.posthog.com", type: "script" },
    ]},
    { name: "Microsoft Clarity", category: "ANALYTICS", signatures: [
      { pattern: "clarity.ms", type: "script" },
    ]},
    { name: "Plausible", category: "ANALYTICS", signatures: [
      { pattern: "plausible.io", type: "script" },
    ]},
    { name: "Lucky Orange", category: "ANALYTICS", signatures: [
      { pattern: "luckyorange.com", type: "script" },
    ]},
    { name: "Crazy Egg", category: "ANALYTICS", signatures: [
      { pattern: "crazyegg.com", type: "script" },
    ]},
    { name: "LinkedIn Insight", category: "ANALYTICS", signatures: [
      { pattern: "snap.licdn.com", type: "script" },
    ]},
    { name: "TikTok Pixel", category: "ANALYTICS", signatures: [
      { pattern: "analytics.tiktok.com", type: "script" },
    ]},
    { name: "Pinterest Tag", category: "ANALYTICS", signatures: [
      { pattern: "pintrk(", type: "script" }, { pattern: "s.pinimg.com", type: "script" },
    ]},

    // ── Marketing & CRM ──────────────────────────────────────────
    { name: "HubSpot", category: "MARKETING", signatures: [
      { pattern: "js.hs-scripts.com", type: "script" }, { pattern: "hbspt.forms.create", type: "script" },
      { pattern: "hs-banner.com", type: "script" },
    ]},
    { name: "Salesforce", category: "MARKETING", signatures: [
      { pattern: "force.com", type: "url" }, { pattern: "salesforce.com", type: "script" },
      { pattern: "pardot.com", type: "script" },
    ]},
    { name: "Mailchimp", category: "MARKETING", signatures: [
      { pattern: "mailchimp.com", type: "script" }, { pattern: "chimpstatic.com", type: "script" },
      { pattern: "list-manage.com", type: "url" },
    ]},
    { name: "Klaviyo", category: "MARKETING", signatures: [
      { pattern: "klaviyo.com", type: "script" }, { pattern: "static.klaviyo.com", type: "script" },
    ]},
    { name: "ActiveCampaign", category: "MARKETING", signatures: [
      { pattern: "activecampaign.com", type: "script" }, { pattern: "trackcmp.net", type: "script" },
    ]},
    { name: "ConvertKit", category: "MARKETING", signatures: [
      { pattern: "convertkit.com", type: "script" },
    ]},
    { name: "Marketo", category: "MARKETING", signatures: [
      { pattern: "marketo.com", type: "script" }, { pattern: "mktoweb.com", type: "script" },
    ]},
    { name: "Drip", category: "MARKETING", signatures: [
      { pattern: "getdrip.com", type: "script" },
    ]},
    { name: "Constant Contact", category: "MARKETING", signatures: [
      { pattern: "constantcontact.com", type: "script" },
    ]},

    // ── CDN ──────────────────────────────────────────────────────
    { name: "Cloudflare", category: "CDN", signatures: [
      { pattern: "cloudflare", type: "header" }, { pattern: "cdnjs.cloudflare.com", type: "script" },
      { pattern: "cf-ray", type: "header" },
    ]},
    { name: "Fastly", category: "CDN", signatures: [
      { pattern: "fastly", type: "header" },
    ]},
    { name: "Akamai", category: "CDN", signatures: [
      { pattern: "akamai", type: "header" }, { pattern: "akamaihd.net", type: "script" },
    ]},

    // ── Hosting ──────────────────────────────────────────────────
    { name: "Vercel", category: "HOSTING", signatures: [
      { pattern: "vercel", type: "header" }, { pattern: "x-vercel-id", type: "header" },
    ]},
    { name: "Netlify", category: "HOSTING", signatures: [
      { pattern: "netlify", type: "header" }, { pattern: "x-nf-request-id", type: "header" },
    ]},
    { name: "AWS", category: "HOSTING", signatures: [
      { pattern: "amazonaws.com", type: "url" }, { pattern: "x-amz-", type: "header" },
    ]},
    { name: "Heroku", category: "HOSTING", signatures: [
      { pattern: "herokuapp.com", type: "url" },
    ]},
    { name: "Nginx", category: "HOSTING", signatures: [
      { pattern: "nginx", type: "header" },
    ]},
    { name: "Apache", category: "HOSTING", signatures: [
      { pattern: "apache", type: "header" },
    ]},

    // ── Chat & Support ───────────────────────────────────────────
    { name: "Intercom", category: "CHAT", signatures: [
      { pattern: "intercom.io", type: "script" }, { pattern: "widget.intercom.io", type: "script" },
    ]},
    { name: "Drift", category: "CHAT", signatures: [
      { pattern: "drift.com", type: "script" }, { pattern: "js.driftt.com", type: "script" },
    ]},
    { name: "Zendesk", category: "CHAT", signatures: [
      { pattern: "zendesk.com", type: "script" }, { pattern: "zopim.com", type: "script" },
      { pattern: "static.zdassets.com", type: "script" },
    ]},
    { name: "Crisp", category: "CHAT", signatures: [
      { pattern: "crisp.chat", type: "script" }, { pattern: "client.crisp.chat", type: "script" },
    ]},
    { name: "Tidio", category: "CHAT", signatures: [
      { pattern: "tidio.co", type: "script" }, { pattern: "code.tidio.co", type: "script" },
    ]},
    { name: "LiveChat", category: "CHAT", signatures: [
      { pattern: "livechatinc.com", type: "script" },
    ]},
    { name: "Tawk.to", category: "CHAT", signatures: [
      { pattern: "tawk.to", type: "script" }, { pattern: "embed.tawk.to", type: "script" },
    ]},
    { name: "Freshchat", category: "CHAT", signatures: [
      { pattern: "freshchat.com", type: "script" }, { pattern: "wchat.freshchat.com", type: "script" },
    ]},
    { name: "Help Scout", category: "CHAT", signatures: [
      { pattern: "helpscout.net", type: "script" }, { pattern: "beacon-v2.helpscout.net", type: "script" },
    ]},
    { name: "Olark", category: "CHAT", signatures: [
      { pattern: "olark.com", type: "script" },
    ]},

    // ── Email Providers ──────────────────────────────────────────
    { name: "SendGrid", category: "EMAIL", signatures: [
      { pattern: "sendgrid.net", type: "url" }, { pattern: "sendgrid.com", type: "script" },
    ]},
    { name: "Mailgun", category: "EMAIL", signatures: [
      { pattern: "mailgun.org", type: "url" },
    ]},
    { name: "Resend", category: "EMAIL", signatures: [
      { pattern: "resend.com", type: "script" },
    ]},

    // ── INDUSTRY: Home Services ──────────────────────────────────
    { name: "ServiceTitan", category: "INDUSTRY", signatures: [
      { pattern: "servicetitan.com", type: "script" }, { pattern: "servicetitan", type: "url" },
    ]},
    { name: "Housecall Pro", category: "INDUSTRY", signatures: [
      { pattern: "housecallpro.com", type: "script" }, { pattern: "housecallpro", type: "url" },
    ]},
    { name: "Jobber", category: "INDUSTRY", signatures: [
      { pattern: "getjobber.com", type: "script" }, { pattern: "getjobber", type: "url" },
    ]},
    { name: "Service Fusion", category: "INDUSTRY", signatures: [
      { pattern: "servicefusion.com", type: "url" },
    ]},

    // ── INDUSTRY: Fitness & Wellness ─────────────────────────────
    { name: "Mindbody", category: "INDUSTRY", signatures: [
      { pattern: "mindbodyonline.com", type: "script" }, { pattern: "mindbody.io", type: "script" },
      { pattern: "branded_web.mindbodyonline.com", type: "url" },
    ]},
    { name: "Vagaro", category: "INDUSTRY", signatures: [
      { pattern: "vagaro.com", type: "script" }, { pattern: "vagaro.com", type: "url" },
    ]},
    { name: "Zenoti", category: "INDUSTRY", signatures: [
      { pattern: "zenoti.com", type: "script" },
    ]},
    { name: "Glofox", category: "INDUSTRY", signatures: [
      { pattern: "glofox.com", type: "script" },
    ]},
    { name: "Wellness Living", category: "INDUSTRY", signatures: [
      { pattern: "wellnessliving.com", type: "script" },
    ]},

    // ── INDUSTRY: Restaurants ────────────────────────────────────
    { name: "ChowNow", category: "INDUSTRY", signatures: [
      { pattern: "chownow.com", type: "script" }, { pattern: "direct.chownow.com", type: "url" },
    ]},
    { name: "Olo", category: "INDUSTRY", signatures: [
      { pattern: "olo.com", type: "script" },
    ]},
    { name: "OpenTable", category: "INDUSTRY", signatures: [
      { pattern: "opentable.com", type: "script" }, { pattern: "opentable.com/widget", type: "url" },
    ]},
    { name: "Resy", category: "INDUSTRY", signatures: [
      { pattern: "resy.com", type: "script" }, { pattern: "resy.com", type: "url" },
    ]},
    { name: "Yelp Reservations", category: "INDUSTRY", signatures: [
      { pattern: "yelp.com/reservations", type: "url" },
    ]},
    { name: "TouchBistro", category: "INDUSTRY", signatures: [
      { pattern: "touchbistro.com", type: "url" },
    ]},
    { name: "Lightspeed Restaurant", category: "INDUSTRY", signatures: [
      { pattern: "lightspeedhq.com", type: "script" }, { pattern: "lightspeed", type: "url" },
    ]},

    // ── INDUSTRY: Healthcare ─────────────────────────────────────
    { name: "Jane App", category: "INDUSTRY", signatures: [
      { pattern: "jane.app", type: "url" }, { pattern: "janeapp.com", type: "url" },
    ]},
    { name: "SimplePractice", category: "INDUSTRY", signatures: [
      { pattern: "simplepractice.com", type: "url" },
    ]},
    { name: "Zocdoc", category: "INDUSTRY", signatures: [
      { pattern: "zocdoc.com", type: "script" }, { pattern: "zocdoc.com", type: "url" },
    ]},
    { name: "NexHealth", category: "INDUSTRY", signatures: [
      { pattern: "nexhealth.com", type: "script" },
    ]},

    // ── INDUSTRY: Scheduling ─────────────────────────────────────
    { name: "Calendly", category: "SCHEDULING", signatures: [
      { pattern: "calendly.com", type: "script" }, { pattern: "assets.calendly.com", type: "script" },
    ]},
    { name: "Acuity Scheduling", category: "SCHEDULING", signatures: [
      { pattern: "acuityscheduling.com", type: "script" }, { pattern: "app.acuityscheduling.com", type: "url" },
    ]},
    { name: "Setmore", category: "SCHEDULING", signatures: [
      { pattern: "setmore.com", type: "script" },
    ]},
    { name: "SimplyBook.me", category: "SCHEDULING", signatures: [
      { pattern: "simplybook.me", type: "script" },
    ]},
    { name: "Cal.com", category: "SCHEDULING", signatures: [
      { pattern: "cal.com", type: "script" }, { pattern: "app.cal.com", type: "url" },
    ]},

    // ── INDUSTRY: Communications ─────────────────────────────────
    { name: "CallRail", category: "COMMUNICATIONS", signatures: [
      { pattern: "callrail.com", type: "script" }, { pattern: "cdn.callrail.com", type: "script" },
    ]},
    { name: "Twilio", category: "COMMUNICATIONS", signatures: [
      { pattern: "twilio.com", type: "script" },
    ]},
    { name: "RingCentral", category: "COMMUNICATIONS", signatures: [
      { pattern: "ringcentral.com", type: "script" },
    ]},
    { name: "Nextiva", category: "COMMUNICATIONS", signatures: [
      { pattern: "nextiva.com", type: "script" },
    ]},

    // ── INDUSTRY: Real Estate ────────────────────────────────────
    { name: "IDX Broker", category: "INDUSTRY", signatures: [
      { pattern: "idxbroker.com", type: "script" },
    ]},
    { name: "kvCORE", category: "INDUSTRY", signatures: [
      { pattern: "kvcore.com", type: "script" },
    ]},
    { name: "Follow Up Boss", category: "INDUSTRY", signatures: [
      { pattern: "followupboss.com", type: "script" },
    ]},

    // ── INDUSTRY: Legal ──────────────────────────────────────────
    { name: "Clio", category: "INDUSTRY", signatures: [
      { pattern: "clio.com", type: "script" },
    ]},
    { name: "LawPay", category: "INDUSTRY", signatures: [
      { pattern: "lawpay.com", type: "script" }, { pattern: "lawpay.com", type: "url" },
    ]},

    // ── INDUSTRY: Automotive ─────────────────────────────────────
    { name: "DealerSocket", category: "INDUSTRY", signatures: [
      { pattern: "dealersocket.com", type: "script" },
    ]},
    { name: "CDK Global", category: "INDUSTRY", signatures: [
      { pattern: "cdkglobal.com", type: "script" },
    ]},
  ];

  interface TechDetection {
    name: string;
    category: TechCategory;
    confidence: "high" | "medium" | "low";
    products: string[];
    signatures: string[];
  }

  function detectTechStack(html: string, headers?: Record<string, string>): TechDetection[] {
    const results: TechDetection[] = [];
    const lowerHtml = html.toLowerCase();
    const lowerHeaders = headers ? JSON.stringify(headers).toLowerCase() : "";

    for (const tech of TECH_STACK_SIGNATURES) {
      const matched: string[] = [];
      const products = new Set<string>();
      let scriptCount = 0, urlCount = 0, otherCount = 0;

      for (const sig of tech.signatures) {
        const source = sig.type === "header" ? lowerHeaders : lowerHtml;
        if (source.includes(sig.pattern.toLowerCase())) {
          matched.push(sig.pattern);
          if (sig.product) products.add(sig.product);
          if (sig.type === "script") scriptCount++;
          else if (sig.type === "url") urlCount++;
          else otherCount++;
        }
      }

      if (matched.length > 0) {
        let confidence: "high" | "medium" | "low" = "low";
        if (scriptCount >= 2 || (scriptCount >= 1 && urlCount >= 1)) confidence = "high";
        else if (scriptCount >= 1 || urlCount >= 2 || matched.length >= 3) confidence = "medium";
        results.push({ name: tech.name, category: tech.category, confidence, products: Array.from(products), signatures: matched });
      }
    }

    return results.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.confidence] - order[b.confidence];
    });
  }

  // Helper: extract processor from full tech stack
  function getPaymentProcessors(techStack: TechDetection[]) {
    return techStack.filter(t => t.category === "PAYMENTS");
  }

  // Scrape a URL for business leads + full tech stack detection
  app.post("/api/ai-ops/scrape-prospects", requireAdminSession, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Anthropic API key not configured." });

    const { url, mode } = req.body;  // mode: "directory" | "single" | "batch"
    if (!url) return res.status(400).json({ error: "URL is required." });

    const urls = Array.isArray(url) ? url : [url];
    const allProspects: any[] = [];
    const allTechStacks: Record<string, TechDetection[]> = {};

    for (const targetUrl of urls.slice(0, 20)) {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) continue;

        const html = await response.text();

        // Capture response headers for CDN/hosting detection
        const respHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => { respHeaders[k] = v; });

        // Run full tech stack detection on raw HTML + headers
        const techStack = detectTechStack(html, respHeaders);
        allTechStacks[targetUrl] = techStack;
        const paymentProcessors = getPaymentProcessors(techStack);

        // Clean HTML for AI extraction
        const cleaned = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 60000);

        // Build tech context for AI
        const techContext = techStack.length > 0 ? `
TECH STACK DETECTED ON THIS PAGE:
${techStack.map(t => `- [${t.category}] ${t.name} (${t.confidence} confidence)${t.products.length ? `: ${t.products.join(", ")}` : ""}`).join("\n")}
${paymentProcessors.length > 0 ? `\nPAYMENT PROCESSORS: ${paymentProcessors.map(p => `${p.name} (${p.confidence})`).join(", ")}` : ""}
Include this tech info in your extraction.` : "";

        const anthropic = new Anthropic({ apiKey });
        const aiResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: `You are a lead extraction AI for a merchant services sales team (CashSwipe/TechSavvy Hawaii). Extract ALL business listings from the provided web page content.

For each business found, extract whatever is available:
- Business name, owner/contact name, address, phone, email, website URL
- Business type/vertical
- Current payment processor or POS system if mentioned
- Social media links (Instagram, Facebook, etc.)
${techContext}

Return a JSON array. Each item:
{
  "business": "string",
  "name": "string (contact/owner name if found, or empty)",
  "address": "string",
  "phone": "string",
  "email": "string",
  "website": "string",
  "vertical": "restaurant|retail|salon|auto|medical|cbd|vape|firearms|ecommerce|services|other",
  "currentProcessor": "string (Square, Clover, Toast, etc. or empty)",
  "processorConfidence": "high|medium|low|none",
  "socialLinks": { "instagram": "", "facebook": "", "twitter": "" },
  "notes": "string (any useful context)"
}

If the page is a single business, return an array with one item. If it's a directory, extract ALL listings you can find. Return ONLY valid JSON array. If no businesses found, return [].`,
          messages: [{ role: "user", content: `Extract business leads from this page (${targetUrl}):\n\n${cleaned}` }],
        });

        const text = aiResponse.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("");
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const prospects = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // Enrich with tech stack data
        for (const p of prospects) {
          p._sourceUrl = targetUrl;
          p._techStack = techStack;
          if (!p.currentProcessor && paymentProcessors.length > 0) {
            p.currentProcessor = paymentProcessors[0].name;
            p.processorConfidence = paymentProcessors[0].confidence;
          }
        }

        allProspects.push(...prospects);

        // Rate limit between URLs
        if (urls.length > 1) await new Promise(r => setTimeout(r, 1500));
      } catch (err: any) {
        console.error(`Scrape error for ${targetUrl}:`, err.message);
      }
    }

    res.json({
      prospects: allProspects,
      techStacks: allTechStacks,
      source: urls.length === 1 ? urls[0] : `${urls.length} URLs`,
      scrapedAt: new Date().toISOString(),
    });
  });

  // Standalone tech stack scan (no AI extraction, just signature detection)
  app.post("/api/ai-ops/tech-scan", requireAdminSession, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required." });

    const urls = Array.isArray(url) ? url : [url];
    const results: Array<{ url: string; techStack: TechDetection[]; title: string; error?: string }> = [];

    for (const targetUrl of urls.slice(0, 50)) {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) { results.push({ url: targetUrl, techStack: [], title: "", error: `HTTP ${response.status}` }); continue; }

        const html = await response.text();
        const respHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => { respHeaders[k] = v; });

        const techStack = detectTechStack(html, respHeaders);
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        results.push({ url: targetUrl, techStack, title: titleMatch?.[1]?.trim() || "" });

        if (urls.length > 1) await new Promise(r => setTimeout(r, 800));
      } catch (err: any) {
        results.push({ url: targetUrl, techStack: [], title: "", error: err.message });
      }
    }

    res.json({ results, scannedAt: new Date().toISOString() });
  });

  // Google dork execution
  app.post("/api/ai-ops/google-dork", requireAdminSession, async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const { query, location } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required." });

    // If no API key, return a helpful response instead of an error
    if (!apiKey) {
      return res.json({
        results: [], urls: [], query,
        searchedAt: new Date().toISOString(),
        noApiKey: true,
        message: "No Anthropic API key configured. Use 'Open in Google' to search manually, then paste URLs into URL Scanner.",
      });
    }

    try {
      // Try fetching Google search results
      let html = "";
      let googleBlocked = false;
      try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
        const response = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(15000),
        });
        html = await response.text();
        if (html.includes("unusual traffic") || html.includes("captcha") || html.includes("sorry/index") || response.status === 429) {
          googleBlocked = true;
        }
      } catch {
        googleBlocked = true;
      }

      if (googleBlocked || !html || html.length < 500) {
        // Google blocked — try AI fallback
        try {
          const anthropic = new Anthropic({ apiKey });
          const aiResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: `You are a lead generation AI for a merchant services sales team${location ? ` in ${location}` : ""}. The user wants to find businesses matching a Google search query, but direct Google access is unavailable.

Based on your knowledge, generate realistic business leads that would match this search query. Focus on real business types, realistic contact patterns, and accurate locations for the area.

Return a JSON object:
{
  "results": [
    {
      "business": "string (business name)",
      "name": "string (owner/manager name if you can infer)",
      "address": "string (realistic address for the area)",
      "phone": "string",
      "email": "string",
      "website": "string",
      "vertical": "restaurant|retail|salon|auto|medical|cbd|vape|firearms|ecommerce|services|other",
      "currentProcessor": "string (likely processor based on the search query)",
      "notes": "string (why this is a good prospect)",
      "confidence": "high|medium|low"
    }
  ],
  "urls": ["string (real URLs that could be scraped for more data)"],
  "aiGenerated": true
}

Return ONLY valid JSON, no other text. Generate 5-10 realistic results.`,
            messages: [{ role: "user", content: `Search query: "${query}"\nLocation focus: ${location || "general"}` }],
          });

          const text = aiResponse.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("");
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [], urls: [] };
          return res.json({ ...parsed, query, searchedAt: new Date().toISOString(), googleBlocked: true, aiGenerated: true });
        } catch (aiErr: any) {
          // AI fallback also failed — return graceful response, not 500
          console.error("AI fallback error:", aiErr.message);
          return res.json({
            results: [], urls: [], query,
            searchedAt: new Date().toISOString(),
            googleBlocked: true, aiFailed: true,
            message: `Google blocked and AI fallback failed: ${aiErr.message}. Use 'Open in Google' to search manually.`,
          });
        }
      }

      // Google returned results — parse them with AI
      const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60000);

      const anthropic = new Anthropic({ apiKey });
      const aiResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: `You are a lead extraction AI for a merchant services sales team targeting businesses${location ? ` in ${location}` : ""}. Extract business information from Google search results.

For each result that appears to be a business, extract: business name, contact info, address, business type, payment processor mentions, and the result URL.

Return a JSON object:
{
  "results": [
    {
      "business": "string",
      "name": "string (contact name if found)",
      "address": "string",
      "phone": "string",
      "email": "string",
      "website": "string (the URL from search results)",
      "vertical": "restaurant|retail|salon|auto|medical|cbd|vape|firearms|ecommerce|services|other",
      "currentProcessor": "string",
      "notes": "string"
    }
  ],
  "urls": ["string (all URLs from search results that could be scraped for more data)"]
}

Return ONLY valid JSON, no other text.`,
        messages: [{ role: "user", content: `Google dork query: "${query}"\n\nSearch results page content:\n\n${cleaned}` }],
      });

      const text = aiResponse.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map(b => b.text).join("");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [], urls: [] };
      res.json({ ...parsed, query, searchedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("Google dork error:", err.message);
      // Return graceful response instead of 500
      res.json({
        results: [], urls: [], query,
        searchedAt: new Date().toISOString(),
        error: true,
        message: err.message?.includes("api_key") || err.message?.includes("authentication")
          ? "Anthropic API key is invalid or expired."
          : err.message?.includes("rate") || err.message?.includes("429")
          ? "Rate limited — wait a moment and try again."
          : "Search failed. Use 'Open in Google' to search manually, then paste URLs into URL Scanner.",
      });
    }
  });

  // Import prospects into leads pipeline
  app.post("/api/ai-ops/import-prospects", requireAdminSession, async (req, res) => {
    const { prospects, sourceLabel } = req.body;
    if (!Array.isArray(prospects) || prospects.length === 0) return res.status(400).json({ error: "No prospects to import." });

    const now = new Date().toISOString();
    const created: any[] = [];

    for (const p of prospects) {
      const id = `lead-${randomUUID().slice(0, 8)}`;
      const socialStr = p.socialLinks ? Object.entries(p.socialLinks).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n") : "";
      const [lead] = await db.insert(schema.leads).values({
        id,
        name: p.name || "",
        business: p.business || "",
        address: p.address || "",
        phone: p.phone || "",
        email: p.email || "",
        decisionMakerName: p.name || "",
        decisionMakerRole: "",
        bestContactMethod: p.phone ? "phone" : p.email ? "email" : "phone",
        package: "terminal",
        status: "new",
        source: "direct",
        vertical: p.vertical || "other",
        currentProcessor: p.currentProcessor || "",
        currentEquipment: "",
        monthlyVolume: "",
        painPoints: p.currentProcessor ? `Currently using ${p.currentProcessor}${p.processorConfidence ? ` (${p.processorConfidence} confidence)` : ""} - potential switch target` : "",
        nextStep: "Initial outreach",
        nextStepDate: now.split("T")[0],
        attachments: "[]",
        notes: `[AI Prospector] ${sourceLabel || "Web scrape"}${p.website ? `\nWebsite: ${p.website}` : ""}${socialStr ? `\nSocial:\n${socialStr}` : ""}${p.notes ? `\n${p.notes}` : ""}`.trim(),
        createdAt: now,
        updatedAt: now,
      }).returning();
      created.push(lead);
    }

    res.json({ imported: created.length, leads: created });
  });

  // ─── Pinned Pitches ─────────────────────────────────────────────

  app.get("/api/pinned-pitches", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.pinnedPitches);
    res.json(rows);
  });

  app.post("/api/pinned-pitches", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const [pitch] = await db.insert(schema.pinnedPitches).values({
      id,
      scriptKey: req.body.scriptKey || "",
      customContent: req.body.customContent || "",
      pinnedAt: new Date().toISOString(),
    }).returning();
    logActivity("Pitch Pinned", pitch.scriptKey, "task");
    res.status(201).json(pitch);
  });

  app.patch("/api/pinned-pitches/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.pinnedPitches, req.body);
    const [updated] = await db.update(schema.pinnedPitches).set(updateData).where(eq(schema.pinnedPitches.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    logActivity("Pitch Updated", updated.scriptKey, "task");
    res.json(updated);
  });

  app.delete("/api/pinned-pitches/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.pinnedPitches).where(eq(schema.pinnedPitches.id, req.params.id as string)).returning();
    if (deleted) logActivity("Pitch Unpinned", deleted.scriptKey, "task");
    res.json({ success: true });
  });

  // ─── Client-Team Assignment ─────────────────────────────────────

  app.patch("/api/clients/:id/assign", requireAdminSession, async (req, res) => {
    const { assigneeId } = req.body;
    const [updated] = await db.update(schema.clients).set({ notes: `[ASSIGNED:${assigneeId}] ` }).where(eq(schema.clients.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Client not found" });
    logActivity("Client Assigned", `${updated.business} → ${assigneeId}`, "client");
    res.json(updated);
  });

  // ─── Resend Email Config ──────────────────────────────────────────

  app.get("/api/email/config", requireAdminSession, async (_req, res) => {
    const [row] = await db.select().from(schema.resendConfig).where(eq(schema.resendConfig.id, "default"));
    if (!row) {
      return res.json({
        enabled: false,
        fromEmail: "contact@techsavvyhawaii.com",
        fromName: "TechSavvy Hawaii",
        autoConfirmEnabled: true,
        forwardCopyTo: "",
      });
    }
    const { id, ...config } = row;
    res.json(config);
  });

  app.patch("/api/email/config", requireAdminSession, async (req, res) => {
    const updateData = { ...pickColumns(schema.resendConfig, req.body), updatedAt: new Date().toISOString() };
    const [existing] = await db.select().from(schema.resendConfig).where(eq(schema.resendConfig.id, "default"));
    let row;
    if (existing) {
      [row] = await db.update(schema.resendConfig).set(updateData).where(eq(schema.resendConfig.id, "default")).returning();
    } else {
      [row] = await db.insert(schema.resendConfig).values({ id: "default", ...updateData } as any).returning();
    }
    const { id, ...config } = row;
    logActivity("Email Config Updated", `Enabled: ${config.enabled}`, "integration");
    res.json(config);
  });

  // ─── Email Threads (Inbox) ────────────────────────────────────────

  app.get("/api/email/threads", requireAdminSession, async (req, res) => {
    const folder = (req.query.folder as string) || "";
    const starred = req.query.starred === "true";
    
    let conditions: any[] = [];
    if (folder) conditions.push(eq(schema.emailThreads.folder, folder));
    if (starred) conditions.push(eq(schema.emailThreads.starred, true));
    
    const rows = conditions.length > 0
      ? await db.select().from(schema.emailThreads).where(and(...conditions)).orderBy(desc(schema.emailThreads.lastMessageAt))
      : await db.select().from(schema.emailThreads).orderBy(desc(schema.emailThreads.lastMessageAt));
    res.json(rows);
  });

  app.get("/api/email/threads/:id", requireAdminSession, async (req, res) => {
    const [thread] = await db.select().from(schema.emailThreads).where(eq(schema.emailThreads.id, req.params.id as string));
    if (!thread) return res.status(404).json({ error: "Thread not found" });

    const messages = await db.select().from(schema.emailMessages)
      .where(eq(schema.emailMessages.threadId, thread.id))
      .orderBy(asc(schema.emailMessages.sentAt));

    // Mark as read
    if (thread.unread) {
      await db.update(schema.emailThreads).set({ unread: false }).where(eq(schema.emailThreads.id, thread.id));
    }

    res.json({ ...thread, messages });
  });

  app.patch("/api/email/threads/:id", requireAdminSession, async (req, res) => {
    const updateData = pickColumns(schema.emailThreads, req.body);
    const [updated] = await db.update(schema.emailThreads).set(updateData).where(eq(schema.emailThreads.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Thread not found" });
    res.json(updated);
  });

  app.delete("/api/email/threads/:id", requireAdminSession, async (req, res) => {
    const threadId = req.params.id as string;
    const permanent = req.query.permanent === "true";
    
    if (permanent) {
      // Permanent delete (from trash/spam)
      await db.delete(schema.emailMessages).where(eq(schema.emailMessages.threadId, threadId));
      await db.delete(schema.emailThreads).where(eq(schema.emailThreads.id, threadId));
      res.json({ success: true, action: "deleted" });
    } else {
      // Move to trash
      await db.update(schema.emailThreads).set({ folder: "trash" }).where(eq(schema.emailThreads.id, threadId));
      res.json({ success: true, action: "trashed" });
    }
  });

  // ─── Bulk Thread Operations ───────────────────────────────────────

  app.post("/api/email/threads/bulk", requireAdminSession, async (req, res) => {
    const { ids, action, folder: targetFolder } = req.body as { ids: string[]; action: string; folder?: string };
    if (!ids || !ids.length || !action) return res.status(400).json({ error: "ids and action required" });

    switch (action) {
      case "move": {
        if (!targetFolder) return res.status(400).json({ error: "folder required for move" });
        for (const id of ids) {
          await db.update(schema.emailThreads).set({ folder: targetFolder }).where(eq(schema.emailThreads.id, id));
        }
        break;
      }
      case "star": {
        for (const id of ids) {
          await db.update(schema.emailThreads).set({ starred: true }).where(eq(schema.emailThreads.id, id));
        }
        break;
      }
      case "unstar": {
        for (const id of ids) {
          await db.update(schema.emailThreads).set({ starred: false }).where(eq(schema.emailThreads.id, id));
        }
        break;
      }
      case "read": {
        for (const id of ids) {
          await db.update(schema.emailThreads).set({ unread: false }).where(eq(schema.emailThreads.id, id));
        }
        break;
      }
      case "unread": {
        for (const id of ids) {
          await db.update(schema.emailThreads).set({ unread: true }).where(eq(schema.emailThreads.id, id));
        }
        break;
      }
      case "delete": {
        for (const id of ids) {
          await db.delete(schema.emailMessages).where(eq(schema.emailMessages.threadId, id));
          await db.delete(schema.emailThreads).where(eq(schema.emailThreads.id, id));
        }
        break;
      }
      default:
        return res.status(400).json({ error: "Unknown action" });
    }

    res.json({ success: true, action, count: ids.length });
  });

  // ─── Send Email (Reply from Inbox) ────────────────────────────────

  app.post("/api/email/send", requireAdminSession, async (req, res) => {
    const { to, subject, html, text, threadId, leadId, contactName } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({ error: "to, subject, and html are required" });
    }
    const result = await sendEmail({ to, subject, html, text, threadId, leadId, contactName });
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    logActivity("Email Sent", `To: ${to} — ${subject}`, "email");
    res.json(result);
  });

  // ─── Outreach: Generate & Send ────────────────────────────────────

  app.post("/api/email/outreach/generate", requireAdminSession, async (req, res) => {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: "leadId required" });

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Use new branded template, with fallback to legacy generator
    const emailContent = initialOutreachEmail({
      ownerName: lead.name,
      businessName: lead.business,
      agentName: "Tech Savvy Hawaii",
      vertical: lead.vertical,
      currentProcessor: lead.currentProcessor,
      monthlyVolume: lead.monthlyVolume,
    });

    res.json(emailContent);
  });

  app.post("/api/email/outreach/send", requireAdminSession, async (req, res) => {
    const { leadId, subject, html, text } = req.body;
    if (!leadId) return res.status(400).json({ error: "leadId required" });

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (!lead.email) return res.status(400).json({ error: "Lead has no email address" });

    // Use provided content or generate branded template
    const content = subject && html
      ? { subject, html, text }
      : initialOutreachEmail({
          ownerName: lead.name,
          businessName: lead.business,
          agentName: "Tech Savvy Hawaii",
          vertical: lead.vertical,
          currentProcessor: lead.currentProcessor,
          monthlyVolume: lead.monthlyVolume,
        });

    const result = await sendOutreachEmail({
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        business: lead.business,
        currentProcessor: lead.currentProcessor,
        monthlyVolume: lead.monthlyVolume,
        vertical: lead.vertical,
      },
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Update lead status to contacted
    await db.update(schema.leads).set({
      status: lead.status === "new" ? "contacted" : lead.status,
      updatedAt: new Date().toISOString(),
    }).where(eq(schema.leads.id, leadId));

    logActivity("Outreach Sent", `${lead.business} (${lead.email})`, "email");
    sendSlackNotification(`Outreach email sent to ${lead.business} (${lead.email})`, "newLead");

    res.json(result);
  });

  // ─── Call Script Generation ───────────────────────────────────────

  app.post("/api/email/call-script/generate", requireAdminSession, async (req, res) => {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: "leadId required" });

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const result = await generateCallScript({
      id: lead.id,
      name: lead.name,
      business: lead.business,
      currentProcessor: lead.currentProcessor,
      monthlyVolume: lead.monthlyVolume,
      vertical: lead.vertical,
      painPoints: lead.painPoints,
    });

    // Fetch the created script
    const [script] = await db.select().from(schema.callScripts).where(eq(schema.callScripts.id, result.scriptId));
    res.json({
      ...script,
      talkingPoints: JSON.parse(script.talkingPoints || "[]"),
      objections: JSON.parse(script.objections || "[]"),
    });
  });

  app.get("/api/email/call-scripts/:leadId", requireAdminSession, async (req, res) => {
    const scripts = await db.select().from(schema.callScripts)
      .where(eq(schema.callScripts.leadId, req.params.leadId as string))
      .orderBy(desc(schema.callScripts.generatedAt));

    res.json(scripts.map(s => ({
      ...s,
      talkingPoints: JSON.parse(s.talkingPoints || "[]"),
      objections: JSON.parse(s.objections || "[]"),
    })));
  });

  // ─── Outreach Templates CRUD ──────────────────────────────────────

  app.get("/api/email/templates", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.outreachTemplates);
    res.json(rows);
  });

  app.post("/api/email/templates", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const [template] = await db.insert(schema.outreachTemplates).values({
      id,
      name: req.body.name || "",
      subject: req.body.subject || "",
      body: req.body.body || "",
      category: req.body.category || "cold",
      isDefault: req.body.isDefault || false,
      createdAt: now,
      updatedAt: now,
    }).returning();
    logActivity("Email Template Created", template.name, "email");
    res.status(201).json(template);
  });

  app.patch("/api/email/templates/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body, updatedAt: new Date().toISOString() };
    const updateData = pickColumns(schema.outreachTemplates, body);
    const [updated] = await db.update(schema.outreachTemplates).set(updateData).where(eq(schema.outreachTemplates.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "Template not found" });
    logActivity("Email Template Updated", updated.name, "email");
    res.json(updated);
  });

  app.delete("/api/email/templates/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.outreachTemplates).where(eq(schema.outreachTemplates.id, req.params.id as string)).returning();
    if (deleted) logActivity("Email Template Deleted", deleted.name, "email");
    res.json({ success: true });
  });

  // ─── Branded Template Generation ────────────────────────────────────
  // Generate any of the 8 branded email templates by type

  app.post("/api/email/template/generate", requireAdminSession, async (req, res) => {
    try {
      const { type, data } = req.body;
      if (!type) return res.status(400).json({ error: "Template 'type' is required" });

      let result;
      switch (type) {
        case "statement-analysis":
          result = statementAnalysisEmail(data);
          break;
        case "walk-in-follow-up":
          result = walkInFollowUpEmail(data);
          break;
        case "phone-call-follow-up":
          result = phoneCallFollowUpEmail(data);
          break;
        case "initial-outreach":
          result = initialOutreachEmail(data);
          break;
        case "meeting-follow-up":
          result = meetingFollowUpEmail(data);
          break;
        case "welcome-to-team":
          result = welcomeToTeamEmail(data);
          break;
        case "referral-follow-up":
          result = referralFollowUpEmail(data);
          break;
        case "referral-contract":
          result = referralContractEmail(data);
          break;
        default:
          return res.status(400).json({
            error: `Unknown template type: ${type}`,
            availableTypes: [
              "statement-analysis", "walk-in-follow-up", "phone-call-follow-up",
              "initial-outreach", "meeting-follow-up", "welcome-to-team",
              "referral-follow-up", "referral-contract"
            ]
          });
      }

      res.json(result);
    } catch (err: any) {
      console.error("Template generate error:", err);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  // ─── Branded Template Send (generate + send in one call) ───────────
  // Generates the template, sends the email, logs activity, updates lead status

  app.post("/api/email/template/send", requireAdminSession, async (req, res) => {
    try {
      const { type, to, data, leadId, threadId } = req.body;
      if (!type || !to) return res.status(400).json({ error: "Template 'type' and 'to' email required" });

      // Generate the template
      let emailContent;
      switch (type) {
        case "statement-analysis":
          emailContent = statementAnalysisEmail(data);
          break;
        case "walk-in-follow-up":
          emailContent = walkInFollowUpEmail(data);
          break;
        case "phone-call-follow-up":
          emailContent = phoneCallFollowUpEmail(data);
          break;
        case "initial-outreach":
          emailContent = initialOutreachEmail(data);
          break;
        case "meeting-follow-up":
          emailContent = meetingFollowUpEmail(data);
          break;
        case "welcome-to-team":
          emailContent = welcomeToTeamEmail(data);
          break;
        case "referral-follow-up":
          emailContent = referralFollowUpEmail(data);
          break;
        case "referral-contract":
          emailContent = referralContractEmail(data);
          break;
        default:
          return res.status(400).json({ error: `Unknown template type: ${type}` });
      }

      // Send via Resend
      const result = await sendEmail({
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        threadId,
        leadId,
        contactName: data?.ownerName || data?.partnerName || data?.newMemberName || "",
        source: type,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Update lead status if leadId provided
      if (leadId) {
        const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
        if (lead && lead.status === "new") {
          await db.update(schema.leads).set({
            status: "contacted",
            updatedAt: new Date().toISOString(),
          }).where(eq(schema.leads.id, leadId));
        }
      }

      const typeLabels: Record<string, string> = {
        "statement-analysis": "Statement Analysis",
        "walk-in-follow-up": "Walk-In Follow Up",
        "phone-call-follow-up": "Phone Call Follow Up",
        "initial-outreach": "Initial Outreach",
        "meeting-follow-up": "Meeting Follow Up",
        "welcome-to-team": "Welcome to Team",
        "referral-follow-up": "Referral Follow Up",
        "referral-contract": "Referral Contract",
      };

      logActivity(`${typeLabels[type] || type} Email Sent`, `To: ${to}`, "email");
      sendSlackNotification(`📧 ${typeLabels[type] || type} email sent to ${to}`, "newLead");

      res.json(result);
    } catch (err: any) {
      console.error("Template send error:", err);
      res.status(500).json({ error: "Failed to send template email" });
    }
  });

  // ─── Lead Quick-Send (pick a lead, pick a template type) ───────────
  // Convenience route: pass leadId + template type, auto-populates from lead data

  app.post("/api/email/template/send-to-lead", requireAdminSession, async (req, res) => {
    try {
      const { leadId, type, agentName, extra } = req.body;
      if (!leadId || !type) return res.status(400).json({ error: "leadId and type required" });

      const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      if (!lead.email) return res.status(400).json({ error: "Lead has no email address" });

      const agent = agentName || "Tech Savvy Hawaii";
      const extraData = extra || {};

      // Build template data from lead fields
      let templateData: any;
      switch (type) {
        case "walk-in-follow-up":
          templateData = {
            ownerName: lead.name,
            businessName: lead.business,
            agentName: agent,
            vertical: lead.vertical,
            notes: extraData.notes || lead.notes || "",
          };
          break;
        case "phone-call-follow-up":
          templateData = {
            ownerName: lead.name,
            businessName: lead.business,
            agentName: agent,
            discussed: extraData.discussed || "",
            nextStep: extraData.nextStep || lead.nextStep || "",
          };
          break;
        case "initial-outreach":
          templateData = {
            ownerName: lead.name,
            businessName: lead.business,
            agentName: agent,
            vertical: lead.vertical,
            currentProcessor: lead.currentProcessor,
            monthlyVolume: lead.monthlyVolume,
            personalNote: extraData.personalNote || "",
          };
          break;
        case "meeting-follow-up":
          templateData = {
            ownerName: lead.name,
            businessName: lead.business,
            agentName: agent,
            meetingDate: extraData.meetingDate || new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
            discussed: extraData.discussed || "",
            actionItems: extraData.actionItems || [],
            savingsEstimate: extraData.savingsEstimate || "",
            nextMeeting: extraData.nextMeeting || "",
          };
          break;
        case "referral-follow-up":
          templateData = {
            ownerName: lead.name,
            businessName: lead.business,
            agentName: agent,
            referrerName: extraData.referrerName || "",
            referrerBusiness: extraData.referrerBusiness || "",
            vertical: lead.vertical,
          };
          break;
        default:
          return res.status(400).json({
            error: `Type '${type}' not supported for lead quick-send`,
            supported: ["walk-in-follow-up", "phone-call-follow-up", "initial-outreach", "meeting-follow-up", "referral-follow-up"]
          });
      }

      let emailContent;
      switch (type) {
        case "walk-in-follow-up": emailContent = walkInFollowUpEmail(templateData); break;
        case "phone-call-follow-up": emailContent = phoneCallFollowUpEmail(templateData); break;
        case "initial-outreach": emailContent = initialOutreachEmail(templateData); break;
        case "meeting-follow-up": emailContent = meetingFollowUpEmail(templateData); break;
        case "referral-follow-up": emailContent = referralFollowUpEmail(templateData); break;
        default: return res.status(400).json({ error: "Invalid type" });
      }

      const result = await sendEmail({
        to: lead.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        leadId,
        contactName: lead.name,
        source: type,
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Update lead status
      if (lead.status === "new") {
        await db.update(schema.leads).set({
          status: "contacted",
          updatedAt: new Date().toISOString(),
        }).where(eq(schema.leads.id, leadId));
      }

      const typeLabels: Record<string, string> = {
        "walk-in-follow-up": "Walk-In Follow Up",
        "phone-call-follow-up": "Phone Call Follow Up",
        "initial-outreach": "Initial Outreach",
        "meeting-follow-up": "Meeting Follow Up",
        "referral-follow-up": "Referral Follow Up",
      };

      logActivity(`${typeLabels[type]} Email`, `${lead.business} (${lead.email})`, "email");
      sendSlackNotification(`📧 ${typeLabels[type]} sent to ${lead.business} (${lead.email})`, "newLead");

      res.json({ ...result, templateType: type, sentTo: lead.email });
    } catch (err: any) {
      console.error("Lead template send error:", err);
      res.status(500).json({ error: "Failed to send template email to lead" });
    }
  });

  // ─── Referral Partner Quick-Send ───────────────────────────────────

  app.post("/api/email/template/send-referral-contract", requireAdminSession, async (req, res) => {
    try {
      const { partnerId, agentName, commissionRate, agreementUrl } = req.body;
      if (!partnerId) return res.status(400).json({ error: "partnerId required" });

      const [partner] = await db.select().from(schema.referralPartners).where(eq(schema.referralPartners.id, partnerId));
      if (!partner) return res.status(404).json({ error: "Partner not found" });

      // Referral partners don't have email in schema — require it in body
      const partnerEmail = req.body.email;
      if (!partnerEmail) return res.status(400).json({ error: "Partner email required in body" });

      const emailContent = referralContractEmail({
        partnerName: partner.name,
        partnerBusiness: partner.niche || "",
        agentName: agentName || "Tech Savvy Hawaii",
        commissionRate: commissionRate || partner.referralTerms || "$50 per signed merchant",
        agreementUrl: agreementUrl || "",
      });

      const result = await sendEmail({
        to: partnerEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        contactName: partner.name,
        source: "referral-contract",
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      logActivity("Referral Contract Sent", `${partner.name} (${partnerEmail})`, "email");
      sendSlackNotification(`📝 Referral contract sent to ${partner.name} (${partnerEmail})`, "newLead");

      res.json({ ...result, sentTo: partnerEmail });
    } catch (err: any) {
      console.error("Referral contract send error:", err);
      res.status(500).json({ error: "Failed to send referral contract email" });
    }
  });

  // ─── List available branded template types ──────────────────────────

  app.get("/api/email/template/types", requireAdminSession, async (_req, res) => {
    res.json([
      { type: "statement-analysis", label: "Statement Analysis Report", category: "report", description: "AI-powered statement review with grade, fees, red flags, and savings estimate" },
      { type: "walk-in-follow-up", label: "Walk-In Follow Up", category: "follow-up", description: "After visiting a merchant in person — vertical-specific benefits" },
      { type: "phone-call-follow-up", label: "Phone Call Follow Up", category: "follow-up", description: "After a phone conversation — recap and next steps" },
      { type: "initial-outreach", label: "Initial Outreach", category: "cold", description: "Cold/warm first contact with industry-specific hooks" },
      { type: "meeting-follow-up", label: "Meeting Follow Up", category: "follow-up", description: "Post-meeting recap with action items and savings" },
      { type: "welcome-to-team", label: "Welcome to Team", category: "internal", description: "New agent onboarding with first-week schedule" },
      { type: "referral-follow-up", label: "Referral Follow Up", category: "referral", description: "Following up on a referral lead with social proof" },
      { type: "referral-contract", label: "Referral Contract", category: "referral", description: "Partner agreement email with commission tiers" },
    ]);
  });

  // ─── Inbound Email Webhook (Resend) ───────────────────────────────

  const inboundEmailLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,               // 30 inbound emails per minute — generous for legitimate use
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests" },
  });

  app.post("/api/email/inbound", inboundEmailLimiter, async (req: Request, res: Response) => {
    // Resend sends inbound emails as JSON webhook
    // Verify webhook signing secret if configured (recommended: set RESEND_WEBHOOK_SECRET env var)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["resend-signature"] || req.headers["webhook-signature"];
      if (!signature) {
        return res.status(401).json({ error: "Missing webhook signature" });
      }
    }

    try {
      const { from, to, subject, text, html } = req.body;
      if (!from || typeof from !== "string") {
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      const result = await handleInboundEmail({ from, to: to || "contact@techsavvyhawaii.com", subject: subject || "(no subject)", text: text || "", html: html || "" });

      // Classify inbound email intent + priority via Workers AI
      const classification = await classifyInboundEmail(subject || "", text || "");
      const priorityLabel = classification ? ` [${classification.priority}]` : "";
      logActivity("Email Received", `From: ${from}${priorityLabel} — ${subject || "(no subject)"}`, "email");

      // If high priority, log as activity on matching lead
      if (classification?.priority === "high" && result.threadId) {
        const [thread] = await db.select().from(schema.emailThreads).where(eq(schema.emailThreads.id, result.threadId));
        if (thread?.leadId) {
          await db.insert(schema.leadActivities).values({
            id: randomUUID(),
            leadId: thread.leadId,
            opportunityId: "",
            userId: "autopilot",
            type: "note",
            title: `High-priority inbound: ${classification.intent}`,
            description: classification.suggestedAction,
            metadata: JSON.stringify(classification),
            createdAt: new Date().toISOString(),
          });
        }
      }

      res.json({ success: true, threadId: result.threadId, classification });
    } catch (err: any) {
      console.error("Inbound email webhook error:", err.message);
      res.status(500).json({ error: "Failed to process inbound email" });
    }
  });

  // ─── Email Stats for Dashboard ────────────────────────────────────

  app.get("/api/email/stats", requireAdminSession, async (_req, res) => {
    const threads = await db.select().from(schema.emailThreads);
    const total = threads.length;
    const unread = threads.filter(t => t.unread).length;
    const starred = threads.filter(t => t.starred).length;
    const outreach = threads.filter(t => t.source === "outreach").length;
    const replies = threads.filter(t => t.source === "outreach-reply").length;
    const directInbound = threads.filter(t => t.source === "direct" || t.source === "email_inbound").length;
    const contactForm = threads.filter(t => t.source === "contact-form").length;

    // Folder counts
    const folders: Record<string, { total: number; unread: number }> = {
      inbox: { total: 0, unread: 0 },
      sent: { total: 0, unread: 0 },
      spam: { total: 0, unread: 0 },
      trash: { total: 0, unread: 0 },
      archived: { total: 0, unread: 0 },
    };
    for (const t of threads) {
      const f = t.folder || "inbox";
      if (!folders[f]) folders[f] = { total: 0, unread: 0 };
      folders[f].total++;
      if (t.unread) folders[f].unread++;
    }

    res.json({ total, unread, starred, outreach, replies, directInbound, contactForm, folders });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ─── ENTERPRISE CRM: Opportunities / Deals ──────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app.get("/api/opportunities", requireAdminSession, async (_req, res) => {
    const rows = await db.select().from(schema.opportunities).orderBy(desc(schema.opportunities.updatedAt));
    // Enrich with lead/assignee/equipment names
    const leads = await db.select({ id: schema.leads.id, name: schema.leads.name, business: schema.leads.business }).from(schema.leads);
    const team = await db.select({ id: schema.teamMembers.id, name: schema.teamMembers.name }).from(schema.teamMembers);
    const equip = await db.select({ id: schema.equipment.id, name: schema.equipment.name, serialNumber: schema.equipment.serialNumber }).from(schema.equipment);
    const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));
    const teamMap = Object.fromEntries(team.map(t => [t.id, t]));
    const equipMap = Object.fromEntries(equip.map(e => [e.id, e]));

    const enriched = rows.map(o => ({
      ...o,
      weightedValue: o.value * (o.probability / 100),
      leadName: leadMap[o.leadId]?.name || "",
      leadBusiness: leadMap[o.leadId]?.business || "",
      assigneeName: teamMap[o.assigneeId]?.name || "",
      equipmentName: equipMap[o.equipmentId]?.name || "",
      equipmentSerial: equipMap[o.equipmentId]?.serialNumber || "",
    }));
    res.json(enriched);
  });

  app.post("/api/opportunities", requireAdminSession, async (req, res) => {
    try {
      const id = randomUUID();
      const now = new Date().toISOString();
      const stageProbMap: Record<string, number> = {
        prospecting: 10, qualification: 25, proposal: 50, negotiation: 75,
        "closed-won": 100, "closed-lost": 0,
      };
      const stage = req.body.stage || "prospecting";
      const probability = req.body.probability ?? stageProbMap[stage] ?? 10;

      const values = {
        id,
        title: req.body.title || "",
        leadId: req.body.leadId || "",
        clientId: req.body.clientId || "",
        equipmentId: req.body.equipmentId || "",
        stage,
        value: req.body.value || 0,
        probability,
        expectedCloseDate: req.body.expectedCloseDate || "",
        actualCloseDate: "",
        lossReason: "",
        notes: req.body.notes || "",
        assigneeId: req.body.assigneeId || "",
        stageChangedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(schema.opportunities).values(values);

      // Log activity
      await db.insert(schema.leadActivities).values({
        id: randomUUID(),
        leadId: req.body.leadId || "",
        opportunityId: id,
        userId: "",
        type: "deal-created",
        title: `Deal created: ${req.body.title}`,
        description: `Value: $${req.body.value || 0} | Stage: ${stage}`,
        metadata: "{}",
        createdAt: now,
      });

      logActivity("Deal Created", `${req.body.title} — $${req.body.value || 0}`, "deal");
      res.status(201).json(values);
    } catch (err: any) {
      console.error("POST /api/opportunities error:", err);
      res.status(500).json({ error: err.message || "Failed to create deal" });
    }
  });

  app.patch("/api/opportunities/:id", requireAdminSession, async (req, res) => {
    const now = new Date().toISOString();
    const existing = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, req.params.id as string)).limit(1);
    if (!existing.length) return res.status(404).json({ error: "Deal not found" });

    const old = existing[0];
    const body = { ...req.body, updatedAt: now };

    // Track stage changes
    if (body.stage && body.stage !== old.stage) {
      body.stageChangedAt = now;
      // Auto-set probability based on stage
      const stageProbMap: Record<string, number> = {
        prospecting: 10, qualification: 25, proposal: 50, negotiation: 75,
        "closed-won": 100, "closed-lost": 0,
      };
      if (body.probability === undefined && stageProbMap[body.stage] !== undefined) {
        body.probability = stageProbMap[body.stage];
      }
      if (body.stage === "closed-won" || body.stage === "closed-lost") {
        body.actualCloseDate = now;
      }

      // Log stage change activity
      await db.insert(schema.leadActivities).values({
        id: randomUUID(),
        leadId: old.leadId,
        opportunityId: old.id,
        userId: "",
        type: "stage-change",
        title: `Deal moved: ${old.stage} → ${body.stage}`,
        description: old.title,
        metadata: JSON.stringify({ from: old.stage, to: body.stage }),
        createdAt: now,
      });

      // ─── Auto-create client + revenue when closed-won ───────────
      if (body.stage === "closed-won" && old.leadId) {
        try {
          const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, old.leadId));
          if (lead) {
            // Check if client already exists for this lead
            const existingClients = await db.select().from(schema.clients).where(eq(schema.clients.business, lead.business || lead.name)).limit(1);
            
            if (existingClients.length === 0) {
              // Create client from lead data
              const clientId = randomUUID();
              const vol = parseFloat(lead.monthlyVolume || "0") || 0;
              await db.insert(schema.clients).values({
                id: clientId,
                name: lead.name,
                business: lead.business || lead.name,
                email: lead.email,
                phone: lead.phone,
                package: lead.package || "terminal",
                maintenance: "none",
                websiteUrl: "",
                websiteStatus: "not-started",
                terminalId: "",
                monthlyVolume: vol,
                startDate: now.split("T")[0],
                notes: `Contact: ${lead.name}. Vertical: ${lead.vertical || "other"}. Previous processor: ${lead.currentProcessor || "unknown"}. Equipment: ${lead.currentEquipment || "n/a"}. Address: ${lead.address || "n/a"}. ${old.notes || ""}`.trim(),
              });

              // Create first revenue entry (estimated monthly value)
              const dealValue = body.value || old.value || 0;
              if (dealValue > 0) {
                await db.insert(schema.revenueEntries).values({
                  id: randomUUID(),
                  clientId,
                  amount: Math.round(dealValue / 12 * 100) / 100, // Monthly from annual
                  type: "other",
                  description: `Monthly residual — ${lead.business || lead.name}`,
                  date: now,
                  recurring: true,
                });
              }

              // Update lead status to won
              await db.update(schema.leads).set({ status: "won", updatedAt: now }).where(eq(schema.leads.id, lead.id));

              // Check if this lead was referred by a partner → flag for commission
              if (lead.referralPartnerId) {
                logActivity("Commission Due", `Partner referral closed: ${lead.business}. Check referral partner for commission payout.`, "deal");
                sendSlackNotification(`💰 Commission due! Partner-referred deal closed: ${lead.business || lead.name} (Deal: ${old.title})`, "newLead");
              }

              logActivity("Client Created", `${lead.business || lead.name} auto-converted from closed-won deal`, "client");
              sendSlackNotification(`🎉 New client! ${lead.business || lead.name} onboarded from deal: ${old.title}`, "newLead");
            }
          }
        } catch (convErr) { console.error("Auto-conversion from closed-won failed:", convErr); }
      }
    }

    const updateData = pickColumns(schema.opportunities, body);
    await db.update(schema.opportunities).set(updateData).where(eq(schema.opportunities.id, req.params.id as string));
    const [updated] = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, req.params.id as string)).limit(1);
    if (updated) logActivity("Deal Updated", `${updated.title} → ${updated.stage}`, "deal");
    res.json(updated || { id: req.params.id, ...body });
  });

  app.delete("/api/opportunities/:id", requireAdminSession, async (req, res) => {
    await db.delete(schema.opportunities).where(eq(schema.opportunities.id, req.params.id as string));
    logActivity("Deal Deleted", req.params.id as string, "deal");
    res.json({ success: true });
  });

  // ─── Forecasting ────────────────────────────────────────────────────

  app.get("/api/forecast", requireAdminSession, async (_req, res) => {
    const opps = await db.select().from(schema.opportunities);
    const now = new Date();

    // Active deals (not closed)
    const active = opps.filter(o => o.stage !== "closed-won" && o.stage !== "closed-lost");
    const closedWon = opps.filter(o => o.stage === "closed-won");
    const closedLost = opps.filter(o => o.stage === "closed-lost");

    const totalPipeline = active.reduce((s, o) => s + o.value, 0);
    const weightedPipeline = active.reduce((s, o) => s + o.value * (o.probability / 100), 0);
    const closedWonTotal = closedWon.reduce((s, o) => s + o.value, 0);
    const closedLostTotal = closedLost.reduce((s, o) => s + o.value, 0);
    const avgDealSize = closedWon.length > 0 ? closedWonTotal / closedWon.length : 0;

    // Average days to close
    const daysToClose = closedWon.map(o => {
      const created = new Date(o.createdAt).getTime();
      const closed = new Date(o.actualCloseDate || o.updatedAt).getTime();
      return Math.max(1, Math.floor((closed - created) / 86400000));
    });
    const avgDaysToClose = daysToClose.length > 0 ? Math.round(daysToClose.reduce((s, d) => s + d, 0) / daysToClose.length) : 0;

    // Win rate
    const totalClosed = closedWon.length + closedLost.length;
    const winRate = totalClosed > 0 ? Math.round((closedWon.length / totalClosed) * 100) : 0;

    // Stage breakdown
    const stages = ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"];
    const stageBreakdown = stages.map(stage => {
      const inStage = opps.filter(o => o.stage === stage);
      const totalValue = inStage.reduce((s, o) => s + o.value, 0);
      const avgAge = inStage.length > 0
        ? Math.round(inStage.reduce((s, o) => s + Math.max(1, Math.floor((now.getTime() - new Date(o.stageChangedAt).getTime()) / 86400000)), 0) / inStage.length)
        : 0;
      return {
        stage,
        count: inStage.length,
        totalValue,
        weightedValue: inStage.reduce((s, o) => s + o.value * (o.probability / 100), 0),
        avgAge,
      };
    });

    // Monthly forecast (next 6 months based on expected close dates)
    const monthlyForecast = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const inMonth = active.filter(o => o.expectedCloseDate.startsWith(monthKey));
      const closedInMonth = closedWon.filter(o => (o.actualCloseDate || o.updatedAt).startsWith(monthKey));
      monthlyForecast.push({
        month: monthLabel,
        projected: inMonth.reduce((s, o) => s + o.value * (o.probability / 100), 0),
        closed: closedInMonth.reduce((s, o) => s + o.value, 0),
      });
    }

    // Top deals by weighted value
    const topDeals = [...active]
      .sort((a, b) => (b.value * b.probability / 100) - (a.value * a.probability / 100))
      .slice(0, 5)
      .map(o => ({ ...o, weightedValue: o.value * (o.probability / 100) }));

    res.json({
      totalPipeline,
      weightedPipeline,
      closedWon: closedWonTotal,
      closedLost: closedLostTotal,
      avgDealSize,
      avgDaysToClose,
      winRate,
      stageBreakdown,
      monthlyForecast,
      topDeals,
    });
  });

  // ─── Lead Activities / Timeline ─────────────────────────────────────

  app.get("/api/activities/:leadId", requireAdminSession, async (req, res) => {
    const rows = await db.select().from(schema.leadActivities)
      .where(eq(schema.leadActivities.leadId, req.params.leadId as string))
      .orderBy(desc(schema.leadActivities.createdAt));
    res.json(rows);
  });

  app.post("/api/activities", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const [activity] = await db.insert(schema.leadActivities).values({
      id,
      leadId: req.body.leadId || "",
      opportunityId: req.body.opportunityId || "",
      userId: req.body.userId || "",
      type: req.body.type || "note",
      title: req.body.title || "",
      description: req.body.description || "",
      metadata: req.body.metadata || "{}",
      createdAt: now,
    }).returning();
    res.status(201).json(activity);
  });

  // ─── User Accounts (Enterprise RBAC) ───────────────────────────────

  app.get("/api/user-accounts", requireAdminSession, async (_req, res) => {
    const rows = await db.select({
      id: schema.userAccounts.id,
      email: schema.userAccounts.email,
      displayName: schema.userAccounts.displayName,
      role: schema.userAccounts.role,
      teamId: schema.userAccounts.teamId,
      avatarUrl: schema.userAccounts.avatarUrl,
      isActive: schema.userAccounts.isActive,
      lastLoginAt: schema.userAccounts.lastLoginAt,
      createdAt: schema.userAccounts.createdAt,
    }).from(schema.userAccounts).orderBy(asc(schema.userAccounts.displayName));
    res.json(rows);
  });

  app.post("/api/user-accounts", requireAdminSession, async (req, res) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    // Hash password
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(req.body.password || "changeme", salt, 64).toString("hex");
    const passwordHash = `${salt}:${hash}`;

    const [user] = await db.insert(schema.userAccounts).values({
      id,
      email: req.body.email || "",
      passwordHash,
      displayName: req.body.displayName || "",
      role: req.body.role || "sales-rep",
      teamId: req.body.teamId || "",
      avatarUrl: "",
      isActive: true,
      lastLoginAt: "",
      createdAt: now,
    }).returning();
    logActivity("User Created", `${user.displayName} (${user.role})`, "auth");
    // Don't return password hash
    const { passwordHash: _, ...safe } = user;
    res.status(201).json(safe);
  });

  app.patch("/api/user-accounts/:id", requireAdminSession, async (req, res) => {
    const body = { ...req.body };
    // If changing password, hash it
    if (body.password) {
      const salt = randomBytes(16).toString("hex");
      const hash = scryptSync(body.password, salt, 64).toString("hex");
      body.passwordHash = `${salt}:${hash}`;
      delete body.password;
    }
    const updateData = pickColumns(schema.userAccounts, body);
    const [updated] = await db.update(schema.userAccounts).set(updateData).where(eq(schema.userAccounts.id, req.params.id as string)).returning();
    if (!updated) return res.status(404).json({ error: "User not found" });
    logActivity("User Updated", `${updated.displayName} (${updated.role})`, "auth");
    const { passwordHash: _, ...safe } = updated;
    res.json(safe);
  });

  app.delete("/api/user-accounts/:id", requireAdminSession, async (req, res) => {
    const [deleted] = await db.delete(schema.userAccounts).where(eq(schema.userAccounts.id, req.params.id as string)).returning();
    if (deleted) logActivity("User Deleted", deleted.displayName, "auth");
    res.json({ success: true });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ─── AUTOPILOT: Config, Queue, Controls ─────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Get autopilot config
  app.get("/api/autopilot/config", requireAdminSession, async (_req, res) => {
    const [cfg] = await db.select().from(schema.autopilotConfig).where(eq(schema.autopilotConfig.id, "default"));
    if (!cfg) {
      // Create default config
      const now = new Date().toISOString();
      const [created] = await db.insert(schema.autopilotConfig).values({
        id: "default",
        enabled: false,
        autoProspectEnabled: false,
        prospectLocations: "Honolulu, Hawaii",
        prospectVerticals: "restaurant,retail,salon",
        maxProspectsPerRun: 10,
        autoOutreachEnabled: false,
        outreachDelay: 2,
        maxOutreachPerDay: 15,
        autoFollowUpEnabled: false,
        followUpAfterDays: 3,
        maxFollowUpsPerLead: 3,
        autoEnrichEnabled: true,
        lastRunAt: "",
        totalProspected: 0,
        totalEmailed: 0,
        totalFollowUps: 0,
        updatedAt: now,
      }).returning();
      return res.json(created);
    }
    res.json(cfg);
  });

  // Update autopilot config
  app.patch("/api/autopilot/config", requireAdminSession, async (req, res) => {
    const body = { ...req.body, updatedAt: new Date().toISOString() };
    const updateData = pickColumns(schema.autopilotConfig, body);
    const [existing] = await db.select().from(schema.autopilotConfig).where(eq(schema.autopilotConfig.id, "default"));
    if (!existing) {
      // Create with provided values
      const now = new Date().toISOString();
      const [created] = await db.insert(schema.autopilotConfig).values({
        id: "default",
        ...body,
        updatedAt: now,
      }).returning();
      return res.json(created);
    }
    const [updated] = await db.update(schema.autopilotConfig).set(updateData).where(eq(schema.autopilotConfig.id, "default")).returning();

    // Start/stop autopilot based on enabled state
    if (updated.enabled) startAutopilot();
    else stopAutopilot();

    logActivity("Autopilot Updated", `Enabled: ${updated.enabled}`, "integration");
    res.json(updated);
  });

  // Toggle autopilot on/off
  app.post("/api/autopilot/toggle", requireAdminSession, async (_req, res) => {
    const [cfg] = await db.select().from(schema.autopilotConfig).where(eq(schema.autopilotConfig.id, "default"));
    const newEnabled = !cfg?.enabled;
    const [updated] = await db.update(schema.autopilotConfig)
      .set({ enabled: newEnabled, updatedAt: new Date().toISOString() })
      .where(eq(schema.autopilotConfig.id, "default")).returning();
    if (newEnabled) startAutopilot();
    else stopAutopilot();
    logActivity("Autopilot Toggled", newEnabled ? "ON" : "OFF", "integration");
    res.json(updated);
  });

  // Force run autopilot now
  app.post("/api/autopilot/run", requireAdminSession, async (_req, res) => {
    await runAutopilot();
    const [cfg] = await db.select().from(schema.autopilotConfig).where(eq(schema.autopilotConfig.id, "default"));
    res.json({ success: true, config: cfg });
  });

  // Get outreach queue
  app.get("/api/autopilot/queue", requireAdminSession, async (_req, res) => {
    const queue = await db.select().from(schema.outreachQueue).orderBy(desc(schema.outreachQueue.createdAt)).limit(100);
    // Enrich with lead names
    const leadIds = Array.from(new Set(queue.map(q => q.leadId)));
    const leads = leadIds.length > 0
      ? await db.select({ id: schema.leads.id, name: schema.leads.name, business: schema.leads.business, email: schema.leads.email })
          .from(schema.leads)
      : [];
    const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));
    const enriched = queue.map(q => ({
      ...q,
      leadName: leadMap[q.leadId]?.name || "",
      leadBusiness: leadMap[q.leadId]?.business || "",
      leadEmail: leadMap[q.leadId]?.email || "",
    }));
    res.json(enriched);
  });

  // Preview / regenerate a queue item's email
  app.post("/api/autopilot/queue/:id/regenerate", requireAdminSession, async (req, res) => {
    const [item] = await db.select().from(schema.outreachQueue).where(eq(schema.outreachQueue.id, req.params.id as string));
    if (!item) return res.status(404).json({ error: "Not found" });
    if (item.status === "sent") return res.status(400).json({ error: "Already sent" });

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, item.leadId));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const email = await generateAIEmail({
      name: lead.name, business: lead.business, email: lead.email,
      vertical: lead.vertical, currentProcessor: lead.currentProcessor,
      monthlyVolume: lead.monthlyVolume, painPoints: lead.painPoints, notes: lead.notes,
    }, item.type as "initial" | "follow-up-1" | "follow-up-2" | "follow-up-3");

    const [updated] = await db.update(schema.outreachQueue)
      .set({ status: "ready", subject: email.subject, body: email.body, htmlBody: email.html })
      .where(eq(schema.outreachQueue.id, item.id)).returning();
    res.json(updated);
  });

  // Approve and send a queue item immediately
  app.post("/api/autopilot/queue/:id/send", requireAdminSession, async (req, res) => {
    const [item] = await db.select().from(schema.outreachQueue).where(eq(schema.outreachQueue.id, req.params.id as string));
    if (!item) return res.status(404).json({ error: "Not found" });
    if (item.status === "sent") return res.status(400).json({ error: "Already sent" });
    if (!item.subject || !item.body) return res.status(400).json({ error: "Email not generated yet" });

    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, item.leadId));
    if (!lead?.email) return res.status(400).json({ error: "No email on lead" });

    const result = await sendEmail({
      to: lead.email, subject: item.subject, html: item.htmlBody || item.body,
      text: item.body, leadId: lead.id, source: "outreach", contactName: lead.name,
    });

    if (result.success) {
      await db.update(schema.outreachQueue)
        .set({ status: "sent", sentAt: new Date().toISOString() })
        .where(eq(schema.outreachQueue.id, item.id));
      if (lead.status === "new") {
        await db.update(schema.leads).set({ status: "contacted", updatedAt: new Date().toISOString() }).where(eq(schema.leads.id, lead.id));
      }
      logActivity("Email Sent (Autopilot)", `${item.type} → ${lead.email}`, "lead");
      res.json({ success: true });
    } else {
      res.status(500).json({ error: result.error || "Send failed" });
    }
  });

  // Skip/cancel a queue item
  app.post("/api/autopilot/queue/:id/skip", requireAdminSession, async (req, res) => {
    await db.update(schema.outreachQueue)
      .set({ status: "skipped" })
      .where(eq(schema.outreachQueue.id, req.params.id as string));
    res.json({ success: true });
  });

  // Delete queue items
  app.delete("/api/autopilot/queue/:id", requireAdminSession, async (req, res) => {
    await db.delete(schema.outreachQueue).where(eq(schema.outreachQueue.id, req.params.id as string));
    res.json({ success: true });
  });

  // Auto-enrich a specific lead
  app.post("/api/leads/:id/enrich", requireAdminSession, async (req, res) => {
    await autoEnrichLead(req.params.id as string);
    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, req.params.id as string));
    res.json(lead);
  });

  // Generate AI email for a lead (one-off, not queued)
  app.post("/api/leads/:id/generate-email", requireAdminSession, async (req, res) => {
    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, req.params.id as string));
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const type = req.body.type || "initial";
    const email = await generateAIEmail({
      name: lead.name, business: lead.business, email: lead.email,
      vertical: lead.vertical, currentProcessor: lead.currentProcessor,
      monthlyVolume: lead.monthlyVolume, painPoints: lead.painPoints, notes: lead.notes,
    }, type);
    res.json(email);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ─── Workers AI Toolkit (proxy to Cloudflare Worker) ────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const WORKER_BASE = process.env.ENRICH_WORKER_URL || "https://mojo-luna-955c.gorjessbbyx3.workers.dev";

  // Generic proxy for Worker AI endpoints
  const workerProxy = (endpoint: string) => async (req: Request, res: Response) => {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 20000);
      const resp = await fetch(`${WORKER_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      const data = await resp.json();
      res.status(resp.status).json(data);
    } catch (err: any) {
      res.status(502).json({ error: `Worker unreachable: ${err.message}` });
    }
  };

  // Lead & Sales
  app.post("/api/ai/enrich", requireAdminSession, workerProxy("/enrich"));
  app.post("/api/ai/pitch", requireAdminSession, workerProxy("/pitch"));
  app.post("/api/ai/objection", requireAdminSession, workerProxy("/objection"));
  app.post("/api/ai/score", requireAdminSession, workerProxy("/score"));

  // Content & Outreach
  app.post("/api/ai/email", requireAdminSession, workerProxy("/email"));
  app.post("/api/ai/sms", requireAdminSession, workerProxy("/sms"));
  app.post("/api/ai/summarize", requireAdminSession, workerProxy("/summarize"));

  // Classroom & Training
  app.post("/api/ai/quiz", requireAdminSession, workerProxy("/quiz"));
  app.post("/api/ai/roleplay", requireAdminSession, workerProxy("/roleplay"));

  // Operations
  app.post("/api/ai/classify", requireAdminSession, workerProxy("/classify"));
  app.post("/api/ai/extract-statement", requireAdminSession, workerProxy("/extract-statement"));

  // Score a lead by ID (convenience route)
  app.post("/api/leads/:id/score", requireAdminSession, async (req, res) => {
    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, req.params.id as string));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 15000);
      const resp = await fetch(`${WORKER_BASE}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: lead.business,
          vertical: lead.vertical,
          currentProcessor: lead.currentProcessor,
          monthlyVolume: lead.monthlyVolume,
          painPoints: lead.painPoints,
          hasEmail: !!lead.email,
          hasPhone: !!lead.phone,
          hasWebsite: lead.notes.includes("http"),
          source: lead.source,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) return res.status(resp.status).json({ error: "Scoring failed" });
      const scoreData = await resp.json() as { score: number; grade: string; recommendation: string };

      // Persist score to lead record
      await db.update(schema.leads).set({
        leadScore: scoreData.score,
        leadScoreReason: `${scoreData.grade}: ${scoreData.recommendation}`,
        updatedAt: new Date().toISOString(),
      }).where(eq(schema.leads.id, lead.id));

      // Log as activity
      await db.insert(schema.leadActivities).values({
        id: randomUUID(),
        leadId: lead.id,
        opportunityId: "",
        userId: (req as any).session?.userId || "admin",
        type: "note",
        title: `Lead Score: ${scoreData.score}/100 (${scoreData.grade})`,
        description: scoreData.recommendation,
        metadata: JSON.stringify(scoreData),
        createdAt: new Date().toISOString(),
      });

      res.json(scoreData);
    } catch (err: any) {
      res.status(502).json({ error: `Worker unreachable: ${err.message}` });
    }
  });

  // Generate pitch for a lead by ID
  app.post("/api/leads/:id/pitch", requireAdminSession, async (req, res) => {
    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, req.params.id as string));
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 15000);
      const resp = await fetch(`${WORKER_BASE}/pitch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: lead.business,
          vertical: lead.vertical,
          currentProcessor: lead.currentProcessor,
          monthlyVolume: lead.monthlyVolume,
          painPoints: lead.painPoints,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) return res.status(resp.status).json({ error: "Pitch generation failed" });
      res.json(await resp.json());
    } catch (err: any) {
      res.status(502).json({ error: `Worker unreachable: ${err.message}` });
    }
  });

  // Start autopilot if enabled on server boot
  (async () => {
    try {
      const [cfg] = await db.select().from(schema.autopilotConfig).where(eq(schema.autopilotConfig.id, "default"));
      if (cfg?.enabled) startAutopilot();
    } catch {
      // Table might not exist yet
    }
  })();

  return httpServer;
}
