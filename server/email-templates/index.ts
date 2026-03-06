/**
 * ============================================================
 * Tech Savvy Hawaii — Email Templates
 * ============================================================
 * 
 * All branded email templates for the CRM email system.
 * Each function returns { subject, html, text } ready for sendEmail().
 * 
 * Templates:
 *  1. statementAnalysis    — AI statement review results
 *  2. walkInFollowUp       — After visiting a merchant in person
 *  3. phoneCallFollowUp    — After a phone conversation
 *  4. initialOutreach      — Cold/warm first contact
 *  5. meetingFollowUp      — After a scheduled meeting
 *  6. welcomeToTeam        — New team member / agent onboarding
 *  7. referralFollowUp     — Following up on a referral lead
 *  8. referralContract     — Sending referral partner agreement
 * ============================================================
 */

// ─── Shared Components ──────────────────────────────────────────────

const BRAND = {
  name: "Tech Savvy Hawaii",
  tagline: "Smart Solutions for Local Business",
  phone: "(808) 767-5460",
  email: "contact@techsavvyhawaii.com",
  website: "techsavvyhawaii.com",
  url: "https://techsavvyhawaii.com",
};

function header(title?: string): string {
  return `
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 40px 28px;text-align:center;border-radius:12px 12px 0 0;">
      <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">TECH SAVVY HAWAII</div>
      <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">${title || BRAND.tagline}</div>
    </div>`;
}

function footer(): string {
  return `
    <div style="border-top:1px solid #e2e8f0;padding-top:24px;margin-top:28px;text-align:center;">
      <div style="font-size:14px;font-weight:700;color:#0f172a;">Tech Savvy Hawaii</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
        <a href="${BRAND.url}" style="color:#94a3b8;text-decoration:none;">${BRAND.website}</a>&nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="mailto:${BRAND.email}" style="color:#94a3b8;text-decoration:none;">${BRAND.email}</a>&nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="tel:8087675460" style="color:#94a3b8;text-decoration:none;">${BRAND.phone}</a>
      </div>
      <div style="font-size:11px;color:#cbd5e1;margin-top:12px;">Zero-Fee Payment Processing &bull; No Contracts &bull; No Monthly Fees</div>
    </div>`;
}

function ctaButton(text: string, href: string, color: string = "#0f172a"): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${href}" style="display:inline-block;background-color:${color};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">${text}</a>
    </div>`;
}

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td>${content}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;color:#334155;line-height:1.6;">${text}</p>`;
}

function bullet(items: string[]): string {
  return `<ul style="margin:0 0 16px;padding-left:20px;">
    ${items.map(i => `<li style="font-size:15px;color:#334155;line-height:1.8;margin-bottom:4px;">${i}</li>`).join("\n    ")}
  </ul>`;
}

function highlight(label: string, value: string, color: string = "#059669"): string {
  return `
    <div style="background:#f8fafc;border-left:4px solid ${color};border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px;">${label}</div>
      <div style="font-size:20px;font-weight:800;color:#0f172a;">${value}</div>
    </div>`;
}

const body = (inner: string) => `<div style="padding:32px 40px 8px;">${inner}</div><div style="padding:0 40px 32px;">${footer()}</div>`;


// ============================================================
// 1. STATEMENT ANALYSIS EMAIL
// ============================================================

interface StatementAnalysisData {
  ownerName: string;
  businessName: string;
  processorName: string;
  effectiveRate: string;
  totalFees: string;
  monthlyVolume: string;
  redFlagCount: number;
  overallGrade: string;
  hiddenFees: Array<{ name: string; amount: string; severity: string; explanation: string }>;
  redFlags: string[];
  junkFees: Array<{ name: string; amount: string; why: string }>;
  recommendations: string[];
  estimatedOverpay: string;
  potentialAnnualSavings: string;
}

