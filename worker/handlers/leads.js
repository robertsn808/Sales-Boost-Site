/**
 * Lead enrichment & statement extraction handlers
 */
import { runAI, parseJSON, jsonResponse, s, validateVertical } from "../helpers.js";

export async function handleEnrich(body, env) {
  const { text } = body;
  if (!text || text.length < 5) {
    return jsonResponse({ error: "Missing or too short 'text' field" }, 400);
  }

  const prompt = `You are a lead extraction assistant for a merchant services company (Tech Savvy Hawaii).
Given raw text scraped from a business website or typed as field notes, extract the following fields.
Return ONLY valid JSON — no markdown, no explanation, no backticks.

Fields to extract:
- phone: business phone number (string, empty if not found)
- email: business email address (string, empty if not found)
- address: full street address (string, empty if not found)
- vertical: business type — one of: restaurant, retail, salon, auto_repair, food_truck, bar, hotel, medical, fitness, other
- ownerName: owner or manager name if mentioned (string, empty if not found)
- businessName: business name (string, empty if not found)
- notes: 1-2 sentence summary of what the business does (string)`;

  const raw = await runAI(env, prompt, text.slice(0, 4000));
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({
      error: "Failed to parse AI response",
      raw: raw.slice(0, 500),
      phone: "", email: "", address: "", vertical: "other",
      ownerName: "", businessName: "", notes: "",
    });
  }

  return jsonResponse({
    phone: s(parsed.phone),
    email: s(parsed.email).toLowerCase(),
    address: s(parsed.address),
    vertical: validateVertical(parsed.vertical),
    ownerName: s(parsed.ownerName),
    businessName: s(parsed.businessName),
    notes: s(parsed.notes),
  });
}

export async function handleExtractStatement(body, env) {
  const { text } = body;
  if (!text || text.length < 20) {
    return jsonResponse({ error: "Missing or too short 'text' field" }, 400);
  }

  const prompt = `You are a merchant statement analyst for Tech Savvy Hawaii, a zero-fee payment processing company.
Parse this merchant processing statement text and extract key financial data.

Extract these fields (use 0, empty string, or empty array if not found):

CORE METRICS:
- processorName: who processes their cards (string)
- monthlyVolume: total monthly processing volume in dollars (number)
- totalFees: total monthly fees charged (number)
- effectiveRate: total fees / total volume as percentage (number, e.g. 3.2)
- transactionCount: number of transactions (number)
- averageTicket: average transaction size (number)

FEE BREAKDOWN:
- interchangeFees: interchange/wholesale fees (number)
- processorMarkup: processor's markup above interchange (number)
- monthlyFees: sum of fixed monthly fees — statement fee, gateway fee, etc. (number)
- pciFee: PCI compliance fee, monthly or annual (number). Note if annual vs monthly in notes.
- pciNonComplianceFee: PCI non-compliance penalty fee (number). This is a major red flag — merchants often don't know they're paying it.
- equipmentFee: terminal lease, gateway, or equipment rental fee (number)
- batchFee: per-batch/settlement fee, often $0.10–$0.30 per batch (number)
- perTransactionFee: per-swipe or per-authorization fee amount (number, e.g. 0.10)
- chargebackFee: per-chargeback fee (number, commonly $15–$35)

CARD BREAKDOWN:
- cardBreakdown: object with visa, mastercard, amex, discover volumes if found

CONTRACT:
- contractEndDate: end date of current contract if mentioned (string)
- earlyTerminationFee: ETF amount if mentioned (number)

RED FLAGS & JUNK FEES:
- junkFees: array of objects for unrecognizable, made-up, or inflated fees. Each: { "name": "fee name", "amount": dollar amount (number), "why": "why this is suspicious" }
  Examples of junk fees: "regulatory compliance fee", "network access fee", "FANF fee passed to merchant", "annual fee", "account maintenance fee", "IRS reporting fee", "rate guarantee fee", inflated statement fees above $10, any fee that can't be traced to interchange or card brand requirements.
- redFlags: array of strings describing red flags detected. Check for:
  * Effective rate above 3.5% (most retail/restaurant should be 2.2–2.8%)
  * PCI non-compliance fee present (means they haven't helped merchant get compliant)
  * Equipment lease (almost always overpriced vs buying outright)
  * Per-transaction fee above $0.15
  * Batch fee above $0.30
  * Chargeback fee above $25
  * Any tiered pricing model (qualified/mid-qualified/non-qualified rates)
  * Monthly minimum fee being charged
  * Annual fee or "rate review" fee
  * More than 3 unrecognizable line items

SAVINGS ESTIMATE:
- potentialSavings: estimated monthly savings if switched to zero-fee cash discount program (number, estimate as totalFees * 0.85 since they'd eliminate nearly all fees)
- annualSavings: potentialSavings * 12 (number)
- notes: any other important observations (string)

Return ONLY valid JSON.`;

  const raw = await runAI(env, prompt, text.slice(0, 6000), 1536);
  const parsed = parseJSON(raw);

  if (!parsed) {
    return jsonResponse({ error: "Failed to parse", raw: raw.slice(0, 500) });
  }

  return jsonResponse(parsed);
}
