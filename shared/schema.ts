import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Auth / Config (existing) ────────────────────────────────────────

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const aiConfig = pgTable("ai_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enabled: boolean("enabled").notNull().default(false),
  model: text("model").notNull().default("claude-sonnet-4-20250514"),
  systemPrompt: text("system_prompt").notNull().default("You are a helpful assistant for TechSavvy Limited. TechSavvy offers zero-fee payment processing ($500 one-time terminal cost, no monthly or processing fees — customers pay a small surcharge). For businesses that use TechSavvy's payment processor, we also offer: FREE custom websites for businesses that don't have an online presence, premium website packages (paid upgrade with advanced features), and custom software solutions to help run their business. These website and software services are exclusively available to TechSavvy payment processing customers. Be friendly, professional, and concise."),
  welcomeMessage: text("welcome_message").notNull().default("Hi! I'm TechSavvy's AI assistant. Ask me about our zero-fee payment processing, free websites for our merchants, premium web packages, or custom software solutions."),
  maxTokens: integer("max_tokens").notNull().default(1024),
});

export const contactLeads = pgTable("contact_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  plan: text("plan").notNull(),
  highRisk: boolean("high_risk").notNull().default(false),
  monthlyProcessing: text("monthly_processing").notNull(),
  bestContactTime: text("best_contact_time").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Merchant Applications (gamified form) ────────────────────────────

export const merchantApplications = pgTable("merchant_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Step 1: Business basics
  businessLegalName: text("business_legal_name").notNull(),
  dba: text("dba"),
  businessPhone: text("business_phone").notNull(),
  businessEmail: text("business_email").notNull(),
  // Step 2: Location
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  // Step 3: Structure
  businessStructure: text("business_structure").notNull(),
  businessStartDate: text("business_start_date"),
  federalTaxId: text("federal_tax_id"),
  // Step 4: Owner
  ownerName: text("owner_name").notNull(),
  ownerTitle: text("owner_title"),
  ownershipPercent: text("ownership_percent"),
  ownerPhone: text("owner_phone"),
  ownerEmail: text("owner_email"),
  // Step 5: Sales info
  productsSold: text("products_sold"),
  avgMonthlyVolume: text("avg_monthly_volume"),
  avgTicket: text("avg_ticket"),
  percentCardPresent: text("percent_card_present"),
  // Step 6: Signature
  signatureName: text("signature_name").notNull(),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  // Meta
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMerchantApplicationSchema = createInsertSchema(merchantApplications).omit({
  id: true,
  status: true,
  createdAt: true,
});

// ─── Admin Dashboard Leads ───────────────────────────────────────────

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  business: text("business").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  decisionMakerName: text("decision_maker_name").notNull().default(""),
  decisionMakerRole: text("decision_maker_role").notNull().default(""),
  bestContactMethod: text("best_contact_method").notNull().default("phone"),
  package: text("package").notNull().default("terminal"),
  status: text("status").notNull().default("new"),
  source: text("source").notNull().default("direct"),
  vertical: text("vertical").notNull().default("other"),
  currentProcessor: text("current_processor").notNull().default(""),
  currentEquipment: text("current_equipment").notNull().default(""),
  monthlyVolume: text("monthly_volume").notNull().default(""),
  painPoints: text("pain_points").notNull().default(""),
  nextStep: text("next_step").notNull().default(""),
  nextStepDate: text("next_step_date").notNull().default(""),
  attachments: text("attachments").notNull().default("[]"),
  notes: text("notes").notNull().default(""),
  // Statement analysis data (saved when lead comes from statement review)
  statementGrade: text("statement_grade").notNull().default(""),
  statementOverpay: text("statement_overpay").notNull().default(""),
  statementData: text("statement_data").notNull().default(""), // JSON blob of full analysis
  // Referral partner link (for commission tracking)
  referralPartnerId: text("referral_partner_id").notNull().default(""),
  // AI lead score (0-100) + reasoning
  leadScore: integer("lead_score").notNull().default(0),
  leadScoreReason: text("lead_score_reason").notNull().default(""),
  // Tech scan results
  techStack: text("tech_stack").notNull().default(""), // JSON blob
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Clients ─────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  business: text("business").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  package: text("package").notNull().default("terminal"),
  maintenance: text("maintenance").notNull().default("none"),
  websiteUrl: text("website_url").notNull().default(""),
  websiteStatus: text("website_status").notNull().default("not-started"),
  terminalId: text("terminal_id").notNull().default(""),
  monthlyVolume: real("monthly_volume").notNull().default(0),
  startDate: text("start_date").notNull().default(""),
  notes: text("notes").notNull().default(""),
});