export function statementAnalysisEmail(data: StatementAnalysisData) {
  const firstName = data.ownerName?.split(" ")[0] || "there";
  const gradeColors: Record<string, string> = { A: "#16a34a", B: "#65a30d", C: "#ca8a04", D: "#ea580c", F: "#dc2626" };
  const gradeColor = gradeColors[data.overallGrade] || "#64748b";

  const hiddenFeesHtml = data.hiddenFees.length > 0
    ? data.hiddenFees.map(f => {
      const sevColor = f.severity === "high" ? "#dc2626" : f.severity === "medium" ? "#ea580c" : "#ca8a04";
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-weight:600;">${f.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:${sevColor};">${f.amount}</td>
      </tr>
      <tr><td colspan="2" style="padding:2px 12px 10px;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">${f.explanation}</td></tr>`;
    }).join("\n")
    : `<tr><td colspan="2" style="padding:12px;color:#16a34a;">✅ No hidden fees found</td></tr>`;

  const redFlagsHtml = data.redFlags.length > 0
    ? data.redFlags.map(f => `<div style="padding:6px 0;font-size:14px;color:#991b1b;">⚠️ ${f}</div>`).join("\n")
    : `<div style="padding:12px 16px;background:#f0fdf4;border-radius:8px;color:#16a34a;">✅ No red flags — your statement looks clean!</div>`;

  const junkFeesHtml = data.junkFees.length > 0
    ? data.junkFees.map(f => `<div style="padding:6px 0;font-size:14px;color:#ea580c;">💰 <strong>${f.name}</strong> (${f.amount}) — ${f.why}</div>`).join("\n")
    : `<div style="color:#16a34a;font-size:14px;">✅ No junk fees detected</div>`;

  const recsHtml = data.recommendations.map(r => `<li style="font-size:14px;color:#334155;line-height:1.8;">${r}</li>`).join("\n");

  const subject = `Your Statement Analysis is Ready — Grade: ${data.overallGrade} | ${data.businessName}`;

  const html = wrap(`
    ${header("Statement Analysis Results")}
    ${body(`
      ${p(`Hi ${firstName},`)}
      ${p(`Thanks for trusting us with your statement review. We've analyzed your <strong>${data.processorName}</strong> statement for <strong>${data.businessName}</strong> — here's the full breakdown.`)}

      <div style="background-color:${gradeColor};border-radius:10px;padding:20px 24px;text-align:center;margin:20px 0;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.85);">Overall Grade</div>
        <div style="font-size:48px;font-weight:800;color:#ffffff;">${data.overallGrade}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.9);">${data.redFlagCount} red flag(s) &bull; ${data.hiddenFees.length} hidden fee(s)</div>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr>
          <td width="33%" style="text-align:center;padding:8px;">
            <div style="background:#f8fafc;border-radius:8px;padding:16px 8px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Volume</div>
              <div style="font-size:20px;font-weight:800;color:#0f172a;">${data.monthlyVolume}</div>
            </div>
          </td>
          <td width="33%" style="text-align:center;padding:8px;">
            <div style="background:#f8fafc;border-radius:8px;padding:16px 8px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Total Fees</div>
              <div style="font-size:20px;font-weight:800;color:#dc2626;">${data.totalFees}</div>
            </div>
          </td>
          <td width="33%" style="text-align:center;padding:8px;">
            <div style="background:#f8fafc;border-radius:8px;padding:16px 8px;">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Eff. Rate</div>
              <div style="font-size:20px;font-weight:800;color:${gradeColor};">${data.effectiveRate}</div>
            </div>
          </td>
        </tr>
      </table>

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">🔍 Hidden Fees Found</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;">
        ${hiddenFeesHtml}
      </table>

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">🚩 Red Flags</div>
      ${redFlagsHtml}

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">🗑️ Junk Fees</div>
      ${junkFeesHtml}

      <div style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.8);">Estimated Overpay</div>
        <div style="font-size:36px;font-weight:800;color:#ffffff;">${data.estimatedOverpay}/mo</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px;">Potential annual savings: ${data.potentialAnnualSavings}</div>
      </div>

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">✅ Recommendations</div>
      <ul style="padding-left:20px;margin:0 0 16px;">${recsHtml}</ul>

      ${p(`Ready to stop overpaying? Let's set up a quick call — no obligation, no pressure.`)}
      ${ctaButton("📞  Call (808) 767-5460", "tel:8087675460", "#059669")}
      ${p(`Or reply to this email and we'll get back to you within the hour.`)}
    `)}
  `);

  const text = `Hi ${firstName},\n\nYour statement analysis for ${data.businessName} is ready.\n\nOverall Grade: ${data.overallGrade}\nEffective Rate: ${data.effectiveRate}\nTotal Fees: ${data.totalFees}\nEstimated Overpay: ${data.estimatedOverpay}/mo\n\nRed Flags: ${data.redFlags.join("; ") || "None"}\n\nCall us at (808) 767-5460 or reply to this email.\n\nTech Savvy Hawaii`;

  return { subject, html, text };
}


// ============================================================
// 2. WALK-IN FOLLOW UP
// ============================================================

interface WalkInFollowUpData {
  ownerName: string;
  businessName: string;
  agentName: string;
  vertical?: string;
  notes?: string;
}

export function walkInFollowUpEmail(data: WalkInFollowUpData) {
  const firstName = data.ownerName?.split(" ")[0] || "there";
  const subject = `Great meeting you today — ${data.businessName}`;

  const verticalBenefit: Record<string, string> = {
    restaurant: "Restaurants like yours typically save $800-2,000/month by eliminating processing fees",
    retail: "Retail shops processing daily card payments often save $500-1,500/month",
    salon: "Salons with high transaction volume can save $400-1,200/month on processing",
    auto_repair: "Auto shops with larger ticket sizes often see savings of $600-1,800/month",
    bar: "Bars and nightlife spots with high card volume typically save $700-2,000/month",
    food_truck: "Food trucks processing lots of small transactions can save $300-800/month",
    hotel: "Hotels processing large volumes often save $1,500-5,000/month",
    medical: "Medical practices typically save $500-2,000/month on processing fees",
    fitness: "Fitness businesses with recurring payments save $400-1,200/month",
  };
  const benefit = verticalBenefit[data.vertical || ""] || "Local businesses like yours typically save hundreds to thousands per month";

  const html = wrap(`
    ${header()}
    ${body(`
      ${p(`Hi ${firstName},`)}
      ${p(`It was great stopping by <strong>${data.businessName}</strong> today! I really appreciate you taking a few minutes to chat with me.`)}
      ${p(`As I mentioned, we help local Hawaii businesses eliminate their payment processing fees entirely — no monthly fees, no hidden charges, no contracts.`)}
      ${highlight("Typical Savings", benefit)}
      ${p(`Here's what I'd love to do next:`)}
      ${bullet([
        `<strong>Free statement review</strong> — Send me a recent processing statement and I'll show you exactly what you're paying (the obvious fees AND the hidden ones)`,
        `<strong>No-pressure comparison</strong> — I'll put together a side-by-side so you can see the difference`,
        `<strong>Your call</strong> — If the savings aren't significant, I'll tell you straight up`,
      ])}
      ${data.notes ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0;font-size:14px;color:#78350f;">${data.notes}</div>` : ""}
      ${p(`Just reply to this email with a photo or PDF of your latest statement — that's all I need to get started.`)}
      ${ctaButton("📞  Call Me Anytime: (808) 767-5460", "tel:8087675460")}
      ${p(`Talk soon,<br/><strong>${data.agentName}</strong><br/>Tech Savvy Hawaii`)}
    `)}
  `);

  const text = `Hi ${firstName},\n\nGreat meeting you at ${data.businessName} today! As I mentioned, we help local businesses eliminate processing fees entirely.\n\n${benefit}.\n\nJust reply with a recent processing statement and I'll show you exactly what you're paying and how much you could save.\n\nNo obligation — if the savings aren't significant, I'll tell you straight up.\n\n${data.agentName}\nTech Savvy Hawaii\n(808) 767-5460`;

  return { subject, html, text };
}


// ============================================================
// 3. PHONE CALL FOLLOW UP
// ============================================================

interface PhoneCallFollowUpData {
  ownerName: string;
  businessName: string;
  agentName: string;
  discussed?: string;
  nextStep?: string;
}

export function phoneCallFollowUpEmail(data: PhoneCallFollowUpData) {
  const firstName = data.ownerName?.split(" ")[0] || "there";
  const subject = `Following up on our call — ${data.businessName}`;

  const html = wrap(`
    ${header()}
    ${body(`
      ${p(`Hi ${firstName},`)}
      ${p(`Thanks for taking the time to chat today! I wanted to follow up with the info we discussed.`)}
      ${data.discussed ? `
        <div style="background:#f0f9ff;border-left:4px solid #0284c7;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#0284c7;font-weight:700;margin-bottom:6px;">What We Discussed</div>
          <div style="font-size:14px;color:#0c4a6e;line-height:1.6;">${data.discussed}</div>
        </div>` : ""}
      ${p(`As a quick recap, here's what Tech Savvy Hawaii offers:`)}
      ${bullet([
        `<strong>Zero processing fees</strong> — customers pay a small surcharge, you keep 100%`,
        `<strong>No monthly fees</strong> — no PCI, gateway, statement, or maintenance fees`,
        `<strong>One-time terminal cost ($399)</strong> — you own it, no leasing`,
        `<strong>Free custom website</strong> — included for all processing customers`,
        `<strong>No contracts</strong> — month-to-month, cancel anytime`,
      ])}
      ${data.nextStep ? highlight("Next Step", data.nextStep, "#0284c7") : ""}
      ${p(`The easiest way to see your potential savings is to send me a recent processing statement — just reply to this email with a photo or PDF.`)}
      ${ctaButton("📄  Upload Your Statement", `${BRAND.url}/statement-review`, "#059669")}
      ${p(`Or call me directly anytime:`)}
      ${ctaButton("📞  (808) 767-5460", "tel:8087675460")}
      ${p(`Looking forward to helping ${data.businessName} save money,<br/><strong>${data.agentName}</strong><br/>Tech Savvy Hawaii`)}
    `)}
  `);

  const text = `Hi ${firstName},\n\nThanks for chatting today! Here's a quick recap:\n\nTech Savvy Hawaii offers:\n- Zero processing fees (customers pay a small surcharge)\n- No monthly fees — no PCI, gateway, or statement fees\n- One-time $399 terminal cost — you own it\n- Free custom website included\n- No contracts — cancel anytime\n\n${data.nextStep ? `Next step: ${data.nextStep}\n\n` : ""}Send me a recent statement and I'll show you exactly how much you'd save.\n\n${data.agentName}\nTech Savvy Hawaii\n(808) 767-5460`;

  return { subject, html, text };
}


// ============================================================
// 4. INITIAL OUTREACH
// ============================================================

interface InitialOutreachData {
  ownerName: string;
  businessName: string;
  agentName: string;
  vertical?: string;
  currentProcessor?: string;
  monthlyVolume?: string;
  personalNote?: string;
}

export function initialOutreachEmail(data: InitialOutreachData) {
  const firstName = data.ownerName?.split(" ")[0] || "there";
  const processor = data.currentProcessor || "your current processor";
  const subject = `Quick question about ${data.businessName}'s processing fees`;

  const verticalHook: Record<string, string> = {
    restaurant: "I work with several restaurants in Hawaii and they're typically overpaying $800-2,000/month in hidden processing fees",
    retail: "I work with local retail shops and they're usually paying 30-50% more than they should in processing fees",
    salon: "I work with salons across the islands and most are paying way too much in per-transaction fees",
    auto_repair: "I work with auto shops in Hawaii and with your average ticket size, the savings on processing fees can be significant",
    bar: "I work with bars and restaurants in Hawaii — with your card volume, hidden fees really add up",
    food_truck: "I work with food trucks across Oahu and the processing fees on small transactions really eat into margins",
  };
  const hook = verticalHook[data.vertical || ""] || "I work with local businesses in Hawaii and most are overpaying on processing fees without realizing it";

  const html = wrap(`
    ${header()}
    ${body(`
      ${p(`Hi ${firstName},`)}
      ${data.personalNote ? p(data.personalNote) : ""}
      ${p(`${hook}.`)}
      ${p(`I'm reaching out because I'd love to take a quick look at ${data.businessName}'s processing statement. Most merchants I talk to are surprised by what they find — hidden fees, inflated rates, and junk charges that processors bury in the fine print.`)}
      ${highlight("What We Offer", "Zero processing fees — customers pay a small surcharge, you keep 100% of every sale")}
      ${p(`Here's the deal:`)}
      ${bullet([
        `<strong>Free statement analysis</strong> — I'll show you exactly what you're paying`,
        `<strong>No obligation</strong> — if I can't save you money, I'll tell you`,
        `<strong>5 minutes of your time</strong> — just send me a recent statement`,
      ])}
      ${data.monthlyVolume ? `<div style="font-size:14px;color:#64748b;margin-bottom:16px;">Based on ~${data.monthlyVolume}/month in processing, you could be saving <strong style="color:#059669;">$${Math.round(parseInt(data.monthlyVolume.replace(/\D/g, "")) * 0.025)}-${Math.round(parseInt(data.monthlyVolume.replace(/\D/g, "")) * 0.035)}/month</strong>.</div>` : ""}
      ${p(`Would you be open to a quick look? Just reply with a photo of your latest statement — takes 30 seconds.`)}
      ${ctaButton("📄  Get Your Free Analysis", `${BRAND.url}/statement-review`, "#059669")}
      ${p(`${data.agentName}<br/>Tech Savvy Hawaii<br/><span style="color:#64748b;font-size:14px;">Zero-Fee Payment Processing for Hawaii Businesses</span>`)}
    `)}
  `);

  const text = `Hi ${firstName},\n\n${hook}.\n\nI'd love to take a quick look at ${data.businessName}'s processing statement. Most merchants are surprised by the hidden fees they find.\n\nWhat we offer: Zero processing fees — customers pay a small surcharge, you keep 100%.\n\nWould you be open to a quick look? Just reply with a photo of your latest statement.\n\n${data.agentName}\nTech Savvy Hawaii\n(808) 767-5460`;

  return { subject, html, text };
}


// ============================================================
// 5. MEETING FOLLOW UP
// ============================================================

interface MeetingFollowUpData {
  ownerName: string;
  businessName: string;
  agentName: string;
  meetingDate: string;
  discussed?: string;
  actionItems?: string[];
  savingsEstimate?: string;
  nextMeeting?: string;
}

export function meetingFollowUpEmail(data: MeetingFollowUpData) {
  const firstName = data.ownerName?.split(" ")[0] || "there";
  const subject = `Recap: Our meeting about ${data.businessName}'s processing`;

  const actionItemsHtml = data.actionItems && data.actionItems.length > 0
    ? `<div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#059669;font-weight:700;margin-bottom:10px;">✅ Action Items</div>
        ${data.actionItems.map((item, i) => `<div style="padding:6px 0;font-size:14px;color:#065f46;"><strong>${i + 1}.</strong> ${item}</div>`).join("\n")}
       </div>`
    : "";

  const html = wrap(`
    ${header()}
    ${body(`
      ${p(`Hi ${firstName},`)}
      ${p(`Thank you for sitting down with me${data.meetingDate ? ` on ${data.meetingDate}` : ""}. I really enjoyed learning more about <strong>${data.businessName}</strong> and discussing how we can help you save on processing.`)}
      ${data.discussed ? `
        <div style="background:#f0f9ff;border-left:4px solid #0284c7;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#0284c7;font-weight:700;margin-bottom:6px;">Meeting Summary</div>
          <div style="font-size:14px;color:#0c4a6e;line-height:1.6;">${data.discussed}</div>
        </div>` : ""}
      ${data.savingsEstimate ? highlight("Estimated Monthly Savings", data.savingsEstimate, "#059669") : ""}
      ${actionItemsHtml}
      ${data.nextMeeting ? `
        <div style="background:#faf5ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;font-weight:700;margin-bottom:6px;">📅 Next Meeting</div>
          <div style="font-size:16px;font-weight:700;color:#4c1d95;">${data.nextMeeting}</div>
        </div>` : ""}
      ${p(`If you have any questions before then, don't hesitate to reach out. I'm here to make this as easy as possible for you.`)}
      ${ctaButton("📞  Call Me Anytime", "tel:8087675460")}
      ${p(`Best,<br/><strong>${data.agentName}</strong><br/>Tech Savvy Hawaii`)}
    `)}
  `);

  const text = `Hi ${firstName},\n\nThank you for meeting with me${data.meetingDate ? ` on ${data.meetingDate}` : ""}. I enjoyed learning about ${data.businessName}.\n\n${data.discussed ? `Summary: ${data.discussed}\n\n` : ""}${data.savingsEstimate ? `Estimated savings: ${data.savingsEstimate}/month\n\n` : ""}${data.actionItems ? `Action items:\n${data.actionItems.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n` : ""}Questions? Call me anytime at (808) 767-5460.\n\n${data.agentName}\nTech Savvy Hawaii`;

  return { subject, html, text };
}


// ============================================================
// 6. WELCOME TO THE TEAM
// ============================================================

interface WelcomeToTeamData {
  newMemberName: string;
  role?: string;
  startDate?: string;
  managerName?: string;
  loginUrl?: string;
  trainingUrl?: string;
}

export function welcomeToTeamEmail(data: WelcomeToTeamData) {
  const firstName = data.newMemberName?.split(" ")[0] || "there";
  const subject = `Welcome to Tech Savvy Hawaii, ${firstName}! 🤙`;

  const html = wrap(`
    ${header("Welcome to the Team")}
    ${body(`
      ${p(`Aloha ${firstName}! 🤙`)}
      ${p(`Welcome to <strong>Tech Savvy Hawaii</strong>! We're stoked to have you on the team${data.role ? ` as our new <strong>${data.role}</strong>` : ""}.`)}
      ${data.startDate ? highlight("Start Date", data.startDate, "#7c3aed") : ""}
      ${p(`Here's what you need to know to hit the ground running:`)}

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">🎯 What We Do</div>
      ${p(`We help Hawaii businesses <strong>eliminate payment processing fees</strong> with our zero-fee program. Customers pay a small surcharge (like gas stations), and the merchant keeps 100% of every sale. No monthly fees, no contracts, no hidden charges.`)}

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">📦 Your Toolkit</div>
      ${bullet([
        `<strong>CashSwipe Classroom</strong> — our AI-powered training platform with quizzes, roleplay, and scripts`,
        `<strong>Statement Analyzer</strong> — AI tool that reads merchant statements and finds hidden fees`,
        `<strong>CRM Dashboard</strong> — track your leads, pipeline, and commissions`,
        `<strong>Pitch Generator</strong> — AI-written scripts customized per business type`,
        `<strong>Objection Handler</strong> — instant rebuttals for common pushback`,
      ])}

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">🚀 Your First Week</div>
      ${bullet([
        `<strong>Day 1:</strong> Complete CashSwipe Classroom training modules`,
        `<strong>Day 2:</strong> Shadow an experienced agent on walk-ins`,
        `<strong>Day 3:</strong> Practice pitches with the AI roleplay tool`,
        `<strong>Day 4:</strong> Your first solo walk-ins (with support)`,
        `<strong>Day 5:</strong> Review and set your first month's goals`,
      ])}

      ${data.loginUrl ? ctaButton("🔐  Access Your Dashboard", data.loginUrl, "#0f172a") : ""}
      ${data.trainingUrl ? ctaButton("📚  Start Training", data.trainingUrl, "#059669") : ""}

      ${p(`Questions? Your ${data.managerName ? `manager <strong>${data.managerName}</strong>` : "manager"} is your go-to, and you can always reach the team at ${BRAND.phone}.`)}
      ${p(`Let's go make a difference for Hawaii businesses! 🌺`)}
      ${p(`— The Tech Savvy Hawaii Team`)}
    `)}
  `);

  const text = `Aloha ${firstName}!\n\nWelcome to Tech Savvy Hawaii!${data.role ? ` You're joining us as ${data.role}.` : ""}\n\nWhat we do: Help Hawaii businesses eliminate processing fees with our zero-fee program.\n\nYour first week:\n- Day 1: Complete CashSwipe Classroom training\n- Day 2: Shadow an experienced agent\n- Day 3: Practice with AI roleplay\n- Day 4: First solo walk-ins\n- Day 5: Review and set goals\n\nQuestions? Call (808) 767-5460.\n\n— The Tech Savvy Hawaii Team`;

  return { subject, html, text };
}


// ============================================================
// 7. REFERRAL FOLLOW UP
// ============================================================

interface ReferralFollowUpData {
  ownerName: string;
  businessName: string;
  agentName: string;
  referrerName: string;
  referrerBusiness?: string;
  vertical?: string;
}

export function referralFollowUpEmail(data: ReferralFollowUpData) {
  const firstName = data.ownerName?.split(" ")[0] || "there";
  const subject = `${data.referrerName} suggested I reach out — ${data.businessName}`;

  const html = wrap(`
    ${header()}
    ${body(`
      ${p(`Hi ${firstName},`)}
      ${p(`<strong>${data.referrerName}</strong>${data.referrerBusiness ? ` from <strong>${data.referrerBusiness}</strong>` : ""} suggested I reach out to you. They thought you'd be interested in seeing how much you could save on payment processing.`)}
      ${highlight("Why They Referred You", `${data.referrerName} is saving hundreds per month with our zero-fee program and thought ${data.businessName} could benefit too`)}
      ${p(`Here's the short version of what we do:`)}
      ${bullet([
        `<strong>Zero processing fees</strong> — customers pay a small surcharge, you keep 100%`,
        `<strong>No monthly fees</strong> — no PCI, gateway, statement, or hidden charges`,
        `<strong>No contracts</strong> — month-to-month, cancel anytime`,
        `<strong>One-time terminal ($399)</strong> — you own it, no leasing`,
        `<strong>Free custom website</strong> — included for all processing customers`,
      ])}
      ${p(`I'd love to take a quick look at your current processing statement — it takes about 5 minutes and I'll show you exactly what you're paying and what you could save. Completely free, no obligation.`)}
      ${ctaButton("📄  Get Your Free Analysis", `${BRAND.url}/statement-review`, "#059669")}
      ${p(`Or just reply to this email with a photo of your latest statement — that's all I need.`)}
      ${ctaButton("📞  Call Me: (808) 767-5460", "tel:8087675460")}
      ${p(`Looking forward to connecting,<br/><strong>${data.agentName}</strong><br/>Tech Savvy Hawaii`)}
    `)}
  `);

  const text = `Hi ${firstName},\n\n${data.referrerName}${data.referrerBusiness ? ` from ${data.referrerBusiness}` : ""} suggested I reach out. They're saving hundreds per month with our zero-fee processing program and thought ${data.businessName} could benefit too.\n\nWe offer:\n- Zero processing fees\n- No monthly fees, no contracts\n- One-time $399 terminal cost\n- Free custom website\n\nI'd love to take a quick look at your current statement. Just reply with a photo — takes 30 seconds.\n\n${data.agentName}\nTech Savvy Hawaii\n(808) 767-5460`;

  return { subject, html, text };
}


// ============================================================
// 8. REFERRAL CONTRACT / PARTNER AGREEMENT
// ============================================================

interface ReferralContractData {
  partnerName: string;
  partnerBusiness?: string;
  agentName: string;
  commissionRate?: string;
  agreementUrl?: string;
}

export function referralContractEmail(data: ReferralContractData) {
  const firstName = data.partnerName?.split(" ")[0] || "there";
  const commission = data.commissionRate || "$50 per signed merchant";
  const subject = `Your Referral Partner Agreement — Tech Savvy Hawaii`;

  const html = wrap(`
    ${header("Referral Partner Program")}
    ${body(`
      ${p(`Hi ${firstName},`)}
      ${p(`Thank you for your interest in becoming a <strong>Tech Savvy Hawaii Referral Partner</strong>! We're excited to work with you${data.partnerBusiness ? ` and <strong>${data.partnerBusiness}</strong>` : ""}.`)}
      ${p(`Below are the details of our referral program, and your partner agreement is attached.`)}

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">💰 How It Works</div>
      ${bullet([
        `<strong>Refer a business</strong> — share our info with any business you think could benefit`,
        `<strong>We handle the rest</strong> — we do the statement review, setup, and installation`,
        `<strong>You get paid</strong> — earn a commission for every merchant that signs up`,
      ])}

      ${highlight("Your Commission", commission, "#7c3aed")}

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">📋 Commission Tiers</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;margin-bottom:16px;">
        <tr style="background:#f8fafc;">
          <td style="padding:12px;font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Referrals</td>
          <td style="padding:12px;font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Per Merchant</td>
          <td style="padding:12px;font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">Bonus</td>
        </tr>
        <tr>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#0f172a;">1–5 merchants</td>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#059669;font-weight:700;">$50</td>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#64748b;">—</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#0f172a;">6–15 merchants</td>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#059669;font-weight:700;">$75</td>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#7c3aed;font-weight:600;">$100 bonus at 10</td>
        </tr>
        <tr>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#0f172a;">16+ merchants</td>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#059669;font-weight:700;">$100</td>
          <td style="padding:12px;border-bottom:1px solid #f1f5f9;color:#7c3aed;font-weight:600;">$250 bonus at 20</td>
        </tr>
      </table>

      <div style="font-size:17px;font-weight:700;color:#0f172a;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">📝 Next Steps</div>
      ${bullet([
        `<strong>Review</strong> the attached partner agreement`,
        `<strong>Sign</strong> and return it (reply to this email or use the link below)`,
        `<strong>Start referring</strong> — we'll set you up with your partner dashboard`,
      ])}

      ${data.agreementUrl ? ctaButton("📝  Review & Sign Agreement", data.agreementUrl, "#7c3aed") : ""}
      ${p(`If you have any questions about the program, I'm happy to jump on a quick call.`)}
      ${ctaButton("📞  Call (808) 767-5460", "tel:8087675460")}
      ${p(`Excited to partner with you!<br/><strong>${data.agentName}</strong><br/>Tech Savvy Hawaii — Referral Partner Program`)}
    `)}
  `);

  const text = `Hi ${firstName},\n\nThanks for your interest in becoming a Tech Savvy Hawaii Referral Partner!\n\nHow it works:\n- Refer a business to us\n- We handle the statement review, setup, and installation\n- You earn ${commission} for every merchant that signs up\n\nCommission tiers:\n- 1-5 merchants: $50 each\n- 6-15 merchants: $75 each + $100 bonus at 10\n- 16+ merchants: $100 each + $250 bonus at 20\n\nNext steps:\n1. Review the attached partner agreement\n2. Sign and return it\n3. Start referring!\n\nQuestions? Call (808) 767-5460.\n\n${data.agentName}\nTech Savvy Hawaii`;

  return { subject, html, text };
}
