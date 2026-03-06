/**
 * Tech Savvy Hawaii — Email Worker (tight-fog-5031)
 * 
 * Handles:
 * 1. email() — Inbound email processing, AI classification, D1 logging, forwarding
 * 2. fetch() — API for health check and manual operations
 */

import PostalMime from "postal-mime";

const AI_WORKER_URL = "https://mojo-luna-955c.gorjessbbyx3.workers.dev";
const FORWARD_TO = "gorjessbbyx3@icloud.com";

export default {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FETCH Handler — API endpoints
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Worker-Key",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data, null, 2), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    // Health check
    if (path === "/" || path === "/health") {
      return json({
        service: "Tech Savvy Hawaii Email Worker",
        status: "online",
        forward_to: FORWARD_TO,
        ai_worker: AI_WORKER_URL,
        db_bound: !!env.DB,
        endpoints: [
          "GET  /             — Health check",
          "GET  /stats         — Email folder stats",
          "POST /test-classify — Test AI classification",
        ],
      });
    }

    // Stats
    if (path === "/stats" && env.DB) {
      try {
        const folders = await env.DB.prepare(`
          SELECT folder, COUNT(*) as count, SUM(CASE WHEN unread = 1 THEN 1 ELSE 0 END) as unread_count
          FROM email_threads GROUP BY folder
        `).all();
        const total = await env.DB.prepare(`SELECT COUNT(*) as count FROM email_threads`).first();
        const starred = await env.DB.prepare(`SELECT COUNT(*) as count FROM email_threads WHERE starred = 1`).first();
        return json({ total: total?.count || 0, starred: starred?.count || 0, folders: folders?.results || [] });
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    // Test classify
    if (path === "/test-classify" && request.method === "POST") {
      try {
        const body = await request.json();
        const classifyRes = await fetch(`${AI_WORKER_URL}/classify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Worker-Key": env.WORKER_KEY || "",
          },
          body: JSON.stringify({
            message: body.message || "Test email from customer asking about pricing",
            source: "email",
          }),
        });
        const data = await classifyRes.json();
        return json({ classification: data, status: classifyRes.status });
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    return json({ error: "Not found" }, 404);
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EMAIL Handler — Inbound email processing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async email(message, env, ctx) {
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get("subject") || "(no subject)";

    console.log(`📧 Inbound email from: ${from} | Subject: ${subject}`);

    // Parse email body
    let textBody = "";
    let htmlBody = "";
    try {
      const rawEmail = await new Response(message.raw).arrayBuffer();
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);
      textBody = parsed.text || "";
      htmlBody = parsed.html || "";
    } catch (err) {
      console.error("Failed to parse email body:", err);
    }

    const bodyPreview = textBody.slice(0, 2000) || htmlBody.replace(/<[^>]*>/g, "").slice(0, 2000);

    // Extract sender info
    const nameMatch = from.match(/^([^<]+)</);
    const senderName = nameMatch ? nameMatch[1].trim() : from.split("@")[0];
    const senderEmail = from.match(/<([^>]+)>/) ? from.match(/<([^>]+)>/)[1] : from;

    // Classify via AI Worker
    let classification = {
      intent: "general_inquiry",
      priority: "normal",
      summary: subject,
      suggestedAction: "Review and respond",
      sentiment: "neutral",
    };

    try {
      const classifyRes = await fetch(`${AI_WORKER_URL}/classify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Key": env.WORKER_KEY || "",
        },
        body: JSON.stringify({
          message: `From: ${from}\nSubject: ${subject}\n\n${bodyPreview.slice(0, 1000)}`,
          source: "email",
        }),
      });
      if (classifyRes.ok) {
        const data = await classifyRes.json();
        if (data && data.intent) classification = data;
      }
    } catch (err) {
      console.error("AI classify failed (non-blocking):", err);
    }

    console.log(`🏷️ ${classification.intent} | ${classification.priority} | ${classification.sentiment}`);

    // Determine folder
    const folder = classification.intent === "spam" ? "spam" : "inbox";

    // Log ALL emails to D1 (including spam — goes to spam folder)
    if (env.DB) {
      try {
        const now = new Date().toISOString();
        const threadId = crypto.randomUUID();
        const messageId = crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO email_threads (id, subject, lead_id, contact_email, contact_name, source, status, folder, starred, ai_intent, ai_priority, ai_sentiment, unread, last_message_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          threadId, subject, "", senderEmail, senderName, "email_inbound", "open",
          folder, 0,
          classification.intent || "", classification.priority || "normal", classification.sentiment || "neutral",
          1, now, now
        ).run();

        await env.DB.prepare(`
          INSERT INTO email_messages (id, thread_id, direction, from_email, from_name, to_email, subject, body, html_body, resend_id, status, sent_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          messageId, threadId, "inbound", senderEmail, senderName, to, subject,
          bodyPreview.slice(0, 5000), htmlBody.slice(0, 10000), "", "received", now
        ).run();

        console.log(`💾 → ${folder}: thread ${threadId}`);

        // Create lead if new_lead
        if (classification.intent === "new_lead") {
          const leadId = crypto.randomUUID();
          await env.DB.prepare(`
            INSERT INTO leads (id, name, email, source, status, notes, best_contact_method, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            leadId, senderName, senderEmail, "email_inbound", "new",
            `[Email] ${subject}\n\n${bodyPreview.slice(0, 500)}\n\n[AI] ${classification.summary || ""}`,
            "email", now, now
          ).run();
          await env.DB.prepare(`UPDATE email_threads SET lead_id = ? WHERE id = ?`).bind(leadId, threadId).run();
          console.log(`🎯 Lead: ${leadId}`);
        }
      } catch (err) {
        console.error("D1 failed:", err);
      }
    }

    // Forward (non-spam only)
    if (folder !== "spam") {
      try {
        await message.forward(FORWARD_TO);
        console.log("📨 Forwarded");
      } catch (err) {
        console.error("Forward failed:", err);
      }
    }

    // Auto-reply for new leads
    if (env.SEND_EMAIL && classification.intent === "new_lead" && classification.sentiment !== "angry") {
      try {
        const firstName = nameMatch ? nameMatch[1].trim().split(" ")[0] : "there";
        const autoReply = new EmailMessage("contact@techsavvyhawaii.com", senderEmail, buildAutoReplyRaw(firstName, subject));
        await env.SEND_EMAIL.send(autoReply);
        console.log(`✅ Auto-reply → ${senderEmail}`);

        if (env.DB) {
          try {
            const thread = await env.DB.prepare(
              `SELECT id FROM email_threads WHERE contact_email = ? AND subject = ? ORDER BY created_at DESC LIMIT 1`
            ).bind(senderEmail, subject).first();
            if (thread) {
              const now = new Date().toISOString();
              await env.DB.prepare(`
                INSERT INTO email_messages (id, thread_id, direction, from_email, from_name, to_email, subject, body, html_body, resend_id, status, sent_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(crypto.randomUUID(), thread.id, "outbound", "contact@techsavvyhawaii.com", "TechSavvy Hawaii", senderEmail, `Re: ${subject}`, `Auto-reply sent to ${firstName}`, "", "", "sent", now).run();
              await env.DB.prepare(`UPDATE email_threads SET last_message_at = ? WHERE id = ?`).bind(now, thread.id).run();
            }
          } catch (e) { console.error("Auto-reply log failed:", e); }
        }
      } catch (err) {
        console.error("Auto-reply failed:", err);
      }
    }
  },
};

function buildAutoReplyRaw(firstName, originalSubject) {
  const subject = `Re: ${originalSubject}`;
  const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;"><div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:32px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:22px;">Tech Savvy Hawaii</h1><p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">Zero-Fee Payment Processing</p></div><div style="padding:32px;"><p style="font-size:16px;color:#1e293b;line-height:1.6;">Hey ${firstName}! 👋</p><p style="font-size:15px;color:#475569;line-height:1.6;">Thanks for reaching out to Tech Savvy Hawaii. We got your message and someone from our team will get back to you within a few hours during business hours (Mon-Fri, 8 AM – 5 PM HST).</p><ul style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;"><li><strong>Zero processing fees</strong></li><li><strong>Free custom website</strong> with every account</li><li><strong>Next-day deposits</strong></li><li><strong>30-day free trial</strong> — no contracts</li></ul><div style="text-align:center;margin:24px 0;"><a href="tel:8087675460" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;">📞 Call (808) 767-5460</a></div></div><div style="padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;"><p style="font-size:12px;color:#94a3b8;margin:0;">Tech Savvy Hawaii · <a href="https://techsavvyhawaii.com" style="color:#94a3b8;">techsavvyhawaii.com</a></p></div></div></body></html>`;
  const textBody = `Hey ${firstName}!\n\nThanks for reaching out to Tech Savvy Hawaii. We got your message and someone from our team will get back to you within a few hours (Mon-Fri, 8 AM - 5 PM HST).\n\nCall us: (808) 767-5460\n\n- Tech Savvy Hawaii`;
  const boundary = "----=_TSH_" + Date.now();
  return [`From: Tech Savvy Hawaii <contact@techsavvyhawaii.com>`,`Subject: ${subject}`,`MIME-Version: 1.0`,`Content-Type: multipart/alternative; boundary="${boundary}"`,``,`--${boundary}`,`Content-Type: text/plain; charset=utf-8`,``,textBody,``,`--${boundary}`,`Content-Type: text/html; charset=utf-8`,``,htmlBody,``,`--${boundary}--`].join("\r\n");
}
