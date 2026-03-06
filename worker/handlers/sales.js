/**
 * Sales tool handlers: pitch, objection, score, email, sms
 */
import { runAI, parseJSON, jsonResponse } from "../helpers.js";

export async function handlePitch(body, env) {
  const { vertical, painPoints, businessName, ownerName } = body;
  if (!vertical) {
    return jsonResponse({ error: "Missing 'vertical' field" }, 400);
  }

  const prompt = `You are a sales coach for Tech Savvy Hawaii, a merchant services company in Hawaii.
Generate a natural, confident 30-second pitch script for a merchant services consultant walking into a business.

Rules:
- Speak like a real person, not a corporate robot
- Lead with value, not features
- Reference their specific industry pain points
- Keep it under 100 words
- Include a soft ask at the end (review their current setup, not a hard close)
- Return ONLY valid JSON with these fields:
  - opening: the first line to break the ice (string)
  - pitch: the main value proposition (string)
  - ask: the closing question/soft ask (string)
  - tips: array of 2-3 delivery tips (string array)`;

  const context = `Business type: ${vertical}
${businessName ? `Business name: ${businessName}` : ""}
${ownerName ? `Owner/contact: ${ownerName}` : ""}
${painPoints ? `Known pain points: ${painPoints}` : ""}`;

  const raw = await runAI(env, prompt, context);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleObjection(body, env) {
  const { objection, vertical, context } = body;
  if (!objection) {
    return jsonResponse({ error: "Missing 'objection' field" }, 400);
  }

  const prompt = `You are a sales trainer for Tech Savvy Hawaii, a merchant services company.
A merchant has raised an objection. Generate a professional, empathetic rebuttal.

Use the Acknowledge-Clarify-Resolve framework:
1. Acknowledge their concern (show you heard them)
2. Clarify the real issue behind the objection
3. Resolve with a specific, practical response

Rules:
- Be respectful, never dismissive
- Use concrete numbers or examples when possible
- Keep each section 1-3 sentences
- Return ONLY valid JSON:
  - acknowledge: empathy statement (string)
  - clarify: clarifying question or reframe (string)
  - resolve: the rebuttal with proof/example (string)
  - followUp: a question to re-engage them (string)
  - category: objection type — one of: price, timing, loyalty, trust, indifference (string)`;

  const input = `Objection: "${objection}"
${vertical ? `Business type: ${vertical}` : ""}
${context ? `Additional context: ${context}` : ""}`;

  const raw = await runAI(env, prompt, input);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleScore(body, env) {
  const { vertical, monthlyVolume, currentProcessor, painPoints, notes } = body;

  const prompt = `You are a lead scoring engine for Tech Savvy Hawaii, a merchant services company.
Score this lead from 1-100 based on conversion likelihood and potential revenue.

Scoring factors (weight):
- Vertical fit (20%): restaurants, bars, auto repair, salons score highest
- Monthly volume (25%): higher volume = higher score
- Current processor (20%): Square/Stripe/Toast users are easier to convert than legacy processors
- Pain points (25%): more pain = more urgency to switch
- Completeness of info (10%): more data = easier to close

Return ONLY valid JSON:
- score: number 1-100
- grade: A (80-100), B (60-79), C (40-59), D (20-39), F (1-19)
- factors: object with each factor name and its individual score (0-100)
- recommendation: one of "hot_lead", "warm_lead", "nurture", "low_priority"
- reasoning: 1-2 sentence explanation`;

  const input = `Vertical: ${vertical || "unknown"}
Monthly volume: ${monthlyVolume || "unknown"}
Current processor: ${currentProcessor || "unknown"}
Pain points: ${painPoints || "none specified"}
Notes: ${notes || "none"}`;

  const raw = await runAI(env, prompt, input);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleEmail(body, env) {
  const { ownerName, businessName, vertical, context, tone } = body;
  if (!businessName) {
    return jsonResponse({ error: "Missing 'businessName' field" }, 400);
  }

  const prompt = `You are a sales copywriter for Tech Savvy Hawaii, a merchant services company in Hawaii.
Write a personalized follow-up email to a merchant you recently visited or spoke with.

Rules:
- Keep it under 150 words
- Warm, professional tone (not corporate or salesy)
- Reference something specific about their business
- Include one clear call-to-action
- Sign off as the agent (use "your Tech Savvy Hawaii rep" if no name given)
- Return ONLY valid JSON:
  - subject: email subject line (string)
  - body: the full email text (string)
  - callToAction: what you want them to do (string)`;

  const input = `Recipient: ${ownerName || "Business Owner"}
Business: ${businessName}
Industry: ${vertical || "local business"}
Context: ${context || "Initial visit follow-up"}
Tone: ${tone || "friendly and professional"}`;

  const raw = await runAI(env, prompt, input);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleRecommend(body, env) {
  const { name, business, vertical, status, painPoints, notes, lastContact, monthlyVolume, currentProcessor, daysSinceUpdate } = body;
  if (!business && !name) {
    return jsonResponse({ error: "Missing 'business' or 'name' field" }, 400);
  }

  const prompt = `You are an AI sales advisor for Tech Savvy Hawaii, a merchant services company in Hawaii.
Analyze this lead and recommend the best next action to move them forward in the sales pipeline.

You must return ONLY valid JSON with these fields:
- nextAction: one of "send_email", "call_now", "send_text", "schedule_meeting", "send_statement_request", "send_proposal", "follow_up_later", "nurture_drip", "close_deal", "drop_lead"
- priority: "urgent", "high", "medium", "low"
- reasoning: 1-2 sentence explanation of why this action (string)
- suggestedMessage: a short ready-to-use message draft for the recommended action (string, under 200 chars)
- moveToStage: recommended pipeline stage to move this lead to, one of: "new", "contacted", "qualified", "statement-requested", "statement-received", "analysis-delivered", "proposal-sent", "negotiation", "won", "lost", "nurture" (string)
- timing: when to take this action, e.g. "now", "today", "tomorrow morning", "in 2 days", "next week" (string)
- confidence: 1-100 confidence score for this recommendation (number)`;

  const input = `Lead: ${name || "Unknown"} at ${business || "Unknown Business"}
Industry: ${vertical || "unknown"}
Current stage: ${status || "new"}
Monthly volume: ${monthlyVolume || "unknown"}
Current processor: ${currentProcessor || "unknown"}
Pain points: ${painPoints || "none specified"}
Notes: ${notes || "none"}
Last contact: ${lastContact || "unknown"}
Days since last update: ${daysSinceUpdate || "unknown"}`;

  const raw = await runAI(env, prompt, input, 600);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleSms(body, env) {
  const { ownerName, businessName, context, tone } = body;
  if (!businessName) {
    return jsonResponse({ error: "Missing 'businessName' field" }, 400);
  }

  const prompt = `You are a sales rep for Tech Savvy Hawaii, a merchant services company.
Write a brief, friendly follow-up text message to a merchant.

Rules:
- MAX 160 characters (SMS limit)
- Casual but professional
- Include one clear next step
- No emojis unless tone is "casual"
- Return ONLY valid JSON:
  - message: the SMS text (string, max 160 chars)
  - charCount: character count (number)`;

  const input = `To: ${ownerName || "there"}
Business: ${businessName}
Context: ${context || "follow-up after visit"}
Tone: ${tone || "friendly"}`;

  const raw = await runAI(env, prompt, input);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}
