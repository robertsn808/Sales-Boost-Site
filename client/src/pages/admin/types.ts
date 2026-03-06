// ─── Shared Admin Types ─────────────────────────────────────────────

export type PipelineStage = "new" | "contacted" | "qualified" | "statement-requested" | "statement-received" | "analysis-delivered" | "proposal-sent" | "negotiation" | "won" | "lost" | "nurture";
export type LeadSource = "referral" | "networking" | "social" | "direct" | "lead-magnet";
export type PackageType = "terminal" | "trial" | "online";
export type MaintenancePlan = "none" | "basic" | "pro" | "premium";
export type Vertical = "restaurant" | "retail" | "salon" | "auto" | "medical" | "cbd" | "vape" | "firearms" | "ecommerce" | "services" | "other";
export type DealStage = "prospecting" | "qualification" | "proposal" | "negotiation" | "closed-won" | "closed-lost";
export type UserRole = "admin" | "manager" | "sales-rep" | "viewer";

export interface Lead {
  id: string;
  name: string;
  business: string;
  address: string;
  phone: string;
  email: string;
  decisionMakerName: string;
  decisionMakerRole: string;
  bestContactMethod: string;
  package: PackageType;
  status: PipelineStage;
  source: LeadSource;
  vertical: Vertical;
  currentProcessor: string;
  currentEquipment: string;
  monthlyVolume: string;
  painPoints: string;
  nextStep: string;
  nextStepDate: string;
  attachments: Array<{ name: string; url: string }>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralPartner {
  id: string;
  name: string;
  niche: string;
  clientTypes: string;
  referralTerms: string;
  introMethod: string;
  trackingNotes: string;
  lastCheckIn: string;
  nextCheckIn: string;
  createdAt: string;
}

export interface PlaybookCheckItem {
  id: string;
  channel: string;
  label: string;
  completed: boolean;
  completedAt: string;
}

export interface WeeklyKPI {
  id: string;
  weekStart: string;
  outboundCalls: number;
  outboundEmails: number;
  outboundDMs: number;
  walkIns: number;
  contactsMade: number;
  appointmentsSet: number;
  statementsRequested: number;
  statementsReceived: number;
  proposalsSent: number;
  dealsWon: number;
  volumeWon: number;
  notes: string;
}

export interface PlanItem {
  id: string;
  phase: number;
  weekRange: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string;
  order: number;
}

export interface MaterialItem {
  id: string;
  category: string;
  name: string;
  description: string;
  status: string;
  fileUrl: string;
  updatedAt: string;
}

export interface AdminResource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelScore {
  source: string;
  total: number;
  contacted: number;
  contactRate: number;
  qualified: number;
  appointmentRate: number;
  stmtRequested: number;
  stmtReceived: number;
  stmtReceivedRate: number;
  proposalSent: number;
  won: number;
  lost: number;
  closeRate: number;
  avgTimeToClose: number;
  avgVolumeWon: number;
}

export interface Client {
  id: string;
  name: string;
  business: string;
  phone: string;
  email: string;
  package: PackageType;
  maintenance: MaintenancePlan;
  websiteUrl: string;
  websiteStatus: "not-started" | "in-progress" | "live" | "self-hosted";
  terminalId: string;
  monthlyVolume: number;
  startDate: string;
  notes: string;
}

export interface RevenueEntry {
  id: string;
  date: string;
  type: "terminal-sale" | "trial-convert" | "maintenance" | "one-off-update" | "website-addon" | "other";
  description: string;
  amount: number;
  clientId: string;
  recurring: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  linkedTo: string;
  assignee: string;
  planItemId: string;
  createdAt: string;
}

export interface AdminFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  folder?: string;
  starred?: number;
  uploadedAt: string;
  url: string;
}

export interface SlackConfig {
  webhookUrl: string;
  channel: string;
  enabled: boolean;
  notifyNewLead: boolean;
  notifyNewClient: boolean;
  notifyRevenue: boolean;
  notifyTaskDue: boolean;
}

export interface ActivityEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  dailyInvolvement: string;
  joinedAt: string;
}

export interface BusinessInfoData {
  companyName: string;
  dba: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  taxId: string;
  bankPartner: string;
  processorPartner: string;
  currentPhase: string;
  notes: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  assigneeId: string;
  priority: string;
  status: string;
  isAiGenerated: boolean;
  category: string;
  createdAt: string;
}

export interface PinnedPitch {
  id: string;
  scriptKey: string;
  customContent: string;
  pinnedAt: string;
}

export interface AiRecommendation {
  title: string;
  description: string;
  assigneeName: string;
  priority: string;
  category: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  leadId: string;
  contactEmail: string;
  contactName: string;
  source: "direct" | "contact-form" | "outreach" | "outreach-reply";
  status: "open" | "replied" | "closed";
  unread: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages?: EmailMessage[];
}

export interface EmailMessage {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  body: string;
  htmlBody: string;
  resendId: string;
  status: string;
  sentAt: string;
}

export interface EmailStats {
  total: number;
  unread: number;
  outreach: number;
  replies: number;
  directInbound: number;
  contactForm: number;
}

export interface ResendEmailConfig {
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  autoConfirmEnabled: boolean;
  forwardCopyTo: string;
}

export interface CallScriptData {
  id: string;
  leadId: string;
  script: string;
  talkingPoints: string[];
  objections: Array<{ objection: string; response: string }>;
  generatedAt: string;
}

// ─── Enterprise CRM Types ────────────────────────────────────────────

export interface Opportunity {
  id: string;
  title: string;
  leadId: string;
  clientId: string;
  equipmentId: string;
  stage: DealStage;
  value: number;
  probability: number;
  weightedValue: number;
  expectedCloseDate: string;
  actualCloseDate: string;
  lossReason: string;
  notes: string;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
  stageChangedAt: string;
  // Joined fields
  leadName?: string;
  leadBusiness?: string;
  assigneeName?: string;
  equipmentName?: string;
  equipmentSerial?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamId: string;
  avatarUrl: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  opportunityId: string;
  userId: string;
  type: "call" | "email" | "meeting" | "note" | "stage-change" | "task" | "deal-created" | "deal-closed";
  title: string;
  description: string;
  metadata: string;
  createdAt: string;
  // Joined
  userName?: string;
}

export interface ForecastData {
  totalPipeline: number;
  weightedPipeline: number;
  closedWon: number;
  closedLost: number;
  avgDealSize: number;
  avgDaysToClose: number;
  winRate: number;
  stageBreakdown: Array<{
    stage: DealStage;
    count: number;
    totalValue: number;
    weightedValue: number;
    avgAge: number;
  }>;
  monthlyForecast: Array<{
    month: string;
    projected: number;
    closed: number;
  }>;
  topDeals: Opportunity[];
}

export interface BriefingData {
  date: string;
  staleLeads: { id: string; name: string; business: string; status: string; daysSinceUpdate: number; nextStep: string }[];
  followUpsDue: { id: string; name: string; business: string; status: string; nextStep: string; overdue: boolean }[];
  upcomingFollowUps: { id: string; name: string; business: string; status: string; nextStep: string }[];
  overdueTasks: { id: string; title: string; dueDate: string; priority: string }[];
  todayTasks: { id: string; title: string; priority: string }[];
  todaySchedule: { id: string; title: string; time: string; category: string }[];
  revenue: { thisMonth: number; lastMonth: number; mrr: number };
  pipeline: { new: number; contacted: number; qualified: number; proposalSent: number; negotiation: number; totalActive: number; wonThisMonth: number };
  clientAlerts: { id: string; business: string; issues: string[] }[];
  planProgress: { total: number; completed: number; percent: number };
}
