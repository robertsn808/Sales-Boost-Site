import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, desc, asc, and, lt, not, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendEmail } from "./email";
import { initialOutreachEmail, walkInFollowUpEmail, phoneCallFollowUpEmail } from "./email-templates";

// ─── Autopilot Engine ────────────────────────────────────────────────
// Runs on a timer. Handles:
// 1. Auto-enrich new leads (website scan + tech detection)
// 2. Auto-generate outreach emails (AI-personalized, not templates)
// 3. Auto-queue follow-ups for stale leads
// 4. Auto-send queued emails

let autopilotTimer: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
const BACKOFF_MS = 30 * 60 * 1000; // 30 minutes
let backoffUntil: number = 0;

function log(msg: string) {
  console.log(`[Autopilot] ${new Date().toISOString().slice(11, 19)} ${msg}`);
}

async function getConfig() {
  const [cfg] = await db.select().from(schema.autopilotConfig).where(eq(schema.autopilotConfig.id, "default"));
  return cfg;
}

// ─── AI Email Generation ─────────────────────────────────────────────

export async function generateAIEmail(lead: {
  name: string; business: string; email: string; vertical: string;
  currentProcessor: string; monthlyVolume: string; painPoints: string;
  notes: string;
}, type: "initial" | "follow-up-1" | "follow-up-2" | "follow-up-3" | "lead-magnet-followup"): Promise<{ subject: string; body: string; html: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const anthropic = new Anthropic({ apiKey });
  const firstName = lead.name.split(" ")[0] || "there";

  // Extract lead magnet name from notes if present
  const leadMagnetMatch = lead.notes.match(/Lead Magnet:\s*([^|]+)/);
  const leadMagnetName = leadMagnetMatch ? leadMagnetMatch[1].trim() : "our free guide";

  const typeInstructions: Record<string, string> = {
    initial: `Write a personalized cold outreach email. This is the FIRST contact. Be conversational, not salesy. Reference their specific business, processor, and vertical. Offer a free statement analysis. Keep it under 150 words.`,
    "follow-up-1": `Write a gentle first follow-up (3 days after initial). Reference that you reached out before. Add a specific value stat or case study relevant to their vertical. Ask one simple question. Under 100 words.`,
    "follow-up-2": `Write a second follow-up (7 days after initial). Different angle — maybe share a quick insight about their industry or a competitor comparison. Very brief, casual. Under 80 words.`,
    "follow-up-3": `Write a final breakup email (14 days after initial). Let them know this is the last follow-up. Leave the door open. Friendly and no-pressure. Under 60 words.`,
    "lead-magnet-followup": `This person downloaded "${leadMagnetName}". Write a warm, personalized follow-up email (sent ~24 hours after download). Reference the specific guide they downloaded and connect it to their business type. Offer to do a free statement review that applies the concepts from the guide to THEIR actual numbers. Be helpful, not pushy — they already showed interest by downloading. Keep it under 120 words.

Available PDF guides you can link to:
- Top 10 Statement Checklist: https://assets.techsavvyhawaii.com/website-resources/1771403190912-top-10-statement-check.pdf
- Rate Comparison Guide: https://assets.techsavvyhawaii.com/website-resources/1771403189858-rate-comparison-guide.pdf
- Payment Security Checklist: https://assets.techsavvyhawaii.com/website-resources/1771403187943-payment-security-checklist.pdf
- Cash Discount Explained: https://assets.techsavvyhawaii.com/website-resources/1771403188928-cash-discount-explained.pdf
- Free AI Statement Review: https://techsavvyhawaii.com/statement-review

Include a link to 1-2 related guides they haven't downloaded yet, plus the AI statement review link.`,
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are writing outreach emails for TechSavvy Hawaii, a zero-fee payment processing company.
The program: customers pay a small surcharge (like gas stations), merchants keep 100% of every sale.
One-time $399 terminal cost, no monthly fees, no contracts. Free custom website included for merchants.

RULES:
- Write like a real person, not a marketing bot
- No emojis, no exclamation marks in subject lines
- Reference SPECIFIC details about their business
- Sound like someone they'd want to grab coffee with
- Sign off as "TechSavvy Hawaii" with (808) 767-5460

Free resources you can offer/link in emails:
- Free AI Statement Review: https://techsavvyhawaii.com/statement-review
- Top 10 Statement Checklist (PDF): https://assets.techsavvyhawaii.com/website-resources/1771403190912-top-10-statement-check.pdf
- Rate Comparison Guide (PDF): https://assets.techsavvyhawaii.com/website-resources/1771403189858-rate-comparison-guide.pdf
- Payment Security Checklist (PDF): https://assets.techsavvyhawaii.com/website-resources/1771403187943-payment-security-checklist.pdf
- Cash Discount Explained (PDF): https://assets.techsavvyhawaii.com/website-resources/1771403188928-cash-discount-explained.pdf

${typeInstructions[type]}

Return ONLY a JSON object: { "subject": "...", "body": "...(plain text)", "html": "...(HTML with inline styles)" }`,
    messages: [{
      role: "user",
      content: `Lead: ${lead.name} at ${lead.business}
Email: ${lead.email}
Vertical: ${lead.vertical}
Current processor: ${lead.currentProcessor || "unknown"}
Monthly volume: ${lead.monthlyVolume || "unknown"}
Pain points: ${lead.painPoints || "none noted"}
Notes: ${lead.notes || "none"}
Email type: ${type}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  // Extract JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI didn't return valid JSON");
  return JSON.parse(jsonMatch[0]);
}

// ─── Auto-Enrich Lead ────────────────────────────────────────────────

export async function autoEnrichLead(leadId: string): Promise<void> {
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
  if (!lead) return;

  // Check if there's a website in notes
  const urlMatch = lead.notes.match(/https?:\/\/[^\s,)]+/);
  if (!urlMatch) return;

  const enrichWorkerUrl = process.env.ENRICH_WORKER_URL || "https://mojo-luna-955c.gorjessbbyx3.workers.dev";

  try {
    // Fetch the website
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(urlMatch[0], {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TechSavvy/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return;
    const html = await resp.text();

    // Tech stack detection (lightweight, no AI)
    const processors: string[] = [];
    const techSignatures: Record<string, string> = {
      "square": "Square", "squareup.com": "Square", "clover.com": "Clover",
      "toasttab.com": "Toast", "stripe.com": "Stripe", "shopify": "Shopify",
      "paypal": "PayPal", "lightspeed": "Lightspeed", "revel": "Revel",
    };
    const htmlLower = html.toLowerCase();
    for (const [sig, name] of Object.entries(techSignatures)) {
      if (htmlLower.includes(sig) && !processors.includes(name)) {
        processors.push(name);
      }
    }

    // Update lead with enrichment data
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (processors.length > 0 && !lead.currentProcessor) {
      updates.currentProcessor = processors.join(", ");
    }
    // Persist detected tech stack to lead
    if (processors.length > 0) {
      updates.techStack = JSON.stringify(processors);
    }

    // Use Cloudflare Workers AI (Llama 3) for structured data extraction — free tier
    const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3000);

    const enrichCtrl = new AbortController();
    const enrichTimeout = setTimeout(() => enrichCtrl.abort(), 15000);
    const workerHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.WORKER_KEY) workerHeaders["X-Worker-Key"] = process.env.WORKER_KEY;
    const aiResp = await fetch(enrichWorkerUrl, {
      method: "POST",
      headers: workerHeaders,
      body: JSON.stringify({ text: cleaned }),
      signal: enrichCtrl.signal,
    });
    clearTimeout(enrichTimeout);

    if (aiResp.ok) {
      const info = await aiResp.json() as Record<string, string>;
      if (info.phone && !lead.phone) updates.phone = info.phone;
      if (info.email && !lead.email) updates.email = info.email;
      if (info.address && !lead.address) updates.address = info.address;
      if (info.ownerName && !lead.decisionMakerName) updates.decisionMakerName = info.ownerName;
      if (info.vertical && lead.vertical === "other") updates.vertical = info.vertical;
    }

    if (Object.keys(updates).length > 1) { // more than just updatedAt
      await db.update(schema.leads).set(updates).where(eq(schema.leads.id, leadId));
      log(`Enriched lead: ${lead.business} — ${Object.keys(updates).filter(k => k !== "updatedAt").join(", ")}`);

      // Log activity
      await db.insert(schema.leadActivities).values({
        id: randomUUID(),
        leadId,
        opportunityId: "",
        userId: "autopilot",
        type: "note",
        title: "Auto-enriched from website",
        description: `Found: ${Object.keys(updates).filter(k => k !== "updatedAt").join(", ")}`,
        metadata: JSON.stringify(updates),
        createdAt: new Date().toISOString(),
      });
    }

    // Auto-score the lead after enrichment
    try {
      const [freshLead] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
      if (freshLead) {
        const scoreHeaders: Record<string, string> = { "Content-Type": "application/json" };
        if (process.env.WORKER_KEY) scoreHeaders["X-Worker-Key"] = process.env.WORKER_KEY;
        const scoreResp = await fetch(`${enrichWorkerUrl}/score`, {
          method: "POST",
          headers: scoreHeaders,
          body: JSON.stringify({
            business: freshLead.business,
            vertical: freshLead.vertical,
            currentProcessor: freshLead.currentProcessor,
            monthlyVolume: freshLead.monthlyVolume,
            painPoints: freshLead.painPoints,
            hasEmail: !!freshLead.email,
            hasPhone: !!freshLead.phone,
            hasWebsite: !!urlMatch[0],
            source: freshLead.source,
          }),
        });
        if (scoreResp.ok) {
          const scoreData = await scoreResp.json() as { score: number; grade: string; recommendation: string };
          await db.insert(schema.leadActivities).values({
            id: randomUUID(),
            leadId,
            opportunityId: "",
            userId: "autopilot",
            type: "note",
            title: `Lead Score: ${scoreData.score}/100 (${scoreData.grade})`,
            description: scoreData.recommendation,
            metadata: JSON.stringify(scoreData),
            createdAt: new Date().toISOString(),
          });
          log(`Scored lead: ${freshLead.business} — ${scoreData.score}/100 (${scoreData.grade})`);
        }
      }
    } catch {
      // Scoring is non-critical
    }
  } catch (err) {
    // Silently fail enrichment — not critical
  }
}

