/**
 * Content & training handlers: summarize, quiz, roleplay, classify, chat
 */
import { runAI, parseJSON, jsonResponse } from "../helpers.js";

export async function handleSummarize(body, env) {
  const { text, focus } = body;
  if (!text || text.length < 20) {
    return jsonResponse({ error: "Missing or too short 'text' field" }, 400);
  }

  const prompt = `You are a business analyst for Tech Savvy Hawaii, a merchant services company.
Summarize the following content concisely, pulling out key numbers, facts, and actionable insights.

Rules:
- Keep summary under 200 words
- Highlight dollar amounts, percentages, dates, and names
- Note anything relevant to merchant services or payment processing
- Return ONLY valid JSON:
  - summary: concise summary (string)
  - keyNumbers: array of important numbers/stats found (string array)
  - keyNames: array of people/business names found (string array)
  - actionItems: array of potential next steps or opportunities (string array)
  ${focus ? `- Focus especially on: ${focus}` : ""}`;

  const raw = await runAI(env, prompt, text.slice(0, 4000));
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleQuiz(body, env) {
  const { content, topic, difficulty } = body;
  if (!content && !topic) {
    return jsonResponse({ error: "Need 'content' or 'topic' field" }, 400);
  }

  const prompt = `You are a training quiz generator for CashSwipe Classroom, the training platform for Tech Savvy Hawaii merchant services agents.

Generate a 5-question multiple-choice quiz to test knowledge.

Rules:
- Each question has 4 options (A, B, C, D)
- One correct answer per question
- Mix difficulty: 2 easy, 2 medium, 1 hard
- Questions should be practical and scenario-based when possible
- Return ONLY valid JSON:
  - title: quiz title (string)
  - questions: array of 5 objects, each with:
    - question: the question text (string)
    - options: object with keys A, B, C, D and string values
    - correct: the correct letter (string)
    - explanation: why that answer is correct (string)`;

  const input = content
    ? `Generate quiz based on this content:\n${content.slice(0, 3000)}`
    : `Generate quiz on topic: ${topic}\nDifficulty: ${difficulty || "mixed"}`;

  const raw = await runAI(env, prompt, input, 1024);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleRoleplay(body, env) {
  const { scenario, vertical, agentMessage } = body;
  if (!scenario && !agentMessage) {
    return jsonResponse({ error: "Need 'scenario' or 'agentMessage'" }, 400);
  }

  const prompt = `You are a roleplay simulator for training merchant services sales agents at Tech Savvy Hawaii.
You play the role of a business owner who is being approached by a payment processing sales rep.

Character rules:
- Stay in character as the business owner at all times
- Be realistic — not immediately hostile but not a pushover
- Show real concerns business owners have (fees, contracts, switching hassle)
- React naturally to what the agent says
- If the agent does well, gradually warm up
- If the agent is pushy or uses jargon, push back

Return ONLY valid JSON:
- merchantResponse: what the business owner says (string)
- mood: current merchant mood — one of: skeptical, curious, annoyed, interested, ready_to_talk, walking_away (string)
- innerThought: what the merchant is really thinking (string, for training feedback)
- coachTip: advice for the agent on how to handle this moment (string)`;

  const input = scenario
    ? `Scenario setup: ${scenario}\nMerchant industry: ${vertical || "general retail"}\n${agentMessage ? `Agent says: "${agentMessage}"` : "Agent just walked in."}`
    : `Agent says: "${agentMessage}"\nMerchant industry: ${vertical || "general retail"}`;

  const raw = await runAI(env, prompt, input);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleClassify(body, env) {
  const { message, source } = body;
  if (!message) {
    return jsonResponse({ error: "Missing 'message' field" }, 400);
  }

  const prompt = `You are an intake classifier for Tech Savvy Hawaii, a merchant services company.
Classify this inbound message by intent and priority.

Return ONLY valid JSON:
- intent: one of: new_lead, support_request, partnership_inquiry, billing_question, cancellation, complaint, spam, general_inquiry (string)
- priority: one of: urgent, high, normal, low (string)
- summary: 1-sentence summary of what they need (string)
- suggestedAction: what to do next (string)
- sentiment: one of: positive, neutral, negative, angry (string)`;

  const input = `Message: "${message.slice(0, 2000)}"
${source ? `Source: ${source}` : ""}`;

  const raw = await runAI(env, prompt, input);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}

export async function handleChat(body, env) {
  const { message, systemPrompt, history } = body;
  if (!message || typeof message !== "string" || message.length > 2000) {
    return jsonResponse({ error: "Message required (max 2000 chars)" }, 400);
  }

  const defaultSystem = `You are a helpful assistant for TechSavvy Hawaii, a zero-fee payment processing company.
TechSavvy offers: zero processing fees (customers pay a small surcharge), one-time $399 terminal cost,
no monthly fees, no contracts, and a free custom website for all processing customers.
Be friendly, concise, and professional. Keep answers under 150 words.
If asked about specific pricing or contracts, direct them to call (808) 767-5460.`;

  // Build messages array with history support
  const messages = [{ role: "system", content: systemPrompt || defaultSystem }];

  if (Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      if (h.role && h.content && typeof h.content === "string") {
        messages.push({ role: h.role, content: h.content.slice(0, 2000) });
      }
    }
  }

  messages.push({ role: "user", content: message });

  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages,
    max_tokens: 512,
    temperature: 0.3,
  });

  return jsonResponse({ reply: response.response || "" });
}
