/**
 * Shared helpers for Tech Savvy Hawaii AI Worker
 */

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

export async function runAI(env, systemPrompt, userMessage, maxTokens = 512) {
  const response = await env.AI.run(MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: maxTokens,
    temperature: 0.1,
  });
  return response.response || "";
}

export function parseJSON(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim();
  // Attempt 1: direct parse
  try { return JSON.parse(cleaned); } catch {}
  // Attempt 2: extract JSON object from surrounding text
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
    // Attempt 3: fix common LLM JSON issues (trailing commas, single quotes)
    try {
      const fixed = m[0]
        .replace(/,\s*([}\]])/g, "$1")       // trailing commas
        .replace(/'/g, '"')                    // single quotes
        .replace(/(\w+)\s*:/g, '"$1":')        // unquoted keys
        .replace(/""+/g, '"');                  // double-double quotes
      return JSON.parse(fixed);
    } catch {}
  }
  return null;
}

export function s(val) {
  if (!val || typeof val !== "string") return "";
  return val.trim().replace(/\n/g, " ");
}

const VALID_VERTICALS = [
  "restaurant", "retail", "salon", "auto_repair", "food_truck",
  "bar", "hotel", "medical", "fitness", "other",
];

export function validateVertical(v) {
  if (!v) return "other";
  const lower = v.toLowerCase().replace(/[\s-]/g, "_");
  return VALID_VERTICALS.includes(lower) ? lower : "other";
}

const ALLOWED_ORIGINS = [
  "https://techsavvyhawaii.com",
  "https://www.techsavvyhawaii.com",
  "https://tech-savvy-hawaii.replit.app",
  "http://localhost:5000",
  "http://localhost:3000",
];

export function getAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export function corsHeaders(origin = "https://techsavvyhawaii.com") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Worker-Key",
  };
}

export function jsonResponse(data, status = 200, origin = "https://techsavvyhawaii.com") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}