// ─── Equipment ────────────────────────────────────────────────────────

export const equipment = pgTable("equipment", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),            // e.g. "PaybotX VP100", "PAX A920"
  type: text("type").notNull().default("terminal"),     // terminal, pos, gateway, pinpad, printer, other
  serialNumber: text("serial_number").notNull().default(""),
  model: text("model").notNull().default(""),           // internal model e.g. SP880
  brand: text("brand").notNull().default(""),           // manufacturer e.g. PaybotX, PAX, Valor
  firmwareVersion: text("firmware_version").notNull().default(""),
  partNumber: text("part_number").notNull().default(""),       // PN on label
  productCode: text("product_code").notNull().default(""),     // full product code
  featureCode: text("feature_code").notNull().default(""),     // feature/config code
  appCode: text("app_code").notNull().default(""),             // APP code
  connectivity: text("connectivity").notNull().default(""),    // CST/ETH/WL/RF/SD/BL etc.
  manufactureDate: text("manufacture_date").notNull().default(""), // MFG date from label
  status: text("status").notNull().default("available"), // available, deployed, maintenance, decommissioned, lost
  condition: text("condition").notNull().default("new"), // new, good, fair, poor
  clientId: text("client_id").notNull().default(""),     // linked client (empty = in inventory)
  clientName: text("client_name").notNull().default(""), // denormalized for easy display
  deployedDate: text("deployed_date").notNull().default(""),
  purchaseDate: text("purchase_date").notNull().default(""),
  purchaseCost: real("purchase_cost").notNull().default(0),
  warrantyExpiry: text("warranty_expiry").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Revenue ─────────────────────────────────────────────────────────

export const revenueEntries = pgTable("revenue", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  type: text("type").notNull().default("other"),
  description: text("description").notNull().default(""),
  amount: real("amount").notNull().default(0),
  clientId: text("client_id").notNull().default(""),
  recurring: boolean("recurring").notNull().default(false),
});

// ─── Tasks ───────────────────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  dueDate: text("due_date").notNull().default(""),
  priority: text("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  linkedTo: text("linked_to").notNull().default(""),
  assignee: text("assignee").notNull().default(""),
  planItemId: text("plan_item_id").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

// ─── Admin Files ─────────────────────────────────────────────────────

export const adminFiles = pgTable("admin_files", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default("untitled"),
  size: integer("size").notNull().default(0),
  type: text("type").notNull().default("document"),
  category: text("category").notNull().default("general"),
  folder: text("folder").notNull().default(""),
  uploadedAt: text("uploaded_at").notNull(),
  url: text("url").notNull().default(""),
  starred: integer("starred").notNull().default(0),
});

// ─── Slack Config (singleton row) ────────────────────────────────────

export const slackConfig = pgTable("slack_config", {
  id: text("id").primaryKey().default("default"),
  webhookUrl: text("webhook_url").notNull().default(""),
  channel: text("channel").notNull().default("#general"),
  enabled: boolean("enabled").notNull().default(false),
  notifyNewLead: boolean("notify_new_lead").notNull().default(true),
  notifyNewClient: boolean("notify_new_client").notNull().default(true),
  notifyRevenue: boolean("notify_revenue").notNull().default(false),
  notifyTaskDue: boolean("notify_task_due").notNull().default(true),
});

// ─── Integrations ────────────────────────────────────────────────────

export const integrations = pgTable("integrations", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  type: text("type").notNull().default("webhook"),
  enabled: boolean("enabled").notNull().default(false),
  config: text("config").notNull().default("{}"),
  lastSync: text("last_sync").notNull().default(""),
});

// ─── Referral Partners ───────────────────────────────────────────────

