import type { PipelineStage, LeadSource, Vertical, PackageType, MaintenancePlan, RevenueEntry, DealStage, UserRole } from "./types";

// ─── Pipeline ────────────────────────────────────────────────────────

export const PIPELINE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string; short: string }> = {
  new:                  { label: "New Lead", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", short: "New" },
  contacted:            { label: "Contacted", color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", short: "Contacted" },
  qualified:            { label: "Qualified", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20", short: "Qualified" },
  "statement-requested":{ label: "Stmt Requested", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", short: "Stmt Req" },
  "statement-received": { label: "Stmt Received", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", short: "Stmt Recv" },
  "analysis-delivered": { label: "Analysis Sent", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", short: "Analysis" },
  "proposal-sent":      { label: "Proposal Sent", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", short: "Proposal" },
  negotiation:          { label: "Negotiation", color: "text-pink-400", bg: "bg-pink-400/10 border-pink-400/20", short: "Negotiation" },
  won:                  { label: "Won", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", short: "Won" },
  lost:                 { label: "Lost", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", short: "Lost" },
  nurture:              { label: "Nurture", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20", short: "Nurture" },
};

export const SOURCE_CONFIG: Record<LeadSource, { label: string; color: string; icon: string }> = {
  referral:     { label: "Referral Partner", color: "text-emerald-400", icon: "R" },
  networking:   { label: "Networking", color: "text-blue-400", icon: "N" },
  social:       { label: "Social Outreach", color: "text-pink-400", icon: "S" },
  direct:       { label: "Direct Prospecting", color: "text-orange-400", icon: "D" },
  "lead-magnet":{ label: "Lead Magnet", color: "text-purple-400", icon: "L" },
};

export const VERTICAL_CONFIG: Record<Vertical, string> = {
  restaurant: "Restaurant/Food", retail: "Retail", salon: "Salon/Beauty", auto: "Auto/Repair",
  medical: "Medical/Dental", cbd: "CBD/Hemp", vape: "Vape/Smoke", firearms: "Firearms",
  ecommerce: "E-Commerce", services: "Professional Services", other: "Other",
};

export const PACKAGE_CONFIG: Record<PackageType, { label: string; color: string }> = {
  terminal: { label: "Terminal ($399)", color: "text-primary" },
  trial: { label: "30-Day Trial", color: "text-chart-4" },
  online: { label: "Online (Free)", color: "text-chart-2" },
};

export const MAINTENANCE_CONFIG: Record<MaintenancePlan, { label: string; price: string }> = {
  none: { label: "None / Self-Hosted", price: "$0" },
  basic: { label: "Basic", price: "$50/mo" },
  pro: { label: "Pro", price: "$199/mo" },
  premium: { label: "Premium", price: "$399/mo" },
};

export const REVENUE_TYPES: Record<RevenueEntry["type"], string> = {
  "terminal-sale": "Terminal Sale", "trial-convert": "Trial Conversion",
  "maintenance": "Maintenance Plan", "one-off-update": "One-Off Update",
  "website-addon": "Website Add-On", "other": "Other",
};

export const MODELS = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Latest)" },
  { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Fast)" },
];

export const CONTACT_METHODS: Record<string, string> = {
  phone: "Phone Call", email: "Email", text: "Text/SMS", "in-person": "In-Person",
};

export const ACTIVITY_COLORS: Record<string, string> = {
  lead: "bg-blue-400", client: "bg-emerald-400", revenue: "bg-purple-400",
  task: "bg-yellow-400", file: "bg-orange-400", integration: "bg-pink-400", auth: "bg-gray-400",
  deal: "bg-indigo-400",
};

export const MATERIAL_CATEGORIES: Record<string, { label: string; icon: string }> = {
  sales: { label: "Sales & Outreach Assets", icon: "S" },
  "lead-gen": { label: "Lead Generation Assets", icon: "L" },
  partner: { label: "Partner Program Assets", icon: "P" },
  tracking: { label: "Tracking & Ops Assets", icon: "T" },
};

export const PLAYBOOK_SCRIPTS = {
  referral: {
    outreach: `I work with local businesses to lower processing costs and upgrade payment reliability. You already advise businesses on operations/financials — if you have clients complaining about fees or equipment, I can do a no-obligation statement review. If it helps, I'll pay a referral fee and track everything cleanly.`,
  },
  networking: {
    elevator: `I help local businesses stop bleeding money on hidden processing fees and outdated equipment. If you bring me a recent statement, I'll highlight what's actually being charged and what could be improved — no obligation.`,
  },
  social: {
    dm: `Appreciate you checking that post. If you want, I can do a quick statement check and tell you where the extra fees usually hide. It's a simple yes/no: either it's already solid, or there's money on the table.`,
    linkedinAfterEngage: `Hey {Name} — appreciate you checking out that post.\n\nIf you want, I can do a quick statement check and tell you where the extra fees usually hide. It's a simple yes/no: either it's already solid, or there's money on the table.\n\nInterested?`,
    linkedinAfterConnect: `Hey {Name} — thanks for connecting.\n\nI saw you're running {Business}. I help local businesses cut processing costs — usually 15-30% once we find the hidden fees.\n\nIf you ever want a free statement review, let me know. No pitch, just a markup of what you're actually paying.`,
    instagramAfterEngage: `Hey! Thanks for the love on that post.\n\nIf you're a business owner and want me to check your processing statement, I'm happy to do it free. Most people find 3-5 fees they didn't know they were paying.\n\nJust send me a pic of a recent statement and I'll mark it up for you.`,
    instagramAfterFollow: `Hey {Name} — thanks for the follow!\n\nI post a lot about payment processing and hidden fees. If you ever want a free statement review for your business, just DM me. I'll tell you straight up if there's savings or not.`,
    facebookGroupEngage: `Hey {Name} — saw your comment in {Group}.\n\nI help local businesses with processing fees — if you ever want a free statement check, I'm happy to look. Most owners are surprised by what's actually being charged once we break it down.\n\nNo pressure, just let me know if you're curious.`,
  },
  direct: {
    coldCall: `Hi — I'm local and I help businesses reduce processing costs and fix the usual problems like hidden fees or outdated terminals. I'm not calling to sell you on the spot — I'm offering a no-obligation statement review. If you've got last month's statement, I'll show you exactly what you're paying and what can be improved.`,
    walkIn: `Hey, I'm in the area helping businesses compare statements — processing fees are all over the place right now. Who handles your merchant account? I can do a quick statement check and show you what's normal vs. what's inflated.`,
    email: `Subject: Quick question about your payment setup

Hi {Name} — I stopped by / noticed {specific observation}. I work with local {vertical} businesses to reduce processing fees and modernize checkout without disruption.

If you send a recent statement, I'll mark up what you're paying (including the sneaky line items) and give you a clear comparison — no obligation.

Best contact for a 10-minute review?`,
  },
  leadMagnet: {
    followUp24hr: `Hey {Name} — saw you grabbed the {Lead Magnet}. If you want, send a recent statement and I'll point out exactly where fees tend to stack up for {their vertical}. No pressure — you'll just know what's real.`,
  },
};

export const OBJECTION_HANDLERS: Record<string, { objection: string; response: string; tip: string }> = {
  satisfied: {
    objection: "We're happy with our current processor",
    response: "I hear that a lot — and that's great if the numbers back it up. Most businesses haven't looked at their statement in months though, and processors change rates constantly. Would you be open to a quick check? If everything looks good, I'll tell you that too.",
    tip: "Don't argue. Reframe it as a free audit, not a switch.",
  },
  locked: {
    objection: "We're locked into a contract",
    response: "That's common. Most contracts have a 30-60 day exit clause, and the early termination fee is usually $200-500. Worth knowing what you'd save — if the savings are $300+/month, the math pays for itself in under 2 months.",
    tip: "Ask when the contract ends. Offer to do the analysis now so they're ready.",
  },
  busy: {
    objection: "Not a good time / too busy right now",
    response: "Totally understand — I'll be quick. Can I leave my card? When would be a better time to reach the owner?",
    tip: "Respect their time. Get a callback time and log it.",
  },
  rates: {
    objection: "What are your rates?",
    response: "I don't like quoting blind rates because they're meaningless without seeing your statement. Your rate depends on your volume, ticket size, and card mix. Show me a statement and I'll give you an exact comparison — apples to apples.",
    tip: "Never quote a rate without seeing their statement. It sets wrong expectations.",
  },
  trust: {
    objection: "I've been burned before / don't trust processors",
    response: "I get it — this industry has a reputation for a reason. That's exactly why I lead with a transparent statement review. You'll see the exact markup, line by line, before any commitment. No hidden fees, no surprises.",
    tip: "Lead with empathy. Show your markup math, not just a pitch.",
  },
  small: {
    objection: "We don't process enough to matter",
    response: "You'd be surprised. Even businesses doing $5K-10K/month are often losing $100-300 to inflated fees. That's $1,200-3,600/year — real money for a small business.",
    tip: "Do the annual math for them. Small monthly leaks look big over 12 months.",
  },
  switched: {
    objection: "We just switched processors",
    response: "Got it. How long ago? Here's the thing — a lot of businesses get a good intro rate, then fees creep up after 3-6 months. I'd be happy to do a review down the road to make sure they're keeping their word.",
    tip: "Plant the seed for a future review. Leave your card.",
  },
  nofees: {
    objection: "I don't pay any fees / my processor doesn't charge me",
    response: "That would be unusual — Visa and Mastercard set a base rate called interchange that every processor pays. If you're not seeing it as a line item, it's likely baked into your pricing elsewhere. Want me to take a quick look?",
    tip: "They might have a cash discount program or the fees are hidden in bundled pricing.",
  },
  cash: {
    objection: "We only take cash",
    response: "That's becoming rare — studies show 80%+ of consumers prefer card or tap. You might be losing walk-in revenue. A terminal with a cash discount program means you'd pay zero fees and still capture card customers.",
    tip: "Frame it as revenue they're leaving on the table, not a cost.",
  },
  family: {
    objection: "My family member / friend handles our processing",
    response: "Totally respect that. A second opinion never hurts though — I've found that even well-meaning setups can have rate creep or unnecessary fees. I'm happy to do a confidential review if they'd like a benchmark.",
    tip: "Don't compete with the relationship. Position it as a helpful benchmark.",
  },
};

// ─── Deal Pipeline ───────────────────────────────────────────────────

export const DEAL_STAGE_CONFIG: Record<DealStage, { label: string; color: string; bg: string; probability: number }> = {
  prospecting:   { label: "Prospecting", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", probability: 10 },
  qualification: { label: "Qualification", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20", probability: 25 },
  proposal:      { label: "Proposal", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", probability: 50 },
  negotiation:   { label: "Negotiation", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", probability: 75 },
  "closed-won":  { label: "Closed Won", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", probability: 100 },
  "closed-lost": { label: "Closed Lost", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", probability: 0 },
};

export const DEAL_STAGES: DealStage[] = ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"];

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; color: string; permissions: string[] }> = {
  admin:      { label: "Admin", color: "text-red-400", permissions: ["all"] },
  manager:    { label: "Manager", color: "text-purple-400", permissions: ["read", "write", "assign", "reports"] },
  "sales-rep":{ label: "Sales Rep", color: "text-blue-400", permissions: ["read", "write-own"] },
  viewer:     { label: "Viewer", color: "text-gray-400", permissions: ["read"] },
};

export const GOOGLE_DORK_PRESETS = [
  { label: "Restaurants using Square", query: 'site:squareup.com/us/en/restaurant inurl:"{location}"' },
  { label: "Businesses on Yelp", query: 'site:yelp.com "{location}" "payment" OR "credit card"' },
  { label: "Clover merchants", query: 'site:clover.com "{location}" merchant' },
  { label: "Toast restaurants", query: 'site:toasttab.com "{location}"' },
  { label: "Shopify stores", query: 'site:myshopify.com "{location}" OR "Hawaii"' },
  { label: "New business filings", query: '"new business" OR "grand opening" "{location}" 2024' },
  { label: "BBB listed", query: 'site:bbb.org "{location}" "payment processing"' },
  { label: "Google Maps (restaurants)", query: 'site:google.com/maps "restaurant" "{location}"' },
  { label: "Facebook business pages", query: 'site:facebook.com "{location}" "restaurant" OR "retail" "payment"' },
  { label: "Chamber of Commerce", query: '"chamber of commerce" "{location}" "member" OR "directory"' },
  { label: "High-risk verticals", query: '"{location}" "vape shop" OR "smoke shop" OR "CBD" "credit card"' },
  { label: "Medical/Dental offices", query: '"{location}" "dental office" OR "medical clinic" "accepts credit cards"' },
];
