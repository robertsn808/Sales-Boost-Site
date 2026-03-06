import { Resend } from "resend";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// ─── Resend Client ──────────────────────────────────────────────────

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function getEmailConfig() {
  const [config] = await db.select().from(schema.resendConfig).where(eq(schema.resendConfig.id, "default"));
  return config || {
    enabled: false,
    fromEmail: "contact@techsavvyhawaii.com",
    fromName: "TechSavvy Hawaii",
    autoConfirmEnabled: true,
    forwardCopyTo: "",
  };
}

// ─── Send Email ─────────────────────────────────────────────────────

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  threadId?: string;
  leadId?: string;
  source?: string;
  contactName?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; messageId?: string; threadId?: string; error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not configured — email not sent");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const config = await getEmailConfig();
  if (!config.enabled) {
    console.warn("Email sending is disabled in config");
    return { success: false, error: "Email sending is disabled" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo || config.fromEmail,
    });

    if (error) {
      console.error("Resend send error:", error);
      return { success: false, error: error.message };
    }

    const now = new Date().toISOString();

    // Create or find thread
    let threadId = opts.threadId;
    if (!threadId) {
      threadId = randomUUID();
      await db.insert(schema.emailThreads).values({
        id: threadId,
        subject: opts.subject,
        leadId: opts.leadId || "",
        contactEmail: opts.to,
        contactName: opts.contactName || "",
        source: opts.source || "outreach",
        status: "open",
        unread: false,
        lastMessageAt: now,
        createdAt: now,
      });
    } else {
      await db.update(schema.emailThreads)
        .set({ lastMessageAt: now, status: "replied" })
        .where(eq(schema.emailThreads.id, threadId));
    }

    // Store message
    await db.insert(schema.emailMessages).values({
      id: randomUUID(),
      threadId,
      direction: "outbound",
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      toEmail: opts.to,
      subject: opts.subject,
      body: opts.text || "",
      htmlBody: opts.html,
      resendId: data?.id || "",
      status: "sent",
      sentAt: now,
    });

    // Forward copy if configured
    if (config.forwardCopyTo) {
      await resend.emails.send({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: config.forwardCopyTo,
        subject: `[Copy] ${opts.subject}`,
        html: `<p><em>Sent to: ${opts.to}</em></p><hr/>${opts.html}`,
      }).catch((err) => console.error("Forward copy failed:", err));
    }

    return { success: true, messageId: data?.id, threadId };
  } catch (err: any) {
    console.error("Email send error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── Send Auto-Confirmation ─────────────────────────────────────────

export async function sendContactFormConfirmation(contactName: string, contactEmail: string, businessName: string): Promise<void> {
  const config = await getEmailConfig();
  if (!config.autoConfirmEnabled) return;

  await sendEmail({
    to: contactEmail,
    subject: `Thanks for reaching out, ${contactName}!`,
    contactName,
    source: "contact-form",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TechSavvy Hawaii</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Zero-Fee Payment Processing</p>
        </div>
        <div style="padding: 32px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151;">Hi ${contactName},</p>
          <p style="font-size: 16px; color: #374151;">
            Thanks for your interest in TechSavvy Hawaii! We received your inquiry for <strong>${businessName}</strong> and a team member will be reaching out to you shortly.
          </p>
          <p style="font-size: 16px; color: #374151;">
            In the meantime, here's what you should know about our zero-fee processing program:
          </p>
          <ul style="font-size: 15px; color: #4b5563; line-height: 1.8;">
            <li><strong>$0 monthly fees</strong> — no gateway, PCI, or statement fees</li>
            <li><strong>$0 processing fees</strong> — customers pay a small surcharge</li>
            <li><strong>One-time terminal cost</strong> — you own it outright</li>
            <li><strong>Free custom website</strong> — included for all processing customers</li>
          </ul>
          <p style="font-size: 16px; color: #374151;">
            Want to see exactly how much you'd save? Reply to this email with a recent processing statement and we'll prepare a free savings analysis.
          </p>
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">TechSavvy Hawaii</p>
            <p style="font-size: 14px; color: #6b7280; margin: 4px 0;">(808) 767-5460</p>
            <p style="font-size: 14px; color: #6b7280; margin: 4px 0;">contact@techsavvyhawaii.com</p>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${contactName},\n\nThanks for your interest in TechSavvy Hawaii! We received your inquiry for ${businessName} and a team member will be reaching out shortly.\n\nOur zero-fee processing program includes:\n- $0 monthly fees\n- $0 processing fees — customers pay a small surcharge\n- One-time terminal cost — you own it\n- Free custom website for all processing customers\n\nWant to see how much you'd save? Reply with a recent processing statement for a free savings analysis.\n\nTechSavvy Hawaii\n(808) 767-5460\ncontact@techsavvyhawaii.com`,
  });
}

// ─── Send Outreach Email ────────────────────────────────────────────

interface OutreachOptions {
  lead: {
    id: string;
    name: string;
    email: string;
    business: string;
    currentProcessor: string;
    monthlyVolume: string;
    vertical: string;
  };
  subject: string;
  html: string;
  text?: string;
}

export async function sendOutreachEmail(opts: OutreachOptions): Promise<{ success: boolean; threadId?: string; error?: string }> {
  return sendEmail({
    to: opts.lead.email,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    leadId: opts.lead.id,
    contactName: opts.lead.name,
    source: "outreach",
  });
}

// ─── Generate Outreach Email Content ────────────────────────────────

export function generateOutreachEmail(lead: {
  name: string;
  business: string;
  currentProcessor: string;
  monthlyVolume: string;
  vertical: string;
}): { subject: string; html: string; text: string } {
  const firstName = lead.name.split(" ")[0] || "there";
  const processor = lead.currentProcessor || "your current processor";
  const volume = lead.monthlyVolume || "your monthly volume";

  const verticalBenefits: Record<string, string> = {
    restaurant: "Restaurants using our program typically save $300-800/month on processing alone.",
    retail: "Retail businesses love that there are zero monthly fees on top of the savings.",
    salon: "Salons and spas find the zero-fee model perfect for high-volume, lower-ticket transactions.",
    auto: "Auto shops save big because processing fees on larger tickets really add up.",
    medical: "Medical practices appreciate the straightforward pricing with no hidden fees.",
    services: "Service businesses benefit from eliminating the monthly statement and PCI compliance fees.",
  };

  const benefit = verticalBenefits[lead.vertical] || "Businesses using our program typically save $300-800/month on processing.";

  const subject = `${lead.business} — eliminate your processing fees entirely`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 32px; background: #ffffff;">
        <p style="font-size: 16px; color: #374151;">Hi ${firstName},</p>
        <p style="font-size: 16px; color: #374151;">
          I noticed ${lead.business} uses ${processor} for payment processing. Most merchants in Hawaii using ${processor} pay 2.6-2.9% per transaction — on ${volume}, that adds up quickly.
        </p>
        <p style="font-size: 16px; color: #374151;">
          We help local businesses <strong>eliminate processing fees entirely</strong> with our zero-fee program. ${benefit}
        </p>
        <p style="font-size: 16px; color: #374151;">Here's how it works:</p>
        <ul style="font-size: 15px; color: #4b5563; line-height: 1.8;">
          <li>Customers pay a small surcharge (like they already do at gas stations)</li>
          <li>You keep 100% of every sale — zero fees taken out</li>
          <li>One-time terminal cost, no monthly fees, no contracts</li>
        </ul>
        <p style="font-size: 16px; color: #374151;">
          Would you be open to a <strong>free statement analysis</strong>? Just reply with a recent processing statement and I'll show you exactly how much you'd save monthly.
        </p>
        <p style="font-size: 16px; color: #374151;">
          No pressure at all — if the savings aren't significant, I'll tell you straight up.
        </p>
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #374151; margin: 0; font-weight: 600;">TechSavvy Hawaii</p>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0;">Zero-Fee Payment Processing</p>
          <p style="font-size: 14px; color: #6b7280; margin: 4px 0;">(808) 767-5460 | contact@techsavvyhawaii.com</p>
        </div>
      </div>
    </div>
  `;

  const text = `Hi ${firstName},\n\nI noticed ${lead.business} uses ${processor} for payment processing. Most merchants in Hawaii using ${processor} pay 2.6-2.9% per transaction — on ${volume}, that adds up quickly.\n\nWe help local businesses eliminate processing fees entirely with our zero-fee program. ${benefit}\n\nHere's how it works:\n- Customers pay a small surcharge (like at gas stations)\n- You keep 100% of every sale — zero fees\n- One-time terminal cost, no monthly fees, no contracts\n\nWould you be open to a free statement analysis? Just reply with a recent processing statement and I'll show you exactly how much you'd save.\n\nNo pressure — if the savings aren't significant, I'll tell you straight up.\n\nTechSavvy Hawaii\n(808) 767-5460 | contact@techsavvyhawaii.com`;

  return { subject, html, text };
}

// ─── Generate Call Script ───────────────────────────────────────────

export async function generateCallScript(lead: {
  id: string;
  name: string;
  business: string;
  currentProcessor: string;
  monthlyVolume: string;
  vertical: string;
  painPoints: string;
}): Promise<{ scriptId: string }> {
  const firstName = lead.name.split(" ")[0] || "the owner";
  const processor = lead.currentProcessor || "their current processor";
  const volume = lead.monthlyVolume || "unknown volume";

  const verticalContext: Record<string, string> = {
    restaurant: "restaurants with high transaction volume",
    retail: "retail stores processing card payments daily",
    salon: "salons with many small transactions",
    auto: "auto shops with larger ticket sizes",
    medical: "medical practices",
    services: "service businesses",
  };

  const context = verticalContext[lead.vertical] || "local businesses";

  const script = `CALL SCRIPT — ${lead.business}
═══════════════════════════════════════════

OPENING (15 seconds):
"Hi, is this ${firstName}? Hey ${firstName}, this is [Your Name] with TechSavvy Hawaii. I'm reaching out to local ${context} about eliminating processing fees — do you have 60 seconds?"

IF YES — QUALIFY:
"Great! Quick question — are you currently using ${processor} for your card processing?"
[Wait for response]

"And roughly what are you processing monthly — around ${volume}?"
[Wait for response]

VALUE PROP (30 seconds):
"Got it. So here's why I'm calling — we have a zero-fee processing program where your customers pay a small surcharge, similar to what gas stations do. That means you keep 100% of every sale. No monthly fees, no PCI fees, no gateway fees. Just a one-time terminal cost and you own it outright."

${lead.painPoints ? `\nADDRESS KNOWN PAIN POINTS:\n${lead.painPoints}\n` : ""}
ASK:
"Would you be open to sending me a recent processing statement? I'll put together a free savings analysis showing exactly what you'd save each month — no obligation at all."

IF INTERESTED:
"Perfect! I can send you a quick email right now to reply to with the statement. What's the best email?"
[Confirm email, send outreach email immediately after call]

IF HESITANT:
"Totally understand. How about I just send over a one-pager that explains the program? You can look at it when you have a minute and reach out if it makes sense."

IF NOT INTERESTED:
"No worries at all, ${firstName}. If anything changes or you want to explore it later, feel free to reach out. Have a great day!"`;

  const talkingPoints = [
    `Currently using ${processor} — processing ~${volume}/month`,
    "Zero-fee program: customers pay surcharge, merchant keeps 100%",
    "No monthly fees, PCI, gateway, or statement fees",
    "One-time terminal cost — merchant owns it",
    "Free custom website included for processing customers",
    `Focused on ${context} in Hawaii`,
  ];

  const objections = [
    { objection: "My customers won't like the surcharge", response: "Gas stations have been doing this for years and customers are used to it. The surcharge is clearly displayed and most customers don't even mention it. Plus, many pay with cash to avoid it — which saves you even more." },
    { objection: "I'm locked in a contract", response: "We can do a statement analysis now and have everything ready for when your contract is up. Plus, many processors have early termination fees that are less than what you'd save in the first few months." },
    { objection: "I'm happy with my current processor", response: "That's great! But are you happy with the fees? Most merchants don't realize how much they're actually paying until they see it broken down. A free statement analysis takes 5 minutes and there's zero obligation." },
    { objection: "I need to think about it", response: "Absolutely, take your time. I'll send you an email with some info. When would be a good time for me to follow up?" },
  ];

  const id = randomUUID();
  await db.insert(schema.callScripts).values({
    id,
    leadId: lead.id,
    script,
    talkingPoints: JSON.stringify(talkingPoints),
    objections: JSON.stringify(objections),
    generatedAt: new Date().toISOString(),
  });

  return { scriptId: id };
}

// ─── Handle Inbound Email (Resend Webhook) ──────────────────────────

interface InboundEmailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function handleInboundEmail(payload: InboundEmailPayload): Promise<{ threadId: string }> {
  const now = new Date().toISOString();

  // Extract sender name from "Name <email>" format
  const fromMatch = payload.from.match(/^(.+?)\s*<(.+?)>$/);
  const fromName = fromMatch ? fromMatch[1].trim() : payload.from;
  const fromEmail = fromMatch ? fromMatch[2].trim() : payload.from;

  // Check if this is a reply to an existing thread by matching sender email
  const existingThreads = await db.select().from(schema.emailThreads)
    .where(eq(schema.emailThreads.contactEmail, fromEmail));

  // Find the most recent matching thread (could be reply)
  const subjectClean = payload.subject.replace(/^(Re:\s*|Fwd:\s*)+/i, "").trim();
  let thread = existingThreads.find(t =>
    t.subject.replace(/^(Re:\s*|Fwd:\s*)+/i, "").trim().toLowerCase() === subjectClean.toLowerCase()
  );

  let threadId: string;
  if (thread) {
    threadId = thread.id;
    // Update thread
    const newSource = thread.source === "outreach" ? "outreach-reply" : thread.source;
    await db.update(schema.emailThreads)
      .set({ lastMessageAt: now, unread: true, status: "open", source: newSource })
      .where(eq(schema.emailThreads.id, threadId));
  } else {
    // New thread from direct email
    threadId = randomUUID();

    // Try to find a lead by email
    const [matchingLead] = await db.select().from(schema.leads)
      .where(eq(schema.leads.email, fromEmail));

    await db.insert(schema.emailThreads).values({
      id: threadId,
      subject: payload.subject,
      leadId: matchingLead?.id || "",
      contactEmail: fromEmail,
      contactName: fromName,
      source: "direct",
      status: "open",
      unread: true,
      lastMessageAt: now,
      createdAt: now,
    });
  }

  // Store the message
  await db.insert(schema.emailMessages).values({
    id: randomUUID(),
    threadId,
    direction: "inbound",
    fromEmail,
    fromName,
    toEmail: payload.to,
    subject: payload.subject,
    body: payload.text || "",
    htmlBody: payload.html || "",
    resendId: "",
    status: "sent",
    sentAt: now,
  });

  // Forward copy to personal email if configured
  const config = await getEmailConfig();
  if (config.forwardCopyTo) {
    const resend = getResendClient();
    if (resend) {
      await resend.emails.send({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: config.forwardCopyTo,
        subject: `[Inbox] ${payload.subject} — from ${fromName}`,
        html: `<p><em>From: ${fromName} &lt;${fromEmail}&gt;</em></p><hr/>${payload.html || `<pre>${payload.text}</pre>`}`,
      }).catch((err) => console.error("Forward copy failed:", err));
    }
  }

  return { threadId };
}