// ─── Classify Inbound Emails ──────────────────────────────────────────

export async function classifyInboundEmail(subject: string, body: string): Promise<{
  intent: string; priority: string; suggestedAction: string;
} | null> {
  const workerUrl = process.env.ENRICH_WORKER_URL || "https://mojo-luna-955c.gorjessbbyx3.workers.dev";
  try {
    const classifyHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.WORKER_KEY) classifyHeaders["X-Worker-Key"] = process.env.WORKER_KEY;
    const resp = await fetch(`${workerUrl}/classify`, {
      method: "POST",
      headers: classifyHeaders,
      body: JSON.stringify({ text: `Subject: ${subject}\n\n${body}`.slice(0, 2000) }),
    });
    if (!resp.ok) return null;
    return await resp.json() as { intent: string; priority: string; suggestedAction: string };
  } catch {
    return null;
  }
}

// ─── Queue Outreach for New Leads ────────────────────────────────────

async function queueInitialOutreach(): Promise<number> {
  const cfg = await getConfig();
  if (!cfg?.autoOutreachEnabled) return 0;

  const now = new Date();
  const delayMs = (cfg.outreachDelay || 2) * 3600000;

  // Find new leads that don't have any outreach queued yet
  const leads = await db.select().from(schema.leads)
    .where(eq(schema.leads.status, "new"))
    .orderBy(asc(schema.leads.createdAt));

  const existingQueue = await db.select({ leadId: schema.outreachQueue.leadId })
    .from(schema.outreachQueue);
  const queuedLeadIds = new Set(existingQueue.map(q => q.leadId));

  let queued = 0;
  const todayStr = now.toISOString().slice(0, 10);

  // Check how many we've already sent today
  const sentAll = await db.select({ id: schema.outreachQueue.id, sentAt: schema.outreachQueue.sentAt })
    .from(schema.outreachQueue)
    .where(eq(schema.outreachQueue.status, "sent"));
  const sentTodayCount = sentAll.filter(s => s.sentAt && s.sentAt.startsWith(todayStr)).length;
  const remaining = (cfg.maxOutreachPerDay || 15) - sentTodayCount;
  if (remaining <= 0) return 0;

  for (const lead of leads) {
    if (queuedLeadIds.has(lead.id)) continue;
    if (!lead.email) continue;
    if (queued >= remaining) break;

    const createdAt = new Date(lead.createdAt).getTime();
    const scheduledTime = new Date(createdAt + delayMs);
    if (scheduledTime > now) continue; // not ready yet

    await db.insert(schema.outreachQueue).values({
      id: randomUUID(),
      leadId: lead.id,
      type: "initial",
      status: "pending",
      subject: "",
      body: "",
      htmlBody: "",
      scheduledFor: scheduledTime.toISOString(),
      sentAt: "",
      error: "",
      createdAt: now.toISOString(),
    });

    queued++;
    log(`Queued initial outreach for: ${lead.business}`);
  }

  return queued;
}

