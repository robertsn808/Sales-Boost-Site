// ============================================================
// handlers/statement.js — Updated extract-statement endpoint
// Aligned to "Top 10 Things to Check on Your Merchant Statement" PDF
// Drop-in replacement for handleExtractStatement in your worker
// ============================================================

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

/**
 * POST /extract-statement
 * Accepts { text: string } — raw merchant statement text (OCR or pasted)
 * Returns structured JSON with all 10 checklist items + red flags
 */
async function handleExtractStatement(body, env) {
  const { text } = body;

  if (!text || text.length < 20) {
    return jsonResponse({ error: "Missing or too short 'text' field (min 20 chars)" }, 400);
  }

  const prompt = `You are a merchant statement analyst for Tech Savvy Hawaii, a merchant services company.
Parse this merchant processing statement text and extract ALL key financial data.

Extract these fields precisely (use 0 for numbers and "" for strings if not found):

CORE METRICS:
- processorName: who processes their cards (string)
- monthlyVolume: total monthly processing volume in dollars (number)
- transactionCount: number of transactions (number)
- averageTicket: average transaction size in dollars (number)
- totalFees: total monthly fees charged in dollars (number)
- effectiveRate: total fees / total volume × 100 as percentage (number, e.g. 3.2)

FEE BREAKDOWN — The Top 10:
1. interchangeFees: interchange/wholesale card network fees in dollars (number)
2. processorMarkup: processor's markup above interchange in dollars (number)
3. monthlyFees: fixed monthly fees — statement fee, account maintenance, service fee combined (number)
4. pciFee: PCI compliance fee, monthly amount in dollars (number). If billed annually, divide by 12.
5. pciNonComplianceFee: PCI non-compliance penalty fee if present in dollars (number). This is a RED FLAG.
6. equipmentFee: terminal lease, rental, or gateway fee per month in dollars (number)
7. batchFee: per-batch/settlement fee amount in dollars (number, e.g. 0.25)
8. perTransactionFee: per-transaction or per-authorization fee in dollars (number, e.g. 0.10)
9. chargebackFee: fee per chargeback/retrieval in dollars (number)
10. earlyTerminationFee: ETF or cancellation penalty in dollars (number)

CARD VOLUME BREAKDOWN:
- cardBreakdown: object with visa, mastercard, amex, discover volumes in dollars if found (object)

CONTRACT INFO:
- contractEndDate: end date of current processing contract if mentioned (string)
- pricingModel: one of "interchange_plus", "tiered", "flat_rate", "cash_discount", "unknown" (string)

JUNK FEES:
- junkFees: array of any suspicious/made-up fees found. Examples: "regulatory fee", "IRS reporting fee", "inactivity fee", "minimum processing fee", unexplained fees. Each item should be an object with { name: string, amount: number } (array)

RED FLAGS — Check against these thresholds and flag violations:
- redFlags: array of string warnings. Check for:
  * Effective rate over 3.5%
  * Monthly fees over $25 combined
  * PCI non-compliance fee present (any amount)
  * PCI fee over $12/month ($144/year)
  * Equipment lease over $30/month
  * Batch fee over $0.50
  * Per-transaction fee over $0.25
  * Multiple stacking per-transaction fees
  * Chargeback fee over $35
  * ETF over $500 or "liquidated damages" language
  * Tiered pricing model detected
  * "Qualified" rate below 1.6% (teaser rate)
  * Any junk fees found
  * Terminal lease longer than 24 months

SAVINGS ESTIMATE:
- potentialMonthlySavings: estimated monthly savings if switched to zero-fee/cash-discount program. Calculate as totalFees × 0.85 since cash discount eliminates nearly all processing fees (number)
- potentialAnnualSavings: potentialMonthlySavings × 12 (number)

SUMMARY:
- overallHealth: one of "good", "fair", "overpaying", "critical" based on number of red flags. 0 flags = good, 1-2 = fair, 3-4 = overpaying, 5+ = critical (string)
- notes: 2-3 sentence plain-English summary a business owner would understand, highlighting the biggest issues found (string)

Return ONLY valid JSON — no markdown, no backticks, no explanation.`;

  const raw = await runAI(env, prompt, text.slice(0, 4000), 1500);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({
      error: "Failed to parse AI response",
      raw: raw.slice(0, 500),
      // Return empty scaffold so frontend doesn't break
      processorName: "",
      monthlyVolume: 0,
      transactionCount: 0,
      averageTicket: 0,
      totalFees: 0,
      effectiveRate: 0,
      interchangeFees: 0,
      processorMarkup: 0,
      monthlyFees: 0,
      pciFee: 0,
      pciNonComplianceFee: 0,
      equipmentFee: 0,
      batchFee: 0,
      perTransactionFee: 0,
      chargebackFee: 0,
      earlyTerminationFee: 0,
      cardBreakdown: {},
      contractEndDate: "",
      pricingModel: "unknown",
      junkFees: [],
      redFlags: [],
      potentialMonthlySavings: 0,
      potentialAnnualSavings: 0,
      overallHealth: "unknown",
      notes: ""
    });
  }

  // Post-process: ensure all fields exist with correct types
  const result = {
    // Core metrics
    processorName:      str(parsed.processorName),
    monthlyVolume:      num(parsed.monthlyVolume),
    transactionCount:   num(parsed.transactionCount),
    averageTicket:      num(parsed.averageTicket),
    totalFees:          num(parsed.totalFees),
    effectiveRate:      num(parsed.effectiveRate),

    // Top 10 fee breakdown
    interchangeFees:    num(parsed.interchangeFees),
    processorMarkup:    num(parsed.processorMarkup),
    monthlyFees:        num(parsed.monthlyFees),
    pciFee:             num(parsed.pciFee),
    pciNonComplianceFee: num(parsed.pciNonComplianceFee),
    equipmentFee:       num(parsed.equipmentFee),
    batchFee:           num(parsed.batchFee),
    perTransactionFee:  num(parsed.perTransactionFee),
    chargebackFee:      num(parsed.chargebackFee),
    earlyTerminationFee: num(parsed.earlyTerminationFee),

    // Breakdowns
    cardBreakdown:      parsed.cardBreakdown && typeof parsed.cardBreakdown === "object" ? parsed.cardBreakdown : {},
    contractEndDate:    str(parsed.contractEndDate),
    pricingModel:       validatePricingModel(parsed.pricingModel),

    // Junk fees & red flags
    junkFees:           Array.isArray(parsed.junkFees) ? parsed.junkFees : [],
    redFlags:           Array.isArray(parsed.redFlags) ? parsed.redFlags : [],

    // Savings
    potentialMonthlySavings: num(parsed.potentialMonthlySavings),
    potentialAnnualSavings:  num(parsed.potentialAnnualSavings),

    // Summary
    overallHealth:      validateHealth(parsed.overallHealth),
    notes:              str(parsed.notes),
  };

  // Server-side red flag validation (don't rely solely on AI)
  const serverFlags = generateRedFlags(result);
  // Merge AI-detected flags with server-validated flags (deduplicated)
  const allFlags = [...new Set([...result.redFlags, ...serverFlags])];
  result.redFlags = allFlags;

  // Recalculate health based on final flag count
  result.overallHealth = calculateHealth(allFlags.length);

  // Recalculate savings if AI missed it but we have totalFees
  if (result.potentialMonthlySavings === 0 && result.totalFees > 0) {
    result.potentialMonthlySavings = Math.round(result.totalFees * 0.85 * 100) / 100;
    result.potentialAnnualSavings = Math.round(result.potentialMonthlySavings * 12 * 100) / 100;
  }

  return jsonResponse(result);
}

