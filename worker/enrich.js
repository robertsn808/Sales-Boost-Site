/**
 * enrich.js — Tech Savvy Hawaii AI Worker (Multi-Route)
 * Cloudflare Workers AI powered endpoints for lead enrichment,
 * sales tools, content generation, training, and statement analysis.
 *
 * Routes:
 *   POST /enrich             — Extract structured lead data from raw text
 *   POST /pitch              — Generate tailored 30-second pitch script
 *   POST /objection          — Generate rebuttal for merchant objections
 *   POST /score              — Score a lead 1-100 for outreach priority
 *   POST /email              — Generate personalized follow-up email
 *   POST /sms                — Generate short follow-up text message
 *   POST /summarize          — Summarize long content with key numbers
 *   POST /quiz               — Generate training quiz from content
 *   POST /roleplay           — Simulate merchant conversation scenario
 *   POST /classify           — Classify inbound message by intent
 *   POST /extract-statement  — Parse merchant processing statements
 *   POST /analyze-statement  — Full AI statement analysis (grade, fees, recs)
 *   POST /recommend          — AI next-step recommendation for a lead
 *   POST /chat               — Public website chat
 *
 * Deploy: cd worker && npx wrangler deploy
 */

import { getAllowedOrigin, corsHeaders, jsonResponse } from "./helpers.js";
import { handleEnrich, handleExtractStatement } from "./handlers/leads.js";
import { handlePitch, handleObjection, handleScore, handleEmail, handleSms, handleRecommend } from "./handlers/sales.js";
import { handleSummarize, handleQuiz, handleRoleplay, handleClassify, handleChat } from "./handlers/content.js";
import { handleAnalyzeStatement } from "./handlers/statement.js";

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = getAllowedOrigin(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // GET / — health check (no auth required)
    if (request.method === "GET" && path === "/") {
      return jsonResponse({
        service: "Tech Savvy Hawaii AI Worker",
        status: "online",
        model: "@cf/meta/llama-3.1-8b-instruct",
        routes: [
          "POST /enrich",
          "POST /pitch",
          "POST /objection",
          "POST /score",
          "POST /email",
          "POST /sms",
          "POST /summarize",
          "POST /quiz",
          "POST /roleplay",
          "POST /classify",
          "POST /extract-statement",
          "POST /analyze-statement",
          "POST /recommend",
          "POST /chat",
        ],
      }, 200, allowedOrigin);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "POST required" }, 405, allowedOrigin);
    }

    // Auth: require shared secret on all POST routes except /chat (public website)
    const workerKey = env.WORKER_KEY || "";
    const providedKey = request.headers.get("X-Worker-Key") || "";
    if (workerKey && providedKey !== workerKey && path !== "/chat") {
      return jsonResponse({ error: "Unauthorized" }, 401, allowedOrigin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, allowedOrigin);
    }

    const handlers = {
      "/enrich": handleEnrich,
      "/pitch": handlePitch,
      "/objection": handleObjection,
      "/score": handleScore,
      "/email": handleEmail,
      "/sms": handleSms,
      "/summarize": handleSummarize,
      "/quiz": handleQuiz,
      "/roleplay": handleRoleplay,
      "/classify": handleClassify,
      "/extract-statement": handleExtractStatement,
      "/analyze-statement": handleAnalyzeStatement,
      "/recommend": handleRecommend,
      "/chat": handleChat,
    };

    // Legacy: POST to / still runs enrich for backward compat
    const handler = handlers[path] || (path === "/" ? handleEnrich : null);

    if (!handler) {
      return jsonResponse({ error: `Unknown route: ${path}` }, 404, allowedOrigin);
    }

    try {
      const response = await handler(body, env);
      // Inject correct CORS origin at router level
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      return response;
    } catch (err) {
      return jsonResponse({ error: "Internal processing error" }, 500, allowedOrigin);
    }
  },
};
