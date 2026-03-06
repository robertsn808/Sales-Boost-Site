/**
 * Statement analysis handler — comprehensive AI-powered merchant statement review
 * Uses Cloudflare Workers AI (free tier) for both text and image analysis
 */
import { runAI, parseJSON, jsonResponse } from "../helpers.js";

const VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

const ANALYSIS_PROMPT = `You are an expert merchant services consultant analyzing a merchant processing statement for Tech Savvy Hawaii, a zero-fee payment processing company.

Carefully examine every detail provided. Your job is to find every hidden fee, junk charge, inflated rate, and red flag.

Your task:
1. Identify ALL hidden fees, junk fees, inflated rates, and unnecessary charges
2. Calculate or estimate the merchant's effective rate (total fees / total volume)
3. Compare to the industry average effective rate (typically 2.2-2.8% for most retail/restaurant)
4. Estimate how much they are overpaying per month
5. Flag specific red flags and junk fees
6. Provide specific, actionable recommendations

KNOWN JUNK FEES to watch for:
- "Regulatory compliance fee" — made up, not required by card brands
- "Network access fee" — vague, inflated
- "FANF fee" passed to merchant — this is a Visa fee processors should absorb
- "Annual fee" or "account maintenance fee" — pure profit for the processor
- "IRS reporting fee" — processors are required to do this, shouldn't charge for it
- "Rate guarantee fee" — meaningless
- "Technology fee" or "innovation fee" — junk
- Statement fees above $10/month
- Any fee that can't be traced to interchange or card brand requirements

RED FLAG THRESHOLDS:
- Effective rate above 3.5%
- PCI non-compliance fee present (means processor hasn't helped merchant get compliant)
- Equipment lease (almost always overpriced vs buying outright at $399)
- Per-transaction fee above $0.15
- Batch fee above $0.30
- Chargeback fee above $25
- Tiered pricing (qualified/mid-qualified/non-qualified rates)
- Monthly minimum fee being charged
- Annual fee or "rate review" fee
- More than 3 unrecognizable line items
- PCI compliance fee above $12/month

IMPORTANT: Respond ONLY with valid JSON in this exact format (no markdown, no backticks, no commentary):
{
  "summary": "One sentence summary of findings",
  "effectiveRate": "X.XX%",
  "industryAverage": "X.XX%",
  "estimatedOverpay": "$XXX",
  "monthlyVolume": "$XX,XXX",
  "hiddenFees": [
    {
      "name": "Fee name",
      "amount": "$XX.XX",
      "severity": "high|medium|low",
      "explanation": "Why this fee is problematic and what it should be"
    }
  ],
  "redFlags": [
    "Description of red flag detected"
  ],
  "junkFees": [
    {
      "name": "Fee name",
      "amount": "$XX.XX",
      "why": "Why this is a junk fee"
    }
  ],
  "feeBreakdown": {
    "pciFee": "$X.XX or 'not found'",
    "pciNonComplianceFee": "$X.XX or 'not found'",
    "equipmentFee": "$X.XX or 'not found'",
    "batchFee": "$X.XX or 'not found'",
    "perTransactionFee": "$X.XX or 'not found'",
    "chargebackFee": "$X.XX or 'not found'"
  },
  "recommendations": [
    "Specific actionable recommendation"
  ],
  "overallGrade": "A|B|C|D|F"
}

Grade scale: A = excellent rates, few issues. B = slightly above average. C = moderately overcharged with several junk fees. D = significantly overcharged, multiple red flags. F = severely overcharged, predatory fees present.

Be aggressive in identifying problems — processors almost always pad statements with unnecessary fees. If something looks suspicious, flag it.`;

export async function handleAnalyzeStatement(body, env) {
  const { text, imageBase64, imageType } = body;

  if (!text && !imageBase64) {
    return jsonResponse({ error: "Missing 'text' or 'imageBase64' field" }, 400);
  }

  try {
    let raw;

    if (imageBase64 && imageType) {
      // Image-based analysis using vision model
      const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
      const response = await env.AI.run(VISION_MODEL, {
        messages: [
          {
            role: "user",
            content: [
              { type: "image", image: [...imageBytes] },
              { type: "text", text: ANALYSIS_PROMPT + "\n\nAnalyze this merchant processing statement image thoroughly. Read every line item and fee." },
            ],
          },
        ],
        max_tokens: 2048,
      });
      raw = response.response || "";
    } else {
      // Text-based analysis
      raw = await runAI(env, ANALYSIS_PROMPT, `Here is the merchant processing statement text to analyze:\n\n${text.slice(0, 8000)}`, 2048);
    }

    const parsed = parseJSON(raw);

    if (!parsed) {
      return jsonResponse({
        error: "Failed to parse analysis",
        raw: raw.slice(0, 500),
        summary: "Unable to fully parse statement. Please try again or contact us for manual review.",
        effectiveRate: "N/A",
        industryAverage: "2.5%",
        estimatedOverpay: "N/A",
        monthlyVolume: "N/A",
        hiddenFees: [],
        redFlags: [],
        junkFees: [],
        feeBreakdown: {},
        recommendations: ["Contact TechSavvy Hawaii at (808) 767-5460 for a free manual review."],
        overallGrade: "C",
      });
    }

    return jsonResponse({
      summary: parsed.summary || "Analysis complete.",
      effectiveRate: parsed.effectiveRate || "N/A",
      industryAverage: parsed.industryAverage || "2.5%",
      estimatedOverpay: parsed.estimatedOverpay || "N/A",
      monthlyVolume: parsed.monthlyVolume || "N/A",
      hiddenFees: Array.isArray(parsed.hiddenFees) ? parsed.hiddenFees : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      junkFees: Array.isArray(parsed.junkFees) ? parsed.junkFees : [],
      feeBreakdown: parsed.feeBreakdown || {},
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      overallGrade: parsed.overallGrade || "C",
    });
  } catch (err) {
    return jsonResponse({
      error: "Analysis failed — please try again",
      summary: "Analysis encountered an error. Please try re-uploading or contact us.",
      effectiveRate: "N/A",
      industryAverage: "2.5%",
      estimatedOverpay: "N/A",
      monthlyVolume: "N/A",
      hiddenFees: [],
      redFlags: [],
      junkFees: [],
      feeBreakdown: {},
      recommendations: ["Call (808) 767-5460 for a free manual statement review."],
      overallGrade: "C",
    });
  }
}