// ─── Queue Follow-ups for Stale Leads ────────────────────────────────

async function queueFollowUps(): Promise<number> {
  const cfg = await getConfig();
  if (!cfg?.autoFollowUpEnabled) return 0;

  const now = new Date();
  const followUpDays = cfg.followUpAfterDays || 3;
  const maxFollowUps = cfg.maxFollowUpsPerLead || 3;

  // Get all leads that have been contacted but haven't responded
  const leads = await db.select().from(schema.leads)
    .where(not(inArray(schema.leads.status, ["won", "lost"])));

  const allQueue = await db.select().from(schema.outreachQueue);

  let queued = 0;
  for (const lead of leads) {
    if (!lead.email) continue;

    const leadQueue = allQueue.filter(q => q.leadId === lead.id);
    const sentItems = leadQueue.filter(q => q.status === "sent");
    const pendingItems = leadQueue.filter(q => q.status === "pending" || q.status === "generating" || q.status === "ready");

    if (pendingItems.length > 0) continue; // already has pending items
    if (sentItems.length === 0) continue; // hasn't received initial yet
    if (sentItems.length >= maxFollowUps + 1) continue; // hit follow-up limit (+1 for initial)

    // Check if enough time has passed since last sent email
    const lastSent = sentItems.sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
    if (!lastSent?.sentAt) continue;

    const daysSinceLastSent = Math.floor((now.getTime() - new Date(lastSent.sentAt).getTime()) / 86400000);
    if (daysSinceLastSent < followUpDays) continue;

    const followUpNum = sentItems.length; // 1 = follow-up-1, 2 = follow-up-2, etc.
    const type = `follow-up-${Math.min(followUpNum, 3)}`;

    await db.insert(schema.outreachQueue).values({
      id: randomUUID(),
      leadId: lead.id,
      type,
      status: "pending",
      subject: "",
      body: "",
      htmlBody: "",
      scheduledFor: now.toISOString(),
      sentAt: "",
      error: "",
      createdAt: now.toISOString(),
    });

    queued++;
    log(`Queued ${type} for: ${lead.business}`);
  }

  return queued;
}