export const referralPartners = pgTable("referral_partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  niche: text("niche").notNull().default(""),
  clientTypes: text("client_types").notNull().default(""),
  referralTerms: text("referral_terms").notNull().default(""),
  introMethod: text("intro_method").notNull().default(""),
  trackingNotes: text("tracking_notes").notNull().default(""),
  lastCheckIn: text("last_check_in").notNull().default(""),
  nextCheckIn: text("next_check_in").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

// ─── Playbook Checks ────────────────────────────────────────────────

export const playbookChecks = pgTable("playbook_checks", {
  id: text("id").primaryKey(),
  channel: text("channel").notNull().default(""),
  label: text("label").notNull().default(""),
  completed: boolean("completed").notNull().default(false),
  completedAt: text("completed_at").notNull().default(""),
});

// ─── Weekly KPIs ─────────────────────────────────────────────────────

export const weeklyKpis = pgTable("weekly_kpis", {
  id: text("id").primaryKey(),
  weekStart: text("week_start").notNull().default(""),
  outboundCalls: integer("outbound_calls").notNull().default(0),
  outboundEmails: integer("outbound_emails").notNull().default(0),
  outboundDMs: integer("outbound_dms").notNull().default(0),
  walkIns: integer("walk_ins").notNull().default(0),
  contactsMade: integer("contacts_made").notNull().default(0),
  appointmentsSet: integer("appointments_set").notNull().default(0),
  statementsRequested: integer("statements_requested").notNull().default(0),
  statementsReceived: integer("statements_received").notNull().default(0),
  proposalsSent: integer("proposals_sent").notNull().default(0),
  dealsWon: integer("deals_won").notNull().default(0),
  volumeWon: real("volume_won").notNull().default(0),
  notes: text("notes").notNull().default(""),
});

// ─── 90-Day Plan Items ──────────────────────────────────────────────

export const planItems = pgTable("plan_items", {
  id: text("id").primaryKey(),
  phase: integer("phase").notNull().default(1),
  weekRange: text("week_range").notNull().default("1-2"),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  completed: boolean("completed").notNull().default(false),
  completedAt: text("completed_at").notNull().default(""),
  order: integer("sort_order").notNull().default(0),
});

// ─── Materials Checklist ─────────────────────────────────────────────

export const materials = pgTable("materials", {
  id: text("id").primaryKey(),
  category: text("category").notNull().default("sales"),
  name: text("name").notNull().default(""),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("not-started"),
  fileUrl: text("file_url").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

// ─── Resources ───────────────────────────────────────────────────────

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("sales-materials"),
  type: text("type").notNull().default("doc"),
  url: text("url").notNull().default(""),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  order: integer("sort_order").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Admin Settings (singleton — stores hashed password) ────────────

export const adminSettings = pgTable("admin_settings", {
  id: text("id").primaryKey().default("default"),
  passwordHash: text("password_hash").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

// ─── Activity Log ────────────────────────────────────────────────────

export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  action: text("action").notNull().default(""),
  details: text("details").notNull().default(""),
  timestamp: text("timestamp").notNull(),
  type: text("type").notNull().default(""),
});

// ─── Team Members ────────────────────────────────────────────────────

export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  status: text("status").notNull().default("active"),
  dailyInvolvement: text("daily_involvement").notNull().default("full"),
  joinedAt: text("joined_at").notNull(),
});

// ─── Business Info (singleton) ───────────────────────────────────────

export const businessInfo = pgTable("business_info", {
  id: text("id").primaryKey().default("default"),
  companyName: text("company_name").notNull().default(""),
  dba: text("dba").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  website: text("website").notNull().default(""),
  taxId: text("tax_id").notNull().default(""),
  bankPartner: text("bank_partner").notNull().default(""),
  processorPartner: text("processor_partner").notNull().default("CashSwipe"),
  currentPhase: text("current_phase").notNull().default("onboarding"),
  notes: text("notes").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

// ─── Schedule Items ──────────────────────────────────────────────────

export const scheduleItems = pgTable("schedule_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  date: text("date").notNull(),
  time: text("time").notNull().default(""),
  duration: integer("duration").notNull().default(30),
  assigneeId: text("assignee_id").notNull().default(""),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  category: text("category").notNull().default("general"),
  createdAt: text("created_at").notNull(),
});

// ─── Pinned Pitches ──────────────────────────────────────────────────

export const pinnedPitches = pgTable("pinned_pitches", {
  id: text("id").primaryKey(),
  scriptKey: text("script_key").notNull(),
  customContent: text("custom_content").notNull().default(""),
  pinnedAt: text("pinned_at").notNull(),
});

// ─── Email Threads ──────────────────────────────────────────────────

export const emailThreads = pgTable("email_threads", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull().default(""),
  leadId: text("lead_id").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  source: text("source").notNull().default("direct"), // direct | contact-form | outreach | outreach-reply | email_inbound | statement-review | lead-magnet
  status: text("status").notNull().default("open"), // open | replied | closed
  folder: text("folder").notNull().default("inbox"), // inbox | sent | spam | trash | archived
  starred: boolean("starred").notNull().default(false),
  aiIntent: text("ai_intent").notNull().default(""), // new_lead | support_request | billing_question | spam | general_inquiry
  aiPriority: text("ai_priority").notNull().default("normal"), // urgent | high | normal | low
  aiSentiment: text("ai_sentiment").notNull().default("neutral"), // positive | neutral | negative | angry
  unread: boolean("unread").notNull().default(true),
  lastMessageAt: text("last_message_at").notNull(),
  createdAt: text("created_at").notNull(),
});

// ─── Email Messages ─────────────────────────────────────────────────

export const emailMessages = pgTable("email_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id").notNull(),
  direction: text("direction").notNull().default("inbound"), // inbound | outbound
  fromEmail: text("from_email").notNull().default(""),
  fromName: text("from_name").notNull().default(""),
  toEmail: text("to_email").notNull().default(""),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  htmlBody: text("html_body").notNull().default(""),
  resendId: text("resend_id").notNull().default(""), // Resend message ID for tracking
  status: text("status").notNull().default("sent"), // sent | delivered | opened | bounced | failed
  sentAt: text("sent_at").notNull(),
});