// ============================================================
// SERVER-SIDE RED FLAG DETECTION
// Catches issues even if the AI misses them in its response
// Thresholds from the Top 10 Statement Check PDF
// ============================================================
function generateRedFlags(data) {
  const flags = [];

  if (data.effectiveRate > 3.5) {
    flags.push(`Effective rate is ${data.effectiveRate}% — over the 3.5% red flag threshold`);
  }
  if (data.monthlyFees > 25) {
    flags.push(`Monthly fixed fees are $${data.monthlyFees} — over the $25 normal range`);
  }
  if (data.pciNonComplianceFee > 0) {
    flags.push(`PCI non-compliance fee of $${data.pciNonComplianceFee} detected — fix compliance status immediately`);
  }
  if (data.pciFee > 12) {
    flags.push(`PCI fee is $${data.pciFee}/mo ($${(data.pciFee * 12).toFixed(0)}/yr) — normal is $79-$129/year`);
  }
  if (data.equipmentFee > 30) {
    flags.push(`Equipment/terminal fee is $${data.equipmentFee}/mo — consider buying equipment outright`);
  }
  if (data.batchFee > 0.50) {
    flags.push(`Batch fee is $${data.batchFee} — over $0.50 is above normal`);
  }
  if (data.perTransactionFee > 0.25) {
    flags.push(`Per-transaction fee is $${data.perTransactionFee} — over $0.25 is above normal`);
  }
  if (data.chargebackFee > 35) {
    flags.push(`Chargeback fee is $${data.chargebackFee} — over $35 is above normal`);
  }
  if (data.earlyTerminationFee > 500) {
    flags.push(`Early termination fee is $${data.earlyTerminationFee} — over $500 is a red flag`);
  }
  if (data.pricingModel === "tiered") {
    flags.push(`Tiered pricing detected — this model is opaque and typically more expensive than interchange-plus`);
  }
  if (data.junkFees && data.junkFees.length > 0) {
    const names = data.junkFees.map(f => f.name || f).join(", ");
    flags.push(`Junk/suspicious fees found: ${names}`);
  }

  return flags;
}

function calculateHealth(flagCount) {
  if (flagCount === 0) return "good";
  if (flagCount <= 2) return "fair";
  if (flagCount <= 4) return "overpaying";
  return "critical";
}

// ============================================================
// UTILITY HELPERS
// ============================================================
function str(val) {
  if (!val || typeof val !== "string") return "";
  return val.trim().replace(/\n/g, " ");
}

function num(val) {
  if (val === null || val === undefined || val === "") return 0;
  const n = typeof val === "string" ? parseFloat(val.replace(/[$,%]/g, "")) : Number(val);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

const VALID_PRICING = ["interchange_plus", "tiered", "flat_rate", "cash_discount", "unknown"];
function validatePricingModel(v) {
  if (!v) return "unknown";
  const lower = v.toLowerCase().replace(/[\s-]/g, "_");
  return VALID_PRICING.includes(lower) ? lower : "unknown";
}

function validateHealth(v) {
  const valid = ["good", "fair", "overpaying", "critical"];
  if (!v) return "unknown";
  return valid.includes(v.toLowerCase()) ? v.toLowerCase() : "unknown";
}

// ============================================================
// RE-EXPORT (these are already defined in your main enrich.js)
// Included here for reference / standalone testing
// ============================================================
// async function runAI(env, systemPrompt, userMessage, maxTokens = 512) { ... }
// function parseJSON(raw) { ... }
// function jsonResponse(data, status = 200, origin = "https://techsavvyhawaii.com") { ... }

export { handleExtractStatement };