// ─── Queue Lead Magnet Follow-ups (24hr fast-track) ──────────────────

async function queueLeadMagnetFollowUps(): Promise<number> {
  const cfg = await getConfig();
  if (!cfg?.autoFollowUpEnabled) return 0;

  const now = new Date();
  const LEAD_MAGNET_DELAY_MS = 24 * 3600000; // 24 hours after download

  // Find lead-magnet source leads that haven't been followed up yet
  const magnetLeads = await db.select().from(schema.leads)
    .where(and(
      eq(schema.leads.source, "lead-magnet"),
      not(inArray(schema.leads.status, ["won", "lost"])),
    ))
    .orderBy(asc(schema.leads.createdAt));

  const allQueue = await db.select().from(schema.outreachQueue);
  let queued = 0;

  for (const lead of magnetLeads) {
    if (!lead.email) continue;
    if (!lead.notes.includes("Lead Magnet:")) continue;

    const leadQueue = allQueue.filter(q => q.leadId === lead.id);
    // Skip if already has any outreach queued (pending or sent)
    if (leadQueue.length > 0) continue;

    // Check if 24 hours have passed since lead was created
    const createdAt = new Date(lead.createdAt).getTime();
    const scheduledTime = new Date(createdAt + LEAD_MAGNET_DELAY_MS);
    if (scheduledTime > now) continue; // not ready yet

    await db.insert(schema.outreachQueue).values({
      id: randomUUID(),
      leadId: lead.id,
      type: "lead-magnet-followup",
      status: "pending",
      subject: "",
      body: "",
      htmlBody: "",
      scheduledFor: scheduledTime.toISOString(),
      sentAt: "",
      error: "",
      createdAt: now.toISOString(),
    });

    queued++;
    log(`Queued lead magnet follow-up for: ${lead.business} (${lead.notes.match(/Lead Magnet:\s*([^|]+)/)?.[1]?.trim() || "unknown guide"})`);
  }

  return queued;
}