// ─── Outreach Templates ─────────────────────────────────────────────

export const outreachTemplates = pgTable("outreach_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  category: text("category").notNull().default("cold"), // cold | follow-up | confirmation
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Call Scripts ────────────────────────────────────────────────────

export const callScripts = pgTable("call_scripts", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  script: text("script").notNull().default(""),
  talkingPoints: text("talking_points").notNull().default("[]"), // JSON array
  objections: text("objections").notNull().default("[]"), // JSON array
  generatedAt: text("generated_at").notNull(),
});

// ─── Resend Config (singleton) ──────────────────────────────────────

export const resendConfig = pgTable("resend_config", {
  id: text("id").primaryKey().default("default"),
  enabled: boolean("enabled").notNull().default(false),
  fromEmail: text("from_email").notNull().default("contact@techsavvyhawaii.com"),
  fromName: text("from_name").notNull().default("TechSavvy Hawaii"),
  autoConfirmEnabled: boolean("auto_confirm_enabled").notNull().default(true),
  forwardCopyTo: text("forward_copy_to").notNull().default(""), // forward to personal email
  updatedAt: text("updated_at").notNull(),
});

// ─── Opportunities / Deals ──────────────────────────────────────────

export const opportunities = pgTable("opportunities", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  leadId: text("lead_id").notNull().default(""),
  clientId: text("client_id").notNull().default(""),
  equipmentId: text("equipment_id").notNull().default(""),
  stage: text("stage").notNull().default("prospecting"), // prospecting, qualification, proposal, negotiation, closed-won, closed-lost
  value: real("value").notNull().default(0),
  probability: integer("probability").notNull().default(10), // 0-100
  expectedCloseDate: text("expected_close_date").notNull().default(""),
  actualCloseDate: text("actual_close_date").notNull().default(""),
  lossReason: text("loss_reason").notNull().default(""),
  notes: text("notes").notNull().default(""),
  assigneeId: text("assignee_id").notNull().default(""),
  stageChangedAt: text("stage_changed_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── User Accounts (Enterprise RBAC) ───────────────────────────────

export const userAccounts = pgTable("user_accounts", {
  id: text("id").primaryKey(),
  email: text("email").notNull().default(""),
  passwordHash: text("password_hash").notNull().default(""),
  displayName: text("display_name").notNull().default(""),
  role: text("role").notNull().default("sales-rep"), // admin, manager, sales-rep, viewer
  teamId: text("team_id").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: text("last_login_at").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

// ─── Lead / Deal Activities ────────────────────────────────────────

export const leadActivities = pgTable("lead_activities", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().default(""),
  opportunityId: text("opportunity_id").notNull().default(""),
  userId: text("user_id").notNull().default(""),
  type: text("type").notNull().default("note"), // call, email, meeting, note, stage-change, task, deal-created, deal-closed
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  metadata: text("metadata").notNull().default("{}"), // JSON
  createdAt: text("created_at").notNull(),
});

// ─── AI Autopilot Config (singleton) ─────────────────────────────────

export const autopilotConfig = pgTable("autopilot_config", {
  id: text("id").primaryKey().default("default"),
  enabled: boolean("enabled").notNull().default(false),
  // Prospecting
  autoProspectEnabled: boolean("auto_prospect_enabled").notNull().default(false),
  prospectLocations: text("prospect_locations").notNull().default("Honolulu, Hawaii"),
  prospectVerticals: text("prospect_verticals").notNull().default("restaurant,retail,salon"), // comma-separated
  maxProspectsPerRun: integer("max_prospects_per_run").notNull().default(10),
  // Outreach
  autoOutreachEnabled: boolean("auto_outreach_enabled").notNull().default(false),
  outreachDelay: integer("outreach_delay_hours").notNull().default(2), // hours after lead created
  maxOutreachPerDay: integer("max_outreach_per_day").notNull().default(15),
  // Follow-up
  autoFollowUpEnabled: boolean("auto_follow_up_enabled").notNull().default(false),
  followUpAfterDays: integer("follow_up_after_days").notNull().default(3),
  maxFollowUpsPerLead: integer("max_follow_ups_per_lead").notNull().default(3),
  // Enrichment
  autoEnrichEnabled: boolean("auto_enrich_enabled").notNull().default(true),
  // Stats
  lastRunAt: text("last_run_at").notNull().default(""),
  totalProspected: integer("total_prospected").notNull().default(0),
  totalEmailed: integer("total_emailed").notNull().default(0),
  totalFollowUps: integer("total_follow_ups").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

// ─── Outreach Queue (pending AI-generated emails) ────────────────────

export const outreachQueue = pgTable("outreach_queue", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull(),
  type: text("type").notNull().default("initial"), // initial, follow-up-1, follow-up-2, follow-up-3
  status: text("status").notNull().default("pending"), // pending, generating, ready, sent, failed, skipped
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  htmlBody: text("html_body").notNull().default(""),
  scheduledFor: text("scheduled_for").notNull(),
  sentAt: text("sent_at").notNull().default(""),
  error: text("error").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

// ─── Zod Schemas & Types ─────────────────────────────────────────────

export const insertContactLeadSchema = createInsertSchema(contactLeads).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// ─── Invoices ────────────────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().default(""),
  clientName: text("client_name").notNull().default(""),
  amount: real("amount").notNull().default(0), // cents
  status: text("status").notNull().default("pending"), // pending, paid, overdue, void
  dueDate: text("due_date").notNull().default(""),
  paidDate: text("paid_date"),
  notes: text("notes").notNull().default(""),
  fileUrl: text("file_url").notNull().default(""),
  fileName: text("file_name").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertAiConfigSchema = createInsertSchema(aiConfig).omit({
  id: true,
});

export const updateAiConfigSchema = insertAiConfigSchema.partial();

// Public lead submission (from website / lead magnets) — strict validation
export const publicLeadSchema = z.object({
  name: z.string().max(200).transform(v => v.replace(/<[^>]*>/g, "").trim()).default(""),
  business: z.string().max(200).transform(v => v.replace(/<[^>]*>/g, "").trim()).default(""),
  phone: z.string().max(30).transform(v => v.replace(/[^0-9+() -]/g, "").trim()).default(""),
  email: z.string().max(254).email().optional().or(z.literal("")),
  package: z.enum(["terminal", "gateway", "both", "website", "custom", "trial", "online", "high-risk", "premium-web", "questions"]).default("terminal"),
  notes: z.string().max(2000).transform(v => v.replace(/<[^>]*>/g, "").trim()).default(""),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AiConfig = typeof aiConfig.$inferSelect;
export type InsertAiConfig = z.infer<typeof insertAiConfigSchema>;
export type UpdateAiConfig = z.infer<typeof updateAiConfigSchema>;
export type ContactLead = typeof contactLeads.$inferSelect;
export type InsertContactLead = z.infer<typeof insertContactLeadSchema>;
export type MerchantApplication = typeof merchantApplications.$inferSelect;
export type InsertMerchantApplication = z.infer<typeof insertMerchantApplicationSchema>;
export type EmailThread = typeof emailThreads.$inferSelect;
export type EmailMessage = typeof emailMessages.$inferSelect;
export type OutreachTemplate = typeof outreachTemplates.$inferSelect;
export type CallScript = typeof callScripts.$inferSelect;
export type ResendConfig = typeof resendConfig.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type UserAccount = typeof userAccounts.$inferSelect;
export type LeadActivityRecord = typeof leadActivities.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
