// ============================================================
// renderStatementEmail.js
// Takes the /extract-statement API response + merchant info
// and returns a fully populated HTML email string
// ============================================================

/**
 * @param {Object} data       - Response from /extract-statement endpoint
 * @param {Object} merchant   - Merchant context info
 * @param {string} merchant.ownerName     - e.g. "Mike"
 * @param {string} merchant.businessName  - e.g. "Aloha Grill"
 * @param {string} templateHtml           - The raw HTML email template string
 * @returns {string} Populated HTML email ready to send
 * 
 * USAGE:
 *   const html = renderStatementEmail(apiResponse, {
 *     ownerName: "Mike",
 *     businessName: "Aloha Grill"
 *   }, templateHtml);
 */
function renderStatementEmail(data, merchant, templateHtml) {
  const healthColorMap = {
    good: "#16a34a",
    fair: "#ca8a04",
    overpaying: "#ea580c",
    critical: "#dc2626",
    unknown: "#64748b",
  };

  const healthLabelMap = {
    good: "Looking Good",
    fair: "Fair — Room to Improve",
    overpaying: "Overpaying",
    critical: "Critical — Act Now",
    unknown: "Needs Review",
  };

  const pricingLabelMap = {
    interchange_plus: "Interchange+",
    tiered: "Tiered ⚠️",
    flat_rate: "Flat Rate",
    cash_discount: "Cash Discount",
    unknown: "Unknown",
  };

  const health = data.overallHealth || "unknown";
  const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00");
  const fmtInt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : "0");

  // Build junk fees HTML
  let junkFeesHtml = "";
  if (!data.junkFees || data.junkFees.length === 0) {
    junkFeesHtml = `<tr><td></td><td colspan="2" style="padding:8px 12px;color:#16a34a;font-style:italic;">None found ✓</td><td></td></tr>`;
  } else {
    junkFeesHtml = data.junkFees
      .map((fee) => {
        const name = typeof fee === "string" ? fee : fee.name || "Unknown fee";
        const amount = typeof fee === "object" && fee.amount ? fmt(fee.amount) : "—";
        return `<tr>
          <td></td>
          <td style="padding:6px 12px 6px 24px;color:#ea580c;">↳ ${escapeHtml(name)}</td>
          <td style="padding:6px 12px;text-align:right;color:#ea580c;font-weight:600;">$${amount}</td>
          <td></td>
        </tr>`;
      })
      .join("\n");
  }

  // Build red flags HTML
  let redFlagsHtml = "";
  if (!data.redFlags || data.redFlags.length === 0) {
    redFlagsHtml = `<tr>
      <td style="padding:12px 16px;background:#f0fdf4;border-radius:8px;color:#16a34a;font-size:14px;">
        ✅ No red flags — your statement looks clean!
      </td>
    </tr>`;
  } else {
    redFlagsHtml = data.redFlags
      .map((flag) => {
        return `<tr>
          <td style="padding:8px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="28" style="vertical-align:top;padding-top:2px;color:#dc2626;font-size:16px;">⚠️</td>
                <td style="padding:0 0 0 4px;color:#451a03;font-size:14px;line-height:1.5;">
                  ${escapeHtml(flag)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
      })
      .join("\n");
  }

  // PCI non-compliance row: strip the conditional comments if fee is 0
  let html = templateHtml;
  if (!data.pciNonComplianceFee || data.pciNonComplianceFee === 0) {
    // Remove the entire PCI non-compliance row block
    html = html.replace(
      /<!--\{\{PCI_NONCOMPLIANCE_ROW_START\}\}-->[\s\S]*?<!--\{\{PCI_NONCOMPLIANCE_ROW_END\}\}-->/,
      ""
    );
  } else {
    // Keep the row, just strip the comment markers
    html = html.replace("<!--{{PCI_NONCOMPLIANCE_ROW_START}}-->", "");
    html = html.replace("<!--{{PCI_NONCOMPLIANCE_ROW_END}}-->", "");
  }

  // Replace all template variables
  const replacements = {
    "{{BUSINESS_NAME}}": escapeHtml(merchant.businessName || data.processorName || "Your Business"),
    "{{OWNER_NAME}}": escapeHtml(merchant.ownerName || "there"),
    "{{PROCESSOR_NAME}}": escapeHtml(data.processorName || "your processor"),
    "{{MONTHLY_VOLUME}}": fmtInt(data.monthlyVolume),
    "{{TOTAL_FEES}}": fmt(data.totalFees),
    "{{EFFECTIVE_RATE}}": (data.effectiveRate || 0).toFixed(2),
    "{{TRANSACTION_COUNT}}": fmtInt(data.transactionCount),
    "{{AVERAGE_TICKET}}": fmt(data.averageTicket),
    "{{INTERCHANGE_FEES}}": fmt(data.interchangeFees),
    "{{PROCESSOR_MARKUP}}": fmt(data.processorMarkup),
    "{{MONTHLY_FEES}}": fmt(data.monthlyFees),
    "{{PCI_FEE}}": fmt(data.pciFee),
    "{{PCI_NONCOMPLIANCE_FEE}}": fmt(data.pciNonComplianceFee),
    "{{EQUIPMENT_FEE}}": fmt(data.equipmentFee),
    "{{BATCH_FEE}}": fmt(data.batchFee),
    "{{PER_TRANSACTION_FEE}}": fmt(data.perTransactionFee),
    "{{CHARGEBACK_FEE}}": fmt(data.chargebackFee),
    "{{ETF}}": fmt(data.earlyTerminationFee),
    "{{PRICING_MODEL}}": pricingLabelMap[data.pricingModel] || "Unknown",
    "{{JUNK_FEES_HTML}}": junkFeesHtml,
    "{{RED_FLAGS_HTML}}": redFlagsHtml,
    "{{RED_FLAG_COUNT}}": String((data.redFlags || []).length),
    "{{OVERALL_HEALTH}}": health,
    "{{HEALTH_COLOR}}": healthColorMap[health] || "#64748b",
    "{{HEALTH_LABEL}}": healthLabelMap[health] || "Needs Review",
    "{{MONTHLY_SAVINGS}}": fmt(data.potentialMonthlySavings),
    "{{ANNUAL_SAVINGS}}": fmt(data.potentialAnnualSavings),
    "{{NOTES}}": escapeHtml(data.notes || "No additional notes."),
    "{{CURRENT_DATE}}": new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  for (const [key, value] of Object.entries(replacements)) {
    // Replace all occurrences (some vars appear multiple times)
    html = html.split(key).join(value);
  }

  return html;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export { renderStatementEmail };