// ─── Process Outreach Queue (generate + send) ────────────────────────

async function processQueue(): Promise<{ generated: number; sent: number }> {
  let generated = 0;
  let sent = 0;

  // Step 1: Generate content for pending items
  const pending = await db.select().from(schema.outreachQueue)
    .where(eq(schema.outreachQueue.status, "pending"))
    .orderBy(asc(schema.outreachQueue.scheduledFor))
    .limit(5); // Process 5 at a time

  for (const item of pending) {
    try {
      // Mark as generating
      await db.update(schema.outreachQueue)
        .set({ status: "generating" })
        .where(eq(schema.outreachQueue.id, item.id));

      const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, item.leadId));
      if (!lead || !lead.email) {
        await db.update(schema.outreachQueue)
          .set({ status: "skipped", error: "No email on lead" })
          .where(eq(schema.outreachQueue.id, item.id));
        continue;
      }

      const emailType = item.type as "initial" | "follow-up-1" | "follow-up-2" | "follow-up-3" | "lead-magnet-followup";
      let email: { subject: string; body: string; html: string };

      // Use branded template for initial outreach; AI-generated for follow-ups
      if (emailType === "initial") {
        const branded = initialOutreachEmail({
          ownerName: lead.name.split(" ")[0] || "there",
          businessName: lead.business || "your business",
          agentName: "TechSavvy Hawaii",
          vertical: lead.vertical !== "other" ? lead.vertical : undefined,
          currentProcessor: lead.currentProcessor || undefined,
          monthlyVolume: lead.monthlyVolume || undefined,
          personalNote: lead.painPoints || undefined,
        });
        email = { subject: branded.subject, body: branded.text, html: branded.html };
      } else {
        email = await generateAIEmail({
          name: lead.name, business: lead.business, email: lead.email,
          vertical: lead.vertical, currentProcessor: lead.currentProcessor,
          monthlyVolume: lead.monthlyVolume, painPoints: lead.painPoints,
          notes: lead.notes,
        }, emailType);
      }

      await db.update(schema.outreachQueue)
        .set({ status: "ready", subject: email.subject, body: email.body, htmlBody: email.html })
        .where(eq(schema.outreachQueue.id, item.id));

      generated++;
      log(`Generated ${item.type} email for: ${lead.business}`);
    } catch (err: any) {
      await db.update(schema.outreachQueue)
        .set({ status: "failed", error: err.message || "Generation failed" })
        .where(eq(schema.outreachQueue.id, item.id));
    }
  }

  // Step 2: Send ready items
  const ready = await db.select().from(schema.outreachQueue)
    .where(eq(schema.outreachQueue.status, "ready"))
    .orderBy(asc(schema.outreachQueue.scheduledFor))
    .limit(5);

  for (const item of ready) {
    try {
      const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, item.leadId));
      if (!lead?.email) {
        await db.update(schema.outreachQueue)
          .set({ status: "skipped", error: "No email" })
          .where(eq(schema.outreachQueue.id, item.id));
        continue;
      }

      const result = await sendEmail({
        to: lead.email,
        subject: item.subject,
        html: item.htmlBody || item.body,
        text: item.body,
        leadId: lead.id,
        source: "outreach",
        contactName: lead.name,
      });

      if (result.success) {
        await db.update(schema.outreachQueue)
          .set({ status: "sent", sentAt: new Date().toISOString() })
          .where(eq(schema.outreachQueue.id, item.id));

        // Update lead status if still "new"
        if (lead.status === "new") {
          await db.update(schema.leads)
            .set({ status: "contacted", updatedAt: new Date().toISOString() })
            .where(eq(schema.leads.id, lead.id));
        }

        // Log activity
        await db.insert(schema.leadActivities).values({
          id: randomUUID(),
          leadId: lead.id,
          opportunityId: "",
          userId: "autopilot",
          type: "email",
          title: `Auto-sent ${item.type}: ${item.subject}`,
          description: item.body.slice(0, 200),
          metadata: JSON.stringify({ type: item.type, queueId: item.id }),
          createdAt: new Date().toISOString(),
        });

        sent++;
        log(`Sent ${item.type} to: ${lead.email}`);
      } else {
        await db.update(schema.outreachQueue)
          .set({ status: "failed", error: result.error || "Send failed" })
          .where(eq(schema.outreachQueue.id, item.id));
      }
    } catch (err: any) {
      await db.update(schema.outreachQueue)
        .set({ status: "failed", error: err.message || "Send error" })
        .where(eq(schema.outreachQueue.id, item.id));
    }
  }

  return { generated, sent };
}

// ─── Main Tick ───────────────────────────────────────────────────────

async function runAutopilot(): Promise<void> {
  const cfg = await getConfig();
  if (!cfg?.enabled) return;

  // Circuit breaker: skip if in backoff period
  if (Date.now() < backoffUntil) {
    log(`In backoff period (${consecutiveFailures} failures). Resuming at ${new Date(backoffUntil).toISOString().slice(11, 19)}`);
    return;
  }

  log("Running autopilot tick...");

  try {
    // 1. Queue outreach for new leads
    const newQueued = await queueInitialOutreach();

    // 2. Queue follow-ups for stale leads
    const followUpsQueued = await queueFollowUps();

    // 3. Queue lead magnet 24-hour follow-ups (fast-track)
    const magnetFollowUps = await queueLeadMagnetFollowUps();

    // 4. Process the queue (generate + send)
    const { generated, sent } = await processQueue();

    // Update stats
    if (newQueued > 0 || followUpsQueued > 0 || magnetFollowUps > 0 || sent > 0) {
      const updates: Record<string, any> = { lastRunAt: new Date().toISOString() };
      if (sent > 0) updates.totalEmailed = (cfg.totalEmailed || 0) + sent;
      if (followUpsQueued + magnetFollowUps > 0) updates.totalFollowUps = (cfg.totalFollowUps || 0) + followUpsQueued + magnetFollowUps;
      await db.update(schema.autopilotConfig).set(updates).where(eq(schema.autopilotConfig.id, "default"));
    }

    if (newQueued + followUpsQueued + magnetFollowUps + generated + sent > 0) {
      log(`Tick complete: queued=${newQueued} follow-ups=${followUpsQueued} magnet=${magnetFollowUps} generated=${generated} sent=${sent}`);
    }

    // Reset circuit breaker on success
    consecutiveFailures = 0;
    backoffUntil = 0;
  } catch (err) {
    consecutiveFailures++;
    log(`Error (failure ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${err}`);
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      backoffUntil = Date.now() + BACKOFF_MS;
      log(`Circuit breaker tripped — pausing autopilot for 30 minutes`);
    }
  }
}

// ─── Start / Stop ────────────────────────────────────────────────────

export function startAutopilot() {
  if (autopilotTimer) return;
  log("Starting autopilot (every 5 minutes)");
  // Run immediately, then every 5 minutes
  runAutopilot();
  autopilotTimer = setInterval(runAutopilot, 5 * 60 * 1000);
}

export function stopAutopilot() {
  if (autopilotTimer) {
    clearInterval(autopilotTimer);
    autopilotTimer = null;
    log("Stopped");
  }
}

export { runAutopilot, getConfig as getAutopilotConfig };
