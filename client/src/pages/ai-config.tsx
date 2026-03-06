import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Bot, Save, Zap, Settings, MessageSquare, Lock, LogOut,
  LayoutDashboard, Users, DollarSign, ClipboardList, Phone, Mail,
  Plus, Trash2, Edit3, Check, TrendingUp, CreditCard, Globe,
  AlertTriangle, Calendar, Search, Filter, Copy, MapPin, Paperclip, Target, BookOpen,
  UserPlus, Building, CheckCircle,
  BarChart3, ArrowUpRight, ArrowDownRight, ArrowRight,
  Plug, FolderOpen, Activity, FileText, Video, File, Bell, Send, RefreshCw, ExternalLink, Upload, Hash, Library, Star,
  Pin, PinOff, Sparkles, Clock, UserCog, Briefcase, Sun, Moon,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, GraduationCap, X, Menu, Eye,
  Download, LayoutList, LayoutGrid, Image, FileSpreadsheet, Monitor,
  Inbox, Archive, ArchiveX, ShieldAlert, MailOpen, MoreHorizontal, ChevronDown,
} from "lucide-react";
import type { AiConfig } from "@shared/schema";
import { PdfViewer, PdfThumbnail } from "@/components/pdf-viewer";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect, useMemo, useRef } from "react";
import DealsTab from "./admin/DealsTab";
import ForecastTab from "./admin/ForecastTab";
import UsersTab from "./admin/UsersTab";
import AutopilotTab from "./admin/AutopilotTab";
import EquipmentTab from "./admin/EquipmentTab";
import PartnersTab from "./admin/PartnersTab";
import FollowUpTab from "./admin/FollowUpTab";

// ─── Types ───────────────────────────────────────────────────────────

type PipelineStage = "new" | "contacted" | "qualified" | "statement-requested" | "statement-received" | "analysis-delivered" | "proposal-sent" | "negotiation" | "won" | "lost" | "nurture";
type LeadSource = "referral" | "networking" | "social" | "direct" | "lead-magnet" | "prospecting";
type PackageType = "terminal" | "trial" | "online" | "combo";
type MaintenancePlan = "none" | "basic" | "pro" | "premium";
type Vertical = "restaurant" | "retail" | "salon" | "auto" | "medical" | "cbd" | "vape" | "firearms" | "ecommerce" | "services" | "other";

interface Lead {
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

interface ReferralPartner {
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

interface PlaybookCheckItem {
  id: string;
  channel: string;
  label: string;
  completed: boolean;
  completedAt: string;
}

interface WeeklyKPI {
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

interface PlanItem {
  id: string;
  phase: number;
  weekRange: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string;
  order: number;
}

interface MaterialItem {
  id: string;
  category: string;
  name: string;
  description: string;
  status: string;
  fileUrl: string;
  updatedAt: string;
}

interface AdminResource {
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

interface ChannelScore {
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

interface Client {
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

interface RevenueEntry {
  id: string;
  date: string;
  type: "terminal-sale" | "trial-convert" | "maintenance" | "one-off-update" | "website-addon" | "other";
  description: string;
  amount: number;
  clientId: string;
  recurring: boolean;
}

interface Task {
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

const TEAM_MEMBERS_LIST = [
  { value: "kepa", label: "Kepa", color: "bg-blue-500" },
  { value: "jessica", label: "Jessica", color: "bg-pink-500" },
  { value: "joey", label: "Joey", color: "bg-emerald-500" },
  { value: "aaron", label: "Aaron", color: "bg-amber-500" },
] as const;
type TeamAssignee = typeof TEAM_MEMBERS_LIST[number]["value"];

interface AdminFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  folder: string;
  uploadedAt: string;
  url: string;
  starred: number;
}

interface SlackConfig {
  webhookUrl: string;
  channel: string;
  enabled: boolean;
  notifyNewLead: boolean;
  notifyNewClient: boolean;
  notifyRevenue: boolean;
  notifyTaskDue: boolean;
}

interface ActivityEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  dailyInvolvement: string;
  joinedAt: string;
}

interface BusinessInfoData {
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

interface ScheduleItem {
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

interface PinnedPitch {
  id: string;
  scriptKey: string;
  customContent: string;
  pinnedAt: string;
}

interface AiRecommendation {
  title: string;
  description: string;
  assigneeName: string;
  priority: string;
  category: string;
}

interface EmailThread {
  id: string;
  subject: string;
  leadId: string;
  contactEmail: string;
  contactName: string;
  source: "direct" | "contact-form" | "outreach" | "outreach-reply" | "email_inbound" | "statement-review" | "lead-magnet";
  status: "open" | "replied" | "closed";
  folder: "inbox" | "sent" | "spam" | "trash" | "archived";
  starred: boolean;
  aiIntent: string;
  aiPriority: string;
  aiSentiment: string;
  unread: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages?: EmailMessage[];
}

interface EmailMessage {
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

interface EmailStats {
  total: number;
  unread: number;
  starred: number;
  outreach: number;
  replies: number;
  directInbound: number;
  contactForm: number;
  folders: Record<string, { total: number; unread: number }>;
}

interface ResendEmailConfig {
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  autoConfirmEnabled: boolean;
  forwardCopyTo: string;
}

interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "cold" | "follow-up" | "confirmation";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CallScriptData {
  id: string;
  leadId: string;
  script: string;
  talkingPoints: string[];
  objections: Array<{ objection: string; response: string }>;
  generatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split("T")[0]; }
function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Constants ───────────────────────────────────────────────────────

const PIPELINE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string; short: string }> = {
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

const SOURCE_CONFIG: Record<LeadSource, { label: string; color: string; icon: string }> = {
  referral:     { label: "Referral Partner", color: "text-emerald-400", icon: "R" },
  networking:   { label: "Networking", color: "text-blue-400", icon: "N" },
  social:       { label: "Social Outreach", color: "text-pink-400", icon: "S" },
  direct:       { label: "Direct Prospecting", color: "text-orange-400", icon: "D" },
  "lead-magnet":{ label: "Lead Magnet", color: "text-purple-400", icon: "L" },
  prospecting:  { label: "Prospecting", color: "text-cyan-400", icon: "P" },
};

const VERTICAL_CONFIG: Record<Vertical, string> = {
  restaurant: "Restaurant/Food", retail: "Retail", salon: "Salon/Beauty", auto: "Auto/Repair",
  medical: "Medical/Dental", cbd: "CBD/Hemp", vape: "Vape/Smoke", firearms: "Firearms",
  ecommerce: "E-Commerce", services: "Professional Services", other: "Other",
};

const PACKAGE_CONFIG: Record<PackageType, { label: string; color: string }> = {
  terminal: { label: "Terminal ($399)", color: "text-primary" },
  trial: { label: "30-Day Trial", color: "text-chart-4" },
  online: { label: "Online (Free)", color: "text-chart-2" },
  combo: { label: "Combo Bundle", color: "text-amber-400" },
};

const MAINTENANCE_CONFIG: Record<MaintenancePlan, { label: string; price: string }> = {
  none: { label: "None / Self-Hosted", price: "$0" },
  basic: { label: "Basic", price: "$50/mo" },
  pro: { label: "Pro", price: "$199/mo" },
  premium: { label: "Premium", price: "$399/mo" },
};

const REVENUE_TYPES: Record<RevenueEntry["type"], string> = {
  "terminal-sale": "Terminal Sale", "trial-convert": "Trial Conversion",
  "maintenance": "Maintenance Plan", "one-off-update": "One-Off Update",
  "website-addon": "Website Add-On", "other": "Other",
};

const MODELS = [
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Latest)" },
  { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Fast)" },
];

const CONTACT_METHODS: Record<string, string> = {
  phone: "Phone Call", email: "Email", text: "Text/SMS", "in-person": "In-Person",
};

const ACTIVITY_COLORS: Record<string, string> = {
  lead: "bg-blue-400", client: "bg-emerald-400", revenue: "bg-purple-400",
  task: "bg-yellow-400", file: "bg-orange-400", integration: "bg-pink-400", auth: "bg-gray-400",
};

const MATERIAL_CATEGORIES: Record<string, { label: string; icon: typeof Target; color: string; borderColor: string }> = {
  sales: { label: "Sales & Outreach", icon: Target, color: "text-blue-400", borderColor: "border-l-blue-400" },
  "lead-gen": { label: "Lead Generation", icon: Sparkles, color: "text-purple-400", borderColor: "border-l-purple-400" },
  partner: { label: "Partner Program", icon: Users, color: "text-amber-400", borderColor: "border-l-amber-400" },
  tracking: { label: "Tracking & Ops", icon: BarChart3, color: "text-emerald-400", borderColor: "border-l-emerald-400" },
};

const TEMPLATE_CATEGORIES: Record<string, { label: string; color: string; icon: typeof Mail }> = {
  cold: { label: "Cold Outreach", color: "text-blue-400 bg-blue-400/10", icon: Send },
  "follow-up": { label: "Follow-Up", color: "text-amber-400 bg-amber-400/10", icon: RefreshCw },
  confirmation: { label: "Confirmation", color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle },
};

const PLAYBOOK_SCRIPTS = {
  referral: {
    outreach: `I work with local businesses to lower processing costs and upgrade payment reliability. You already advise businesses on operations/financials — if you have clients complaining about fees or equipment, I can do a no-obligation statement review. If it helps, I'll pay a referral fee and track everything cleanly.`,
  },
  networking: {
    elevator: `I help local businesses stop bleeding money on hidden processing fees and outdated equipment. If you bring me a recent statement, I'll highlight what's actually being charged and what could be improved — no obligation.`,
  },
  social: {
    dm: `Appreciate you checking that post. If you want, I can do a quick statement check and tell you where the extra fees usually hide. It's a simple yes/no: either it's already solid, or there's money on the table.`,
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

// ─── First-Time Setup ────────────────────────────────────────────────

function AdminSetup({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const setupMutation = useMutation({
    mutationFn: async (pw: string) => { const res = await apiRequest("POST", "/api/admin/setup", { password: pw }); return res.json(); },
    onSuccess: () => { onComplete(); toast({ title: "Password created", description: "You're now logged in." }); },
    onError: (err: Error) => { setError(err.message.replace(/^\d+:\s*/, "")); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setupMutation.mutate(password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm overflow-visible border-primary/10">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent" />
        <CardHeader className="text-center relative">
          <div className="w-14 h-14 rounded-md bg-emerald-500/15 flex items-center justify-center mx-auto mb-3"><Lock className="w-7 h-7 text-emerald-500" /></div>
          <CardTitle className="text-xl">Welcome — Set Your Password</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Create a password for your admin dashboard</p>
        </CardHeader>
        <CardContent className="relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted rounded-md px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50" placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-muted rounded-md px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50" placeholder="Re-enter your password" />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={setupMutation.isPending || !password || !confirm}>{setupMutation.isPending ? "Creating..." : "Create Password & Log In"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (pw: string) => { const res = await apiRequest("POST", "/api/admin/login", { password: pw }); return res.json(); },
    onSuccess: () => { onLogin(); toast({ title: "Logged in", description: "Welcome to the admin panel." }); },
    onError: () => { setError("Invalid password. Please try again."); },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm overflow-visible border-primary/10">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent" />
        <CardHeader className="text-center relative">
          <div className="w-14 h-14 rounded-md bg-primary/15 flex items-center justify-center mx-auto mb-3"><Lock className="w-7 h-7 text-primary" /></div>
          <CardTitle className="text-xl">Admin Access</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter your admin password to continue</p>
        </CardHeader>
        <CardContent className="relative">
          <form onSubmit={(e) => { e.preventDefault(); setError(""); loginMutation.mutate(password); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted rounded-md px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50" placeholder="Enter admin password" />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loginMutation.isPending || !password}>{loginMutation.isPending ? "Logging in..." : "Log In"}</Button>
          </form>
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href={window.location.hostname.startsWith("admin.") ? `https://${window.location.hostname.replace("admin.", "")}` : "/"}>Back to Main Site</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────

export default function AiConfigPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { data: authStatus, isError } = useQuery<{ authenticated: boolean }>({ queryKey: ["/api/admin/check"] });
  const { data: setupStatus, isError: setupError } = useQuery<{ needsSetup: boolean }>({ queryKey: ["/api/admin/setup-status"] });

  const setupReady = setupStatus !== undefined || setupError;
  const needsSetup = setupStatus?.needsSetup ?? setupError;

  useEffect(() => {
    if (authStatus !== undefined) { setIsAuthenticated(authStatus.authenticated); setAuthChecked(true); }
    else if (isError) { setIsAuthenticated(false); setAuthChecked(true); }
  }, [authStatus, isError]);

  const logoutMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/admin/logout"); },
    onSuccess: () => { setIsAuthenticated(false); queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] }); },
  });

  if (!authChecked || !setupReady) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;

  if (needsSetup && !isAuthenticated) {
    return <AdminSetup onComplete={() => {
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/setup-status"] });
    }} />;
  }

  if (!isAuthenticated) return <AdminLogin onLogin={() => { setIsAuthenticated(true); queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] }); }} />;
  return <AdminDashboard onLogout={() => logoutMutation.mutate()} />;
}

// ─── Dashboard Shell ─────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const mainDomain = window.location.hostname.startsWith("admin.") ? `https://${window.location.hostname.replace("admin.", "")}` : "/";

  const tabGroups = [
    { label: "COMMAND CENTER", tabs: [
      { value: "overview", icon: BarChart3, label: "Today" },
      { value: "tasks", icon: ClipboardList, label: "Tasks & Schedule" },
    ]},
    { label: "SALES", tabs: [
      { value: "leads", icon: UserPlus, label: "Pipeline" },
      { value: "follow-up", icon: ArrowRight, label: "Follow-Up" },
      { value: "deals", icon: DollarSign, label: "Deals" },
      { value: "clients", icon: Users, label: "Clients" },
      { value: "inbox", icon: Mail, label: "Inbox" },
    ]},
    { label: "STRATEGY", tabs: [
      { value: "playbooks", icon: BookOpen, label: "Playbooks" },
      { value: "analytics", icon: Target, label: "Analytics" },
      { value: "plan", icon: Calendar, label: "90-Day Plan" },
      { value: "finances", icon: DollarSign, label: "Finances" },
    ]},
    { label: "AI & TOOLS", tabs: [
      { value: "autopilot", icon: Zap, label: "Autopilot" },
      { value: "ai-tools", icon: Sparkles, label: "AI Tools" },
      { value: "files", icon: FolderOpen, label: "Files" },
      { value: "equipment", icon: Monitor, label: "Equipment" },
      { value: "partners", icon: GraduationCap, label: "Partners" },
    ]},
    { label: "", tabs: [
      { value: "settings", icon: Settings, label: "Settings" },
    ]},
  ];
  const tabs = tabGroups.flatMap(g => g.tabs);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center"><LayoutDashboard className="w-4 h-4 text-primary" /></div>
                <h1 className="text-sm font-bold">TechSavvy Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a href={mainDomain} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" title="Go to website"><ExternalLink className="w-4 h-4" /></a>
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-muted-foreground" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground"><LogOut className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Log Out</span></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-14 z-40 h-[calc(100vh-3.5rem)] bg-card/80 backdrop-blur-xl border-r border-border/50 overflow-y-auto scrollbar-none
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarCollapsed ? "lg:w-16" : "lg:w-56"}
          w-64
        `}>
          <div className="flex flex-col h-full">
            {/* Mobile close + Desktop collapse */}
            <div className="flex items-center justify-between p-2 border-b border-border/30">
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden lg:flex h-8 w-8 ml-auto" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-2 space-y-1">
              {tabGroups.map((group) => (
                <div key={group.label || "settings-group"}>
                  {!sidebarCollapsed && group.label && <p className="text-[9px] font-bold text-muted-foreground/50 tracking-wider px-3 pt-3 pb-1">{group.label}</p>}
                  {!group.label && <div className="border-t border-border/30 mx-3 mt-3 mb-1" />}
                  {sidebarCollapsed && <div className="border-t border-border/20 my-1.5" />}
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => handleTabChange(tab.value)}
                      title={tab.label}
                      className={`
                        w-full flex items-center gap-2.5 rounded-md transition-colors text-left
                        ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"}
                        ${activeTab === tab.value
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }
                      `}
                    >
                      <tab.icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span className="text-xs truncate">{tab.label}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsContent value="overview"><OverviewTab setActiveTab={handleTabChange} /></TabsContent>
              <TabsContent value="leads"><LeadsTab /></TabsContent>
              <TabsContent value="follow-up"><FollowUpTab /></TabsContent>
              <TabsContent value="deals"><DealsTab /></TabsContent>
              <TabsContent value="inbox"><InboxTab /></TabsContent>
              <TabsContent value="playbooks"><PlaybooksTab /></TabsContent>
              <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
              <TabsContent value="plan"><PlanTab /></TabsContent>
              <TabsContent value="clients"><ClientsTab /></TabsContent>
              <TabsContent value="finances"><FinancesTab /></TabsContent>
              <TabsContent value="tasks"><TasksTab /></TabsContent>
              <TabsContent value="autopilot"><AutopilotTab /></TabsContent>
              <TabsContent value="ai-tools"><AiToolsTab /></TabsContent>
              <TabsContent value="files"><FilesManagerTab /></TabsContent>
              <TabsContent value="equipment"><EquipmentTab /></TabsContent>
              <TabsContent value="partners"><PartnersTab /></TabsContent>
              <TabsContent value="settings"><SettingsTab /></TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Analytics Tab (Scorecard + Forecast merged) ────────────────────

function AnalyticsTab() {
  const [view, setView] = useState<"scorecard" | "forecast">("scorecard");
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          <Button variant={view === "scorecard" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setView("scorecard")}><Target className="w-3 h-3 mr-1" />Scorecard</Button>
          <Button variant={view === "forecast" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setView("forecast")}><TrendingUp className="w-3 h-3 mr-1" />Forecast</Button>
        </div>
      </div>
      {view === "scorecard" ? <ScorecardTab /> : <ForecastTab />}
    </div>
  );
}

// ─── Finances Tab (Revenue + Invoices merged) ───────────────────────

function FinancesTab() {
  const [view, setView] = useState<"revenue" | "invoices">("revenue");
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          <Button variant={view === "revenue" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setView("revenue")}><DollarSign className="w-3 h-3 mr-1" />Revenue</Button>
          <Button variant={view === "invoices" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setView("invoices")}><FileText className="w-3 h-3 mr-1" />Invoices</Button>
        </div>
      </div>
      {view === "revenue" ? <RevenueTab /> : <InvoicesTab />}
    </div>
  );
}

// ─── AI Tools Tab (AI Ops + Prospector + AI Settings merged) ────────

function AiToolsTab() {
  const [view, setView] = useState<"ops" | "prospector" | "config">("ops");
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          <Button variant={view === "ops" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setView("ops")}><MessageSquare className="w-3 h-3 mr-1" />AI Ops</Button>
          <Button variant={view === "prospector" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setView("prospector")}><Globe className="w-3 h-3 mr-1" />Prospector</Button>
          <Button variant={view === "config" ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setView("config")}><Bot className="w-3 h-3 mr-1" />Chat Config</Button>
        </div>
      </div>
      {view === "ops" ? <AiOpsTab /> : view === "prospector" ? <ProspectorTab /> : <AiSettingsTab />}
    </div>
  );
}

// ─── Settings Tab (Team + Users + Security + Integrations + Files + Activity) ─

function SettingsTab() {
  const [section, setSection] = useState<"team" | "users" | "security" | "integrations" | "activity">("team");
  const sections = [
    { value: "team" as const, label: "Team & Business", icon: UserCog },
    { value: "users" as const, label: "Users & Roles", icon: Users },
    { value: "security" as const, label: "Security", icon: Lock },
    { value: "integrations" as const, label: "Integrations", icon: Plug },
    { value: "activity" as const, label: "Activity Log", icon: Activity },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap bg-muted/50 rounded-lg p-0.5">
        {sections.map(s => (
          <Button key={s.value} variant={section === s.value ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setSection(s.value)}>
            <s.icon className="w-3 h-3 mr-1" />{s.label}
          </Button>
        ))}
      </div>
      {section === "team" && <TeamTab />}
      {section === "users" && <UsersTab />}
      {section === "security" && <SecurityTab />}
      {section === "integrations" && <IntegrationsTab />}
      {section === "activity" && <ActivityTab />}
    </div>
  );
}

// ─── Security Tab ────────────────────────────────────────────────────

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const changeMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/admin/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated", description: "Your admin password has been changed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    },
    onError: (err: Error) => { setError(err.message.replace(/^\d+:\s*/, "")); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    if (newPassword === currentPassword) { setError("New password must be different from current password."); return; }
    changeMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h2>
        <p className="text-sm text-muted-foreground mt-1">Update your admin dashboard password</p>
      </div>
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur-pw">Current Password</Label>
              <input id="cur-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-muted rounded-md px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50" placeholder="Enter current password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">New Password</Label>
              <input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-muted rounded-md px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50" placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-muted rounded-md px-3 h-9 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50" placeholder="Re-enter new password" />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={changeMutation.isPending || !currentPassword || !newPassword || !confirmPassword}>
              {changeMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────

interface BriefingData {
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

function OverviewTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { data: briefing } = useQuery<BriefingData>({ queryKey: ["/api/dashboard/briefing"] });
  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: activityData = [] } = useQuery<ActivityEntry[]>({ queryKey: ["/api/activity"] });
  const { data: revenueData = [] } = useQuery<RevenueEntry[]>({ queryKey: ["/api/revenue"] });
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: threads = [] } = useQuery<EmailThread[]>({ queryKey: ["/api/email/threads"] });
  const { data: schedule = [] } = useQuery<ScheduleItem[]>({ queryKey: ["/api/schedule"] });

  const b = briefing;
  const urgentCount = (b?.overdueTasks.length || 0) + (b?.followUpsDue.length || 0) + (b?.staleLeads.length || 0);
  const revenueChange = b && b.revenue.lastMonth > 0 ? Math.round(((b.revenue.thisMonth - b.revenue.lastMonth) / b.revenue.lastMonth) * 100) : 0;

  // Computed metrics
  const maintenanceClients = clients.filter(c => c.maintenance !== "none").length;
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === "won").length;
  const lostLeads = leads.filter(l => l.status === "lost").length;
  const closedLeads = wonLeads + lostLeads;
  const winRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;

  // Active pipeline leads (not won/lost/nurture) for the pipeline section
  const activeLeads = leads.filter(l => !["won", "lost", "nurture"].includes(l.status));

  // AI-recommended quick actions per lead
  const getAiActions = (lead: Lead): { label: string; icon: React.ElementType; action: string }[] => {
    const actions: { label: string; icon: React.ElementType; action: string }[] = [];
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / 86400000);
    if (lead.status === "new") {
      actions.push({ label: "Call", icon: Phone, action: "leads" });
      actions.push({ label: "Email", icon: Mail, action: "inbox" });
    } else if (lead.status === "contacted" || lead.status === "qualified") {
      actions.push({ label: "Request Statement", icon: FileText, action: "leads" });
      if (daysSinceUpdate > 3) actions.push({ label: "Follow Up", icon: Phone, action: "leads" });
    } else if (lead.status === "statement-requested") {
      actions.push({ label: "Check Status", icon: Phone, action: "leads" });
    } else if (lead.status === "statement-received" || lead.status === "analysis-delivered") {
      actions.push({ label: "Send Proposal", icon: Send, action: "leads" });
    } else if (lead.status === "proposal-sent" || lead.status === "negotiation") {
      actions.push({ label: "Follow Up", icon: Phone, action: "leads" });
      actions.push({ label: "Close Deal", icon: CheckCircle, action: "leads" });
    }
    if (daysSinceUpdate > 5 && !actions.find(a => a.label === "Follow Up")) {
      actions.push({ label: "Re-engage", icon: RefreshCw, action: "leads" });
    }
    return actions.slice(0, 2);
  };

  // Per-user pending tasks
  const todayStr = today();
  const pendingTasks = tasks.filter(t => !t.completed);

  // Mini weekly calendar
  const weekDays = useMemo(() => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day.toISOString().split("T")[0];
    });
  }, []);

  // Unread inbox threads
  const unreadThreads = threads.filter(t => t.unread);
  const recentThreads = threads.slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-4">
      {/* Header row: greeting + quick actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">{greeting}</h2>
          <p className="text-sm text-muted-foreground">
            {urgentCount > 0
              ? `${urgentCount} item${urgentCount > 1 ? "s" : ""} need attention`
              : "All clear — time to grow the pipeline."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs" onClick={() => setActiveTab("leads")}><Plus className="w-3.5 h-3.5 mr-1" />New Lead</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setActiveTab("finances")}><DollarSign className="w-3.5 h-3.5 mr-1" />Log Revenue</Button>
        </div>
      </div>

      {/* KPI Row — 5 metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="overflow-visible border-border/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">Pipeline</span>
              <div className="w-7 h-7 rounded-md bg-blue-400/10 flex items-center justify-center"><UserPlus className="w-3.5 h-3.5 text-blue-400" /></div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight">{b?.pipeline.totalActive || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{b?.pipeline.wonThisMonth || 0} won this month</p>
          </CardContent>
        </Card>
        <Card className="overflow-visible border-border/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">Clients</span>
              <div className="w-7 h-7 rounded-md bg-emerald-400/10 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-emerald-400" /></div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight">{clients.length}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{maintenanceClients} on maintenance</p>
          </CardContent>
        </Card>
        <Card className="overflow-visible border-border/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">MRR</span>
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-primary" /></div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight">${(b?.revenue.mrr || 0).toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{maintenanceClients} active plan{maintenanceClients !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card className="overflow-visible border-border/50">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">Revenue</span>
              <div className="w-7 h-7 rounded-md bg-chart-4/10 flex items-center justify-center"><DollarSign className="w-3.5 h-3.5 text-chart-4" /></div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight">${(b?.revenue.thisMonth || 0).toLocaleString()}</div>
            <p className="text-[10px] mt-0.5">
              {revenueChange !== 0 ? (
                <span className={revenueChange > 0 ? "text-emerald-400" : "text-red-400"}>
                  {revenueChange > 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                  {Math.abs(revenueChange)}% vs last month
                </span>
              ) : <span className="text-muted-foreground">This month</span>}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-visible border-border/50 col-span-2 sm:col-span-1">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">Win Rate</span>
              <div className="w-7 h-7 rounded-md bg-purple-400/10 flex items-center justify-center"><Target className="w-3.5 h-3.5 text-purple-400" /></div>
            </div>
            <div className="text-2xl font-extrabold tracking-tight">{winRate}%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{wonLeads}W / {lostLeads}L of {totalLeads} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Pipeline Leads with AI Actions + Team Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Leads with AI Quick Actions */}
        <Card className="overflow-visible border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />Pipeline Leads
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-1">{activeLeads.length}</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("leads")}>View All <ArrowUpRight className="w-3 h-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 max-h-[380px] overflow-y-auto">
            {activeLeads.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No active leads in pipeline</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs h-7" onClick={() => setActiveTab("leads")}><Plus className="w-3 h-3 mr-1.5" />Add Lead</Button>
              </div>
            ) : (
              <div className="space-y-1">
                {activeLeads.slice(0, 10).map(lead => {
                  const cfg = PIPELINE_CONFIG[lead.status as PipelineStage];
                  const actions = getAiActions(lead);
                  const daysSinceUpdate = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / 86400000);
                  return (
                    <div key={lead.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/30 group">
                      <div className={`w-1.5 h-full min-h-[36px] rounded-full shrink-0 ${cfg?.bg.split(" ")[0] || "bg-muted"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">{lead.business || lead.name}</span>
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${cfg?.color || ""}`}>{cfg?.short || lead.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{lead.name}{lead.vertical ? ` · ${VERTICAL_CONFIG[lead.vertical] || lead.vertical}` : ""}</span>
                          {daysSinceUpdate > 3 && <span className="text-[9px] text-yellow-500">{daysSinceUpdate}d ago</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actions.map((a, i) => (
                          <Button key={i} variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setActiveTab(a.action)}>
                            <a.icon className="w-3 h-3 mr-1" />{a.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {activeLeads.length > 10 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-2 cursor-pointer hover:text-primary" onClick={() => setActiveTab("leads")}>
                    +{activeLeads.length - 10} more leads
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color-coded Task Lists per Team Member */}
        <Card className="overflow-visible border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />Team Tasks
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-1">{pendingTasks.length} pending</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("tasks")}>All Tasks <ArrowUpRight className="w-3 h-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 max-h-[380px] overflow-y-auto">
            <div className="space-y-3">
              {TEAM_MEMBERS_LIST.map(member => {
                const memberTasks = pendingTasks.filter(t => t.assignee === member.value);
                const overdue = memberTasks.filter(t => t.dueDate && t.dueDate < todayStr);
                return (
                  <div key={member.value}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${member.color}`} />
                      <span className="text-xs font-semibold">{member.label}</span>
                      <span className="text-[10px] text-muted-foreground">{memberTasks.length} task{memberTasks.length !== 1 ? "s" : ""}</span>
                      {overdue.length > 0 && <Badge variant="destructive" className="text-[9px] px-1 py-0">{overdue.length} overdue</Badge>}
                    </div>
                    {memberTasks.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground pl-5 pb-1">No tasks assigned</p>
                    ) : (
                      <div className="space-y-0.5 pl-1">
                        {memberTasks.slice(0, 4).map(task => (
                          <div key={task.id} className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/30 cursor-pointer border-l-2`} style={{ borderLeftColor: `var(--${member.color.replace("bg-", "").replace("-500", "-400")}, ${member.color === "bg-blue-500" ? "#60a5fa" : member.color === "bg-pink-500" ? "#f472b6" : member.color === "bg-emerald-500" ? "#34d399" : "#fbbf24"})` }} onClick={() => setActiveTab("tasks")}>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-yellow-400" : "bg-blue-400"}`} />
                            <span className="text-[11px] truncate flex-1">{task.title}</span>
                            {task.dueDate && <span className={`text-[9px] shrink-0 ${task.dueDate < todayStr ? "text-destructive font-medium" : "text-muted-foreground"}`}>{task.dueDate < todayStr ? "Overdue" : task.dueDate === todayStr ? "Today" : task.dueDate}</span>}
                          </div>
                        ))}
                        {memberTasks.length > 4 && <p className="text-[9px] text-muted-foreground pl-4">+{memberTasks.length - 4} more</p>}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Unassigned tasks */}
              {(() => {
                const unassigned = pendingTasks.filter(t => !t.assignee);
                if (unassigned.length === 0) return null;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                      <span className="text-xs font-semibold text-muted-foreground">Unassigned</span>
                      <span className="text-[10px] text-muted-foreground">{unassigned.length}</span>
                    </div>
                    <div className="space-y-0.5 pl-1">
                      {unassigned.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/30 cursor-pointer border-l-2 border-gray-400/40" onClick={() => setActiveTab("tasks")}>
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-yellow-400" : "bg-blue-400"}`} />
                          <span className="text-[11px] truncate flex-1">{task.title}</span>
                        </div>
                      ))}
                      {unassigned.length > 3 && <p className="text-[9px] text-muted-foreground pl-4">+{unassigned.length - 3} more</p>}
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Inbox Quick Actions + Mini Weekly Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inbox with Quick Actions */}
        <Card className="overflow-visible border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />Inbox
                {unreadThreads.length > 0 && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 ml-1">{unreadThreads.length} new</Badge>}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("inbox")}>Open Inbox <ArrowUpRight className="w-3 h-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentThreads.length === 0 ? (
              <div className="text-center py-6">
                <Mail className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentThreads.map(thread => {
                  const sourceColors: Record<string, string> = {
                    direct: "text-blue-400", "contact-form": "text-emerald-400",
                    outreach: "text-purple-400", "outreach-reply": "text-orange-400",
                    "email_inbound": "text-cyan-400", "statement-review": "text-amber-400",
                    "lead-magnet": "text-pink-400",
                  };
                  const sourceLabels: Record<string, string> = {
                    direct: "Direct", "contact-form": "Form",
                    outreach: "Outreach", "outreach-reply": "Reply",
                    "email_inbound": "Email", "statement-review": "Statement",
                    "lead-magnet": "Lead Magnet",
                  };
                  return (
                    <div key={thread.id} className={`flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/30 cursor-pointer group ${thread.unread ? "bg-primary/5" : ""}`} onClick={() => setActiveTab("inbox")}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${thread.unread ? "bg-primary" : "bg-transparent"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs truncate ${thread.unread ? "font-bold" : "font-medium"}`}>{thread.contactName || thread.contactEmail}</span>
                          <span className={`text-[9px] shrink-0 ${sourceColors[thread.source] || "text-muted-foreground"}`}>{sourceLabels[thread.source] || thread.source}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{thread.subject || "(no subject)"}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] text-muted-foreground">{timeAgo(thread.lastMessageAt)}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setActiveTab("inbox"); }}>
                            <Send className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {threads.length > 5 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1 cursor-pointer hover:text-primary" onClick={() => setActiveTab("inbox")}>
                    View all {threads.length} conversations
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mini Weekly Calendar */}
        <Card className="overflow-visible border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />This Week
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("tasks")}>Full Calendar <ArrowUpRight className="w-3 h-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={`hdr-${i}`} className="text-[9px] text-center text-muted-foreground font-semibold pb-1">{d}</div>)}
              {weekDays.map(day => {
                const dayTasks = tasks.filter(t => t.dueDate === day && !t.completed);
                const daySchedule = schedule.filter(s => s.date === day && s.status !== "completed");
                const isToday = day === todayStr;
                const dayNum = new Date(day + "T12:00:00").getDate();
                const allItems = [
                  ...daySchedule.map(s => ({ id: s.id, label: s.title, time: s.time, type: "schedule" as const, category: s.category })),
                  ...dayTasks.map(t => ({ id: t.id, label: t.title, time: "", type: "task" as const, category: t.priority })),
                ];
                const MINI_SCHED_COLORS: Record<string, string> = { training: "bg-purple-400/20 text-purple-300", outreach: "bg-blue-400/20 text-blue-300", admin: "bg-gray-400/20 text-gray-400", meeting: "bg-emerald-400/20 text-emerald-300", "follow-up": "bg-orange-400/20 text-orange-300", development: "bg-cyan-400/20 text-cyan-300", general: "bg-gray-400/20 text-gray-400" };
                return (
                  <div key={day} className={`min-h-[90px] border rounded-md p-1 ${isToday ? "border-primary/50 bg-primary/5" : "border-border/30"}`}>
                    <div className={`text-[10px] font-bold mb-0.5 text-center ${isToday ? "text-primary" : "text-muted-foreground"}`}>{dayNum}</div>
                    <div className="space-y-0.5">
                      {allItems.slice(0, 4).map(item => (
                        <div key={item.id} className={`text-[8px] px-0.5 py-0.5 rounded truncate cursor-pointer ${
                          item.type === "schedule"
                            ? (MINI_SCHED_COLORS[item.category] || MINI_SCHED_COLORS.general)
                            : item.category === "high" ? "bg-red-400/15 text-red-400" : item.category === "medium" ? "bg-yellow-400/15 text-yellow-500" : "bg-blue-400/15 text-blue-400"
                        }`} title={item.label} onClick={() => setActiveTab("tasks")}>
                          {item.time ? `${item.time} ` : ""}{item.label.slice(0, 12)}
                        </div>
                      ))}
                      {allItems.length > 4 && <div className="text-[8px] text-muted-foreground text-center">+{allItems.length - 4}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Revenue + Recent Wins + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Breakdown */}
        <Card className="overflow-visible border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-chart-4" />Revenue</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("finances")}>Details <ArrowUpRight className="w-3 h-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3 mb-3">
              <div className="text-2xl font-extrabold tracking-tight">${(b?.revenue.thisMonth || 0).toLocaleString()}</div>
              <p className="text-[10px] pb-0.5">
                {revenueChange !== 0 ? (
                  <span className={revenueChange > 0 ? "text-emerald-400" : "text-red-400"}>
                    {revenueChange > 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                    {Math.abs(revenueChange)}%
                  </span>
                ) : <span className="text-muted-foreground">This month</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-muted/20 text-center">
                <div className="text-sm font-bold">${(b?.revenue.mrr || 0).toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">MRR</div>
              </div>
              <div className="p-2 rounded-lg bg-muted/20 text-center">
                <div className="text-sm font-bold">{maintenanceClients}</div>
                <div className="text-[9px] text-muted-foreground">Active Plans</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 90-Day Plan progress */}
        <Card className="overflow-visible border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab("plan")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-primary" />90-Day Plan</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-3 mb-3">
              <div className="text-3xl font-extrabold tracking-tight">{b?.planProgress.percent || 0}%</div>
              <p className="text-[10px] text-muted-foreground pb-1">{b?.planProgress.completed || 0} of {b?.planProgress.total || 0} done</p>
            </div>
            <Progress value={b?.planProgress.percent || 0} className="h-2.5" />
            <p className="text-[10px] text-primary font-medium mt-3 text-right">View Plan →</p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="overflow-visible border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-chart-4" />Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("settings")}>All <ArrowUpRight className="w-3 h-3 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activityData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No activity yet</p>
            ) : (
              <div className="space-y-1">
                {activityData.slice(0, 6).map(a => (
                  <div key={a.id} className="flex items-center gap-2 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ACTIVITY_COLORS[a.type] || "bg-gray-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] truncate"><span className="font-medium">{a.action}</span> — {a.details}</p>
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0">{timeAgo(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Leads Tab ───────────────────────────────────────────────────────

function LeadsTab() {
  const { data: leads = [], refetch } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PipelineStage | "all">("all");
  const [filterSource, setFilterSource] = useState<LeadSource | "all">("all");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Lead>) => { const res = await apiRequest("POST", "/api/leads", data); return res.json(); },
    onSuccess: () => { refetch(); toast({ title: "Lead added" }); setShowForm(false); setEditingLead(null); },
    onError: () => { toast({ title: "Failed to add lead", variant: "destructive" }); },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Lead> & { id: string }) => { const res = await apiRequest("PATCH", `/api/leads/${id}`, data); return res.json(); },
    onSuccess: () => { refetch(); toast({ title: "Lead updated" }); setShowForm(false); setEditingLead(null); },
    onError: () => { toast({ title: "Failed to update lead", variant: "destructive" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/leads/${id}`); },
    onSuccess: () => { refetch(); toast({ title: "Lead deleted" }); },
    onError: () => { toast({ title: "Failed to delete lead", variant: "destructive" }); },
  });
  const convertMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      const clientRes = await apiRequest("POST", "/api/clients", { name: lead.name, business: lead.business, phone: lead.phone, email: lead.email, package: lead.package, maintenance: "none", websiteUrl: "", websiteStatus: "not-started", terminalId: "", monthlyVolume: 0, startDate: today(), notes: lead.notes });
      const client = await clientRes.json();
      await apiRequest("PATCH", `/api/leads/${lead.id}`, { status: "won" });
      // Auto-create onboarding tasks
      try { await apiRequest("POST", "/api/automations/onboard-client", { clientId: client.id, clientName: lead.business || lead.name }); } catch { /* non-critical */ }
      return client;
    },
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: ["/api/clients"] }); queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }); toast({ title: "Lead converted to client", description: "Onboarding tasks created automatically" }); },
    onError: () => { toast({ title: "Failed to convert lead", variant: "destructive" }); },
  });

  const filteredLeads = useMemo(() => leads
    .filter((l) => filterStatus === "all" || l.status === filterStatus)
    .filter((l) => filterSource === "all" || l.source === filterSource)
    .filter((l) => !search || [l.name, l.business, l.email, l.phone, l.currentProcessor].some((f) => f?.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [leads, filterStatus, filterSource, search]);

  const handleSave = (form: Partial<Lead>) => {
    if (editingLead) updateMutation.mutate({ ...form, id: editingLead.id } as Lead & { id: string });
    else createMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Lead Pipeline</h2>
          <p className="text-xs text-muted-foreground">{leads.length} total — {leads.filter((l) => !["won", "lost", "nurture"].includes(l.status)).length} active pipeline</p>
        </div>
        <Button size="sm" onClick={() => { setEditingLead(null); setShowForm(true); }}><Plus className="w-3.5 h-3.5" />Add Lead</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as PipelineStage | "all")}>
          <SelectTrigger className="w-full sm:w-40 h-9"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {(Object.keys(PIPELINE_CONFIG) as PipelineStage[]).map((s) => <SelectItem key={s} value={s}>{PIPELINE_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={(v) => setFilterSource(v as LeadSource | "all")}>
          <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {(Object.keys(SOURCE_CONFIG) as LeadSource[]).map((s) => <SelectItem key={s} value={s}>{SOURCE_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredLeads.length === 0 ? (
        <Card className="overflow-visible border-dashed"><CardContent className="p-8 text-center"><UserPlus className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{leads.length === 0 ? "No leads yet. Click 'Add Lead' to start." : "No leads match filters."}</p></CardContent></Card>
      ) : (
        <div className="space-y-2">{filteredLeads.map((lead) => (
          <Card key={lead.id} className="overflow-visible border-border/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{lead.business || lead.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${PIPELINE_CONFIG[lead.status]?.bg || ""} ${PIPELINE_CONFIG[lead.status]?.color || ""}`}>{PIPELINE_CONFIG[lead.status]?.short || lead.status}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${SOURCE_CONFIG[lead.source]?.color || ""}`}>{SOURCE_CONFIG[lead.source]?.label || lead.source}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${PACKAGE_CONFIG[lead.package as PackageType]?.color || ""}`}>{PACKAGE_CONFIG[lead.package as PackageType]?.label || lead.package}</Badge>
                  </div>
                  {lead.business && lead.name && <p className="text-xs text-muted-foreground">{lead.name}{lead.decisionMakerName ? ` — DM: ${lead.decisionMakerName}${lead.decisionMakerRole ? ` (${lead.decisionMakerRole})` : ""}` : ""}</p>}
                  <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="w-3 h-3" />{lead.phone}</a>}
                    {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground truncate max-w-[180px] sm:max-w-none"><Mail className="w-3 h-3" />{lead.email}</a>}
                    {lead.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.address}</span>}
                    {lead.vertical && <span className="text-[10px]">{VERTICAL_CONFIG[lead.vertical] || lead.vertical}</span>}
                    {lead.currentProcessor && <span className="text-[10px]">Processor: {lead.currentProcessor}</span>}
                    {lead.currentEquipment && <span className="text-[10px]">POS: {lead.currentEquipment}</span>}
                    {lead.monthlyVolume && <span className="text-[10px]">Vol: {lead.monthlyVolume}</span>}
                    {lead.bestContactMethod && lead.bestContactMethod !== "phone" && <Badge variant="outline" className="text-[9px]">{CONTACT_METHODS[lead.bestContactMethod] || lead.bestContactMethod}</Badge>}
                    {lead.attachments?.length > 0 && <span className="flex items-center gap-1 text-[10px]"><Paperclip className="w-3 h-3" />{lead.attachments.length} file{lead.attachments.length > 1 ? "s" : ""}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                  {lead.nextStep && <p className="text-xs text-primary mt-1.5">Next: {lead.nextStep}{lead.nextStepDate ? ` (${lead.nextStepDate})` : ""}</p>}
                  {lead.painPoints && <p className="text-[10px] text-muted-foreground mt-1">Pain: {lead.painPoints}</p>}
                  {lead.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lead.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  {!["won", "lost"].includes(lead.status) && (
                    <Select value={lead.status} onValueChange={(v) => updateMutation.mutate({ id: lead.id, status: v } as any)}>
                      <SelectTrigger className="h-7 w-24 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(PIPELINE_CONFIG) as PipelineStage[]).map((s) => <SelectItem key={s} value={s} className="text-xs">{PIPELINE_CONFIG[s].short}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {!["won", "lost"].includes(lead.status) && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" onClick={() => convertMutation.mutate(lead)} title="Convert to client"><CheckCircle className="w-3.5 h-3.5" /></Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingLead(lead); setShowForm(true); }}><Edit3 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(lead.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}
      <LeadFormDialog open={showForm} onClose={() => { setShowForm(false); setEditingLead(null); }} onSave={handleSave} lead={editingLead} />
    </div>
  );
}

function LeadFormDialog({ open, onClose, onSave, lead }: { open: boolean; onClose: () => void; onSave: (form: Partial<Lead>) => void; lead: Lead | null; }) {
  const [form, setForm] = useState<Partial<Lead>>({});
  useEffect(() => {
    if (open) setForm(lead || { name: "", business: "", address: "", phone: "", email: "", decisionMakerName: "", decisionMakerRole: "", bestContactMethod: "phone", package: "terminal", status: "new", source: "direct", vertical: "other", currentProcessor: "", currentEquipment: "", monthlyVolume: "", painPoints: "", nextStep: "", nextStepDate: "", attachments: [], notes: "" });
  }, [open, lead]);
  const set = (key: keyof Lead, value: any) => setForm((p) => ({ ...p, [key]: value }));
  const attachments = (form.attachments || []) as Array<{ name: string; url: string }>;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle><DialogDescription>Track a sales opportunity through the pipeline</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Contact Name *</Label><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Business Name *</Label><Input value={form.business || ""} onChange={(e) => set("business", e.target.value)} placeholder="Aloha Cafe" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Business Address</Label><Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St, City, State" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="808-555-1234" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={form.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="john@aloha.com" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Decision Maker</Label><Input value={form.decisionMakerName || ""} onChange={(e) => set("decisionMakerName", e.target.value)} placeholder="Owner name" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Role</Label><Input value={form.decisionMakerRole || ""} onChange={(e) => set("decisionMakerRole", e.target.value)} placeholder="Owner, Manager..." /></div>
            <div className="space-y-1.5"><Label className="text-xs">Best Contact</Label>
              <Select value={form.bestContactMethod || "phone"} onValueChange={(v) => set("bestContactMethod", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CONTACT_METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Lead Source</Label>
              <Select value={form.source || "direct"} onValueChange={(v) => set("source", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(SOURCE_CONFIG) as LeadSource[]).map((s) => <SelectItem key={s} value={s}>{SOURCE_CONFIG[s].label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Package</Label>
              <Select value={form.package || "terminal"} onValueChange={(v) => set("package", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="terminal">Terminal ($399)</SelectItem><SelectItem value="trial">30-Day Trial</SelectItem><SelectItem value="online">Online (Free)</SelectItem><SelectItem value="combo">Combo Bundle</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Pipeline Stage</Label>
              <Select value={form.status || "new"} onValueChange={(v) => set("status", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(PIPELINE_CONFIG) as PipelineStage[]).map((s) => <SelectItem key={s} value={s}>{PIPELINE_CONFIG[s].label}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Business Vertical</Label>
              <Select value={form.vertical || "other"} onValueChange={(v) => set("vertical", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(VERTICAL_CONFIG) as Vertical[]).map((v) => <SelectItem key={v} value={v}>{VERTICAL_CONFIG[v]}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Current Processor</Label><Input value={form.currentProcessor || ""} onChange={(e) => set("currentProcessor", e.target.value)} placeholder="Square, Clover, etc." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Current Equipment/POS</Label><Input value={form.currentEquipment || ""} onChange={(e) => set("currentEquipment", e.target.value)} placeholder="Clover Mini, Verifone..." /></div>
            <div className="space-y-1.5"><Label className="text-xs">Est. Monthly Volume</Label><Input value={form.monthlyVolume || ""} onChange={(e) => set("monthlyVolume", e.target.value)} placeholder="$5K-$10K" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Pain Points</Label><Input value={form.painPoints || ""} onChange={(e) => set("painPoints", e.target.value)} placeholder="High fees, old terminal, chargebacks, funding delays..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Next Step</Label><Input value={form.nextStep || ""} onChange={(e) => set("nextStep", e.target.value)} placeholder="Statement review call" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Next Step Date</Label><Input type="date" value={form.nextStepDate || ""} onChange={(e) => set("nextStepDate", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between"><Label className="text-xs">Attachments</Label>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => set("attachments", [...attachments, { name: "", url: "" }])}><Plus className="w-3 h-3" />Add</Button>
            </div>
            {attachments.map((att, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input className="flex-1 h-8 text-xs" value={att.name} onChange={(e) => { const a = [...attachments]; a[i] = { ...a[i], name: e.target.value }; set("attachments", a); }} placeholder="Statement PDF" />
                <Input className="flex-1 h-8 text-xs" value={att.url} onChange={(e) => { const a = [...attachments]; a[i] = { ...a[i], url: e.target.value }; set("attachments", a); }} placeholder="https://drive.google.com/..." />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => set("attachments", attachments.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} className="resize-none text-sm" placeholder="Details, observations..." /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)} disabled={!form.name || !form.business}><Save className="w-3.5 h-3.5" />{lead ? "Update" : "Add Lead"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reusable Script Card ────────────────────────────────────────────

function ScriptCard({ title, content, scriptKey, pinned, onPin, onUnpin, onRefresh, isRefreshing }: {
  title: string; content: string; scriptKey?: string;
  pinned?: PinnedPitch | null; onPin?: (key: string, content: string) => void;
  onUnpin?: (id: string) => void; onRefresh?: (key: string) => void; isRefreshing?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const displayContent = pinned?.customContent || content;
  const handleCopy = () => { navigator.clipboard.writeText(displayContent); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Card className={`overflow-visible border-border/50 ${pinned ? "ring-1 ring-primary/30" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            {pinned && <Pin className="w-3 h-3 text-primary" />}{title}
          </span>
          <div className="flex items-center gap-1">
            {scriptKey && onRefresh && (
              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => onRefresh(scriptKey)} disabled={isRefreshing} title="Get AI variation">
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
            {scriptKey && !pinned && onPin && (
              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5" onClick={() => onPin(scriptKey, displayContent)} title="Pin this pitch">
                <Pin className="w-3 h-3" />
              </Button>
            )}
            {pinned && onUnpin && (
              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5 text-primary" onClick={() => onUnpin(pinned.id)} title="Unpin">
                <PinOff className="w-3 h-3" />
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={handleCopy}>
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </Button>
          </div>
        </div>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-3 leading-relaxed">{displayContent}</pre>
      </CardContent>
    </Card>
  );
}

// ─── Playbooks Tab ──────────────────────────────────────────────────

function PlaybooksTab() {
  const { data: partners = [], refetch: refetchPartners } = useQuery<ReferralPartner[]>({ queryKey: ["/api/referral-partners"] });
  const { data: checks = [], refetch: refetchChecks } = useQuery<PlaybookCheckItem[]>({ queryKey: ["/api/playbook-checks"] });
  const { data: pinnedPitches = [], refetch: refetchPins } = useQuery<PinnedPitch[]>({ queryKey: ["/api/pinned-pitches"] });
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: "", niche: "", clientTypes: "", referralTerms: "", introMethod: "", nextCheckIn: "" });
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const { toast } = useToast();

  const getPinned = (key: string) => pinnedPitches.find(p => p.scriptKey === key) || null;

  const pinMutation = useMutation({
    mutationFn: async ({ scriptKey, customContent }: { scriptKey: string; customContent: string }) => {
      const r = await apiRequest("POST", "/api/pinned-pitches", { scriptKey, customContent }); return r.json();
    },
    onSuccess: () => { refetchPins(); toast({ title: "Pitch pinned" }); },
  });

  const unpinMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/pinned-pitches/${id}`); },
    onSuccess: () => { refetchPins(); toast({ title: "Pitch unpinned" }); },
  });

  const handleRefresh = async (scriptKey: string) => {
    setRefreshing(scriptKey);
    try {
      const r = await apiRequest("POST", "/api/ai-ops/chat", {
        message: `Generate a fresh variation of the "${scriptKey}" sales pitch for a merchant services company. Keep the same intent and key selling points (zero-fee processing, statement review, no obligation) but change the wording to sound natural and different. Return ONLY the pitch text, nothing else.`,
      });
      const data = await r.json();
      if (data.reply) {
        await apiRequest("POST", "/api/pinned-pitches", { scriptKey, customContent: data.reply });
        refetchPins();
        toast({ title: "Fresh pitch generated & pinned" });
      }
    } catch { toast({ title: "Failed to refresh", variant: "destructive" }); }
    setRefreshing(null);
  };

  const createPartnerMutation = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/referral-partners", data); return r.json(); },
    onSuccess: () => { refetchPartners(); toast({ title: "Partner added" }); setShowPartnerForm(false); setPartnerForm({ name: "", niche: "", clientTypes: "", referralTerms: "", introMethod: "", nextCheckIn: "" }); },
  });
  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/referral-partners/${id}`); },
    onSuccess: () => { refetchPartners(); },
  });
  const toggleCheckMutation = useMutation({
    mutationFn: async ({ id, channel, label, completed }: { id: string; channel: string; label: string; completed: boolean }) => {
      const existing = checks.find((c) => c.id === id);
      if (existing) { await apiRequest("PATCH", `/api/playbook-checks/${id}`, { completed }); }
      else { await apiRequest("POST", "/api/playbook-checks", { id, channel, label, completed }); }
    },
    onSuccess: () => { refetchChecks(); },
  });

  const isChecked = (id: string) => checks.find((c) => c.id === id)?.completed || false;

  const referralChecklist = [
    { id: "ref-1", label: "Identify 20 referral partner targets (local + niche)" },
    { id: "ref-2", label: "Draft referral agreement with commission terms" },
    { id: "ref-3", label: "Create intro email template for partners" },
    { id: "ref-4", label: "Set up partner tracking field in CRM" },
    { id: "ref-5", label: "Schedule first 5 partner outreach meetings" },
  ];

  const leadMagnetResources = [
    { id: "lm-1", label: "Top 10 Things to Check on Your Merchant Statement" },
    { id: "lm-2", label: "Cash Discount Program Explained: Is It Right for Your Business?" },
    { id: "lm-3", label: "Payment Security Checklist for Small Businesses" },
    { id: "lm-4", label: "Industry-Specific Rate Comparison Guide" },
  ];

  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Channel Playbooks</h2><p className="text-xs text-muted-foreground mt-1">Scripts, workflows, and checklists for each prospecting channel</p></div>

      <Accordion type="multiple" defaultValue={["referral"]} className="space-y-2">
        {/* Referral Partners */}
        <AccordionItem value="referral" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold py-3"><span className="flex items-center gap-2"><span className="w-6 h-6 rounded bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-xs font-bold">R</span>Referral Partner Program</span></AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <ScriptCard title="Partner Outreach Script" content={PLAYBOOK_SCRIPTS.referral.outreach} scriptKey="referral.outreach" pinned={getPinned("referral.outreach")} onPin={(k, c) => pinMutation.mutate({ scriptKey: k, customContent: c })} onUnpin={(id) => unpinMutation.mutate(id)} onRefresh={handleRefresh} isRefreshing={refreshing === "referral.outreach"} />
            <div>
              <p className="text-xs font-semibold mb-2">Partner Onboarding Checklist</p>
              <div className="space-y-1.5">{referralChecklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox checked={isChecked(item.id)} onCheckedChange={(v) => toggleCheckMutation.mutate({ id: item.id, channel: "referral", label: item.label, completed: !!v })} />
                  <span className={`text-xs ${isChecked(item.id) ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                </div>
              ))}</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">Active Partners ({partners.length})</p>
                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => setShowPartnerForm(true)}><Plus className="w-3 h-3" />Add Partner</Button>
              </div>
              {partners.length === 0 ? <p className="text-xs text-muted-foreground py-2">No partners yet. Start by adding your first referral partner.</p> : (
                <div className="space-y-1.5">{partners.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border/30">
                    <div><p className="text-xs font-medium">{p.name}</p><p className="text-[10px] text-muted-foreground">{p.niche}{p.referralTerms ? ` — ${p.referralTerms}` : ""}{p.nextCheckIn ? ` — Next check-in: ${p.nextCheckIn}` : ""}</p></div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deletePartnerMutation.mutate(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}</div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Networking */}
        <AccordionItem value="networking" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold py-3"><span className="flex items-center gap-2"><span className="w-6 h-6 rounded bg-blue-400/10 flex items-center justify-center text-blue-400 text-xs font-bold">N</span>Networking & Community Presence</span></AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <ScriptCard title="30-Second Elevator Pitch" content={PLAYBOOK_SCRIPTS.networking.elevator} scriptKey="networking.elevator" pinned={getPinned("networking.elevator")} onPin={(k, c) => pinMutation.mutate({ scriptKey: k, customContent: c })} onUnpin={(id) => unpinMutation.mutate(id)} onRefresh={handleRefresh} isRefreshing={refreshing === "networking.elevator"} />
            <Card className="overflow-visible border-border/50 bg-blue-400/5">
              <CardContent className="p-3">
                <p className="text-xs font-semibold mb-1">Event Reminders</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>- Always bring a "Statement Review Offer" card and QR code to lead magnet</li>
                  <li>- Focus on relationship + credibility, not rate pitching</li>
                  <li>- Target: Chamber of Commerce, BNI, industry events</li>
                  <li>- Weekly cadence: 1 networking event/week</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Social Outreach */}
        <AccordionItem value="social" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold py-3"><span className="flex items-center gap-2"><span className="w-6 h-6 rounded bg-pink-400/10 flex items-center justify-center text-pink-400 text-xs font-bold">S</span>Social Media Outreach</span></AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <ScriptCard title="DM Script (After Engagement)" content={PLAYBOOK_SCRIPTS.social.dm} scriptKey="social.dm" pinned={getPinned("social.dm")} onPin={(k, c) => pinMutation.mutate({ scriptKey: k, customContent: c })} onUnpin={(id) => unpinMutation.mutate(id)} onRefresh={handleRefresh} isRefreshing={refreshing === "social.dm"} />
            <Card className="overflow-visible border-border/50 bg-pink-400/5">
              <CardContent className="p-3">
                <p className="text-xs font-semibold mb-1">Content That Converts</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>- Educational posts about hidden fees and cash discount programs</li>
                  <li>- Payment security tips and updates</li>
                  <li>- Fee comparisons and success stories (with permission)</li>
                  <li>- Cadence: 3 posts/week + 10 targeted comments/day</li>
                </ul>
                <p className="text-xs font-semibold mt-2 mb-1">Platforms</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>- LinkedIn: insights + industry group engagement</li>
                  <li>- Instagram: visuals, fee comparisons, success stories</li>
                  <li>- Facebook: local business groups (help first, pitch later)</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Direct Prospecting */}
        <AccordionItem value="direct" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold py-3"><span className="flex items-center gap-2"><span className="w-6 h-6 rounded bg-orange-400/10 flex items-center justify-center text-orange-400 text-xs font-bold">D</span>Direct Prospecting</span></AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <ScriptCard title="Cold Call Script (30 sec)" content={PLAYBOOK_SCRIPTS.direct.coldCall} scriptKey="direct.coldCall" pinned={getPinned("direct.coldCall")} onPin={(k, c) => pinMutation.mutate({ scriptKey: k, customContent: c })} onUnpin={(id) => unpinMutation.mutate(id)} onRefresh={handleRefresh} isRefreshing={refreshing === "direct.coldCall"} />
            <ScriptCard title="Walk-In Opener" content={PLAYBOOK_SCRIPTS.direct.walkIn} scriptKey="direct.walkIn" pinned={getPinned("direct.walkIn")} onPin={(k, c) => pinMutation.mutate({ scriptKey: k, customContent: c })} onUnpin={(id) => unpinMutation.mutate(id)} onRefresh={handleRefresh} isRefreshing={refreshing === "direct.walkIn"} />
            <ScriptCard title="Personalized Email Template" content={PLAYBOOK_SCRIPTS.direct.email} scriptKey="direct.email" pinned={getPinned("direct.email")} onPin={(k, c) => pinMutation.mutate({ scriptKey: k, customContent: c })} onUnpin={(id) => unpinMutation.mutate(id)} onRefresh={handleRefresh} isRefreshing={refreshing === "direct.email"} />
            <Card className="overflow-visible border-border/50 bg-orange-400/5">
              <CardContent className="p-3">
                <p className="text-xs font-semibold mb-1">Direct Prospecting Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>- Research first: estimate volume, identify pain points before contact</li>
                  <li>- Walk-ins: go during off-peak hours with a one-page value prop</li>
                  <li>- Personalize emails with specific observations about their business</li>
                  <li>- Target: 100 businesses over weeks 7-12</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Lead Magnets */}
        <AccordionItem value="lead-magnet" className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold py-3"><span className="flex items-center gap-2"><span className="w-6 h-6 rounded bg-purple-400/10 flex items-center justify-center text-purple-400 text-xs font-bold">L</span>Educational Lead Magnets</span></AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <Card className="overflow-visible border-destructive/30 bg-destructive/5">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs font-medium text-destructive">Critical Rule: Follow up within 24 hours of every download</p>
              </CardContent>
            </Card>
            <ScriptCard title="24-Hour Follow-Up Template" content={PLAYBOOK_SCRIPTS.leadMagnet.followUp24hr} scriptKey="leadMagnet.followUp24hr" pinned={getPinned("leadMagnet.followUp24hr")} onPin={(k, c) => pinMutation.mutate({ scriptKey: k, customContent: c })} onUnpin={(id) => unpinMutation.mutate(id)} onRefresh={handleRefresh} isRefreshing={refreshing === "leadMagnet.followUp24hr"} />
            <div>
              <p className="text-xs font-semibold mb-2">High-Converting Resources to Create</p>
              <div className="space-y-1.5">{leadMagnetResources.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox checked={isChecked(item.id)} onCheckedChange={(v) => toggleCheckMutation.mutate({ id: item.id, channel: "lead-magnet", label: item.label, completed: !!v })} />
                  <span className={`text-xs ${isChecked(item.id) ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                </div>
              ))}</div>
            </div>
            <Card className="overflow-visible border-border/50 bg-purple-400/5">
              <CardContent className="p-3">
                <p className="text-xs font-semibold mb-1">Distribution Channels</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>- Social ads targeted to local business owners</li>
                  <li>- Email newsletter to existing contacts</li>
                  <li>- Landing pages with opt-in forms</li>
                  <li>- QR codes on printed materials and leave-behinds</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Partner Form Dialog */}
      <Dialog open={showPartnerForm} onOpenChange={(o) => !o && setShowPartnerForm(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Referral Partner</DialogTitle><DialogDescription>Track a referral partner relationship</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Partner Name *</Label><Input value={partnerForm.name} onChange={(e) => setPartnerForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith, CPA" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Niche/Industry</Label><Input value={partnerForm.niche} onChange={(e) => setPartnerForm(p => ({ ...p, niche: e.target.value }))} placeholder="Accounting, POS reseller..." /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Client Types They Serve</Label><Input value={partnerForm.clientTypes} onChange={(e) => setPartnerForm(p => ({ ...p, clientTypes: e.target.value }))} placeholder="Restaurants, retail shops..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Referral Terms</Label><Input value={partnerForm.referralTerms} onChange={(e) => setPartnerForm(p => ({ ...p, referralTerms: e.target.value }))} placeholder="$100 flat or 10% residual" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Intro Method</Label><Input value={partnerForm.introMethod} onChange={(e) => setPartnerForm(p => ({ ...p, introMethod: e.target.value }))} placeholder="Email intro, shared form..." /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Next Check-In Date</Label><Input type="date" value={partnerForm.nextCheckIn} onChange={(e) => setPartnerForm(p => ({ ...p, nextCheckIn: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowPartnerForm(false)}>Cancel</Button><Button onClick={() => createPartnerMutation.mutate(partnerForm)} disabled={!partnerForm.name}><Save className="w-3.5 h-3.5" />Add Partner</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Scorecard Tab ──────────────────────────────────────────────────

function ScorecardTab() {
  const { data: scoreData } = useQuery<{ scorecard: ChannelScore[]; overall: { totalLeads: number; activeLeads: number; totalWon: number; totalLost: number } }>({ queryKey: ["/api/metrics/scorecard"] });
  const { data: kpis = [], refetch: refetchKPIs } = useQuery<WeeklyKPI[]>({ queryKey: ["/api/kpis"] });
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [kpiForm, setKpiForm] = useState<Partial<WeeklyKPI>>({ weekStart: today(), outboundCalls: 0, outboundEmails: 0, outboundDMs: 0, walkIns: 0, contactsMade: 0, appointmentsSet: 0, statementsRequested: 0, statementsReceived: 0, proposalsSent: 0, dealsWon: 0, volumeWon: 0, notes: "" });
  const { toast } = useToast();

  const createKPIMutation = useMutation({
    mutationFn: async (data: Partial<WeeklyKPI>) => { const r = await apiRequest("POST", "/api/kpis", data); return r.json(); },
    onSuccess: () => { refetchKPIs(); toast({ title: "KPI logged" }); setShowKPIForm(false); },
  });
  const deleteKPIMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/kpis/${id}`); },
    onSuccess: () => { refetchKPIs(); },
  });

  const rateColor = (rate: number) => rate >= 50 ? "text-emerald-400" : rate >= 25 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Channel Scorecard</h2><p className="text-xs text-muted-foreground mt-1">Full pipeline metrics by lead source channel</p></div>

      {scoreData?.overall && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center py-3 rounded-lg bg-muted/30 border border-border/30"><div className="text-lg font-bold">{scoreData.overall.totalLeads}</div><div className="text-[10px] text-muted-foreground">Total Leads</div></div>
          <div className="text-center py-3 rounded-lg bg-muted/30 border border-border/30"><div className="text-lg font-bold text-blue-400">{scoreData.overall.activeLeads}</div><div className="text-[10px] text-muted-foreground">Active Pipeline</div></div>
          <div className="text-center py-3 rounded-lg bg-muted/30 border border-border/30"><div className="text-lg font-bold text-emerald-400">{scoreData.overall.totalWon}</div><div className="text-[10px] text-muted-foreground">Won</div></div>
          <div className="text-center py-3 rounded-lg bg-muted/30 border border-border/30"><div className="text-lg font-bold text-red-400">{scoreData.overall.totalLost}</div><div className="text-[10px] text-muted-foreground">Lost</div></div>
        </div>
      )}

      {scoreData?.scorecard && (
        <Card className="overflow-visible border-border/50">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Channel</TableHead>
                  <TableHead className="text-[10px] text-center">Total</TableHead>
                  <TableHead className="text-[10px] text-center">Contacted</TableHead>
                  <TableHead className="text-[10px] text-center">Contact %</TableHead>
                  <TableHead className="text-[10px] text-center">Qualified</TableHead>
                  <TableHead className="text-[10px] text-center">Appt %</TableHead>
                  <TableHead className="text-[10px] text-center">Stmt Recv</TableHead>
                  <TableHead className="text-[10px] text-center">Stmt %</TableHead>
                  <TableHead className="text-[10px] text-center">Won</TableHead>
                  <TableHead className="text-[10px] text-center">Close %</TableHead>
                  <TableHead className="text-[10px] text-center">Avg Days</TableHead>
                  <TableHead className="text-[10px] text-center">Avg Vol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoreData.scorecard.map((ch) => (
                  <TableRow key={ch.source}>
                    <TableCell className={`text-xs font-semibold ${SOURCE_CONFIG[ch.source as LeadSource]?.color || ""}`}>{SOURCE_CONFIG[ch.source as LeadSource]?.label || ch.source}</TableCell>
                    <TableCell className="text-xs text-center font-medium">{ch.total}</TableCell>
                    <TableCell className="text-xs text-center">{ch.contacted}</TableCell>
                    <TableCell className={`text-xs text-center font-semibold ${rateColor(ch.contactRate)}`}>{ch.contactRate}%</TableCell>
                    <TableCell className="text-xs text-center">{ch.qualified}</TableCell>
                    <TableCell className={`text-xs text-center font-semibold ${rateColor(ch.appointmentRate)}`}>{ch.appointmentRate}%</TableCell>
                    <TableCell className="text-xs text-center">{ch.stmtReceived}</TableCell>
                    <TableCell className={`text-xs text-center font-semibold ${rateColor(ch.stmtReceivedRate)}`}>{ch.stmtReceivedRate}%</TableCell>
                    <TableCell className="text-xs text-center font-semibold text-emerald-400">{ch.won}</TableCell>
                    <TableCell className={`text-xs text-center font-semibold ${rateColor(ch.closeRate)}`}>{ch.closeRate}%</TableCell>
                    <TableCell className="text-xs text-center">{ch.avgTimeToClose}d</TableCell>
                    <TableCell className="text-xs text-center">${ch.avgVolumeWon.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Weekly KPI Logger */}
      <div className="flex items-center justify-between">
        <div><h3 className="text-sm font-bold">Weekly KPI Log</h3><p className="text-[10px] text-muted-foreground">Track outreach activity week by week</p></div>
        <Button size="sm" onClick={() => { setKpiForm({ weekStart: today(), outboundCalls: 0, outboundEmails: 0, outboundDMs: 0, walkIns: 0, contactsMade: 0, appointmentsSet: 0, statementsRequested: 0, statementsReceived: 0, proposalsSent: 0, dealsWon: 0, volumeWon: 0, notes: "" }); setShowKPIForm(true); }}><Plus className="w-3.5 h-3.5" />Log This Week</Button>
      </div>

      {kpis.length === 0 ? (
        <Card className="overflow-visible border-dashed"><CardContent className="p-6 text-center"><BarChart3 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No KPIs logged yet. Start tracking your weekly activity.</p></CardContent></Card>
      ) : (
        <Card className="overflow-visible border-border/50"><div className="overflow-x-auto"><Table><TableHeader><TableRow>
          <TableHead className="text-[10px]">Week</TableHead>
          <TableHead className="text-[10px] text-center">Calls</TableHead>
          <TableHead className="text-[10px] text-center">Emails</TableHead>
          <TableHead className="text-[10px] text-center">DMs</TableHead>
          <TableHead className="text-[10px] text-center">Walk-Ins</TableHead>
          <TableHead className="text-[10px] text-center">Contacts</TableHead>
          <TableHead className="text-[10px] text-center">Appts</TableHead>
          <TableHead className="text-[10px] text-center">Stmts</TableHead>
          <TableHead className="text-[10px] text-center">Won</TableHead>
          <TableHead className="text-[10px] text-center">Vol $</TableHead>
          <TableHead className="text-[10px] w-10"></TableHead>
        </TableRow></TableHeader><TableBody>
          {[...kpis].sort((a, b) => b.weekStart.localeCompare(a.weekStart)).map((k) => (
            <TableRow key={k.id}>
              <TableCell className="text-xs font-medium">{k.weekStart}</TableCell>
              <TableCell className="text-xs text-center">{k.outboundCalls}</TableCell>
              <TableCell className="text-xs text-center">{k.outboundEmails}</TableCell>
              <TableCell className="text-xs text-center">{k.outboundDMs}</TableCell>
              <TableCell className="text-xs text-center">{k.walkIns}</TableCell>
              <TableCell className="text-xs text-center">{k.contactsMade}</TableCell>
              <TableCell className="text-xs text-center">{k.appointmentsSet}</TableCell>
              <TableCell className="text-xs text-center">{k.statementsReceived}</TableCell>
              <TableCell className="text-xs text-center font-semibold text-emerald-400">{k.dealsWon}</TableCell>
              <TableCell className="text-xs text-center">${k.volumeWon.toLocaleString()}</TableCell>
              <TableCell><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteKPIMutation.mutate(k.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody></Table></div></Card>
      )}

      <Dialog open={showKPIForm} onOpenChange={(o) => !o && setShowKPIForm(false)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Weekly KPIs</DialogTitle><DialogDescription>Track your outreach and conversion metrics</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Week Starting</Label><Input type="date" value={kpiForm.weekStart || today()} onChange={(e) => setKpiForm(p => ({ ...p, weekStart: e.target.value }))} /></div>
            <p className="text-xs font-semibold text-muted-foreground">Outreach Activity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Outbound Calls</Label><Input type="number" value={kpiForm.outboundCalls || ""} onChange={(e) => setKpiForm(p => ({ ...p, outboundCalls: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Outbound Emails</Label><Input type="number" value={kpiForm.outboundEmails || ""} onChange={(e) => setKpiForm(p => ({ ...p, outboundEmails: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Social DMs</Label><Input type="number" value={kpiForm.outboundDMs || ""} onChange={(e) => setKpiForm(p => ({ ...p, outboundDMs: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Walk-Ins</Label><Input type="number" value={kpiForm.walkIns || ""} onChange={(e) => setKpiForm(p => ({ ...p, walkIns: Number(e.target.value) }))} /></div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">Conversions</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Contacts Made</Label><Input type="number" value={kpiForm.contactsMade || ""} onChange={(e) => setKpiForm(p => ({ ...p, contactsMade: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Appointments Set</Label><Input type="number" value={kpiForm.appointmentsSet || ""} onChange={(e) => setKpiForm(p => ({ ...p, appointmentsSet: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Stmts Requested</Label><Input type="number" value={kpiForm.statementsRequested || ""} onChange={(e) => setKpiForm(p => ({ ...p, statementsRequested: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Stmts Received</Label><Input type="number" value={kpiForm.statementsReceived || ""} onChange={(e) => setKpiForm(p => ({ ...p, statementsReceived: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Proposals Sent</Label><Input type="number" value={kpiForm.proposalsSent || ""} onChange={(e) => setKpiForm(p => ({ ...p, proposalsSent: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Deals Won</Label><Input type="number" value={kpiForm.dealsWon || ""} onChange={(e) => setKpiForm(p => ({ ...p, dealsWon: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Volume Won ($)</Label><Input type="number" value={kpiForm.volumeWon || ""} onChange={(e) => setKpiForm(p => ({ ...p, volumeWon: Number(e.target.value) }))} placeholder="Total monthly processing volume from wins" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Input value={kpiForm.notes || ""} onChange={(e) => setKpiForm(p => ({ ...p, notes: e.target.value }))} placeholder="What worked this week..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowKPIForm(false)}>Cancel</Button><Button onClick={() => createKPIMutation.mutate(kpiForm)}><Save className="w-3.5 h-3.5" />Log KPIs</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 90-Day Plan Tab ────────────────────────────────────────────────

function PlanTab() {
  const { data: items = [], refetch } = useQuery<PlanItem[]>({ queryKey: ["/api/plan-items"] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPhase, setAddPhase] = useState(1);
  const [addTitle, setAddTitle] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const { toast } = useToast();

  const [startDate, setStartDate] = useState(() => {
    try { return localStorage.getItem("plan-start-date") || ""; } catch { return ""; }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => { await apiRequest("PATCH", `/api/plan-items/${id}`, { completed }); },
    onSuccess: () => { refetch(); },
  });
  const addMutation = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/plan-items", data); return r.json(); },
    onSuccess: () => { refetch(); toast({ title: "Item added" }); setShowAddForm(false); setAddTitle(""); setAddDesc(""); },
  });

  const totalCompleted = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? Math.round((totalCompleted / items.length) * 100) : 0;

  const currentWeek = startDate ? Math.max(1, Math.ceil((Date.now() - new Date(startDate).getTime()) / (7 * 86400000))) : null;
  const currentPhase = currentWeek ? (currentWeek <= 2 ? 1 : currentWeek <= 6 ? 2 : 3) : null;

  const handleSetStart = (date: string) => {
    setStartDate(date);
    try { localStorage.setItem("plan-start-date", date); } catch {}
  };

  const phases = [
    { num: 1, range: "1-2", title: "Foundation", color: "blue", borderColor: "border-l-blue-400" },
    { num: 2, range: "3-6", title: "Relationship Building", color: "amber", borderColor: "border-l-amber-400" },
    { num: 3, range: "7-12", title: "Active Prospecting", color: "emerald", borderColor: "border-l-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />90-Day Execution Plan</h2><p className="text-xs text-muted-foreground mt-1">From the sales playbook — operationalized and trackable</p></div>
        <div className="flex items-center gap-2 shrink-0">
          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Day 1:</Label>
          <Input type="date" className="h-8 w-36 text-xs" value={startDate} onChange={(e) => handleSetStart(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-visible border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Overall Progress</span>
            <span className="text-xs text-muted-foreground">{totalCompleted} / {items.length} ({progress}%)</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          {currentWeek && <p className="text-[10px] text-primary mt-2">You're in Week {Math.min(currentWeek, 12)} — Phase {currentPhase}: {phases[(currentPhase || 1) - 1]?.title}</p>}
        </CardContent>
      </Card>

      {phases.map((phase) => {
        const phaseItems = items.filter((i) => i.phase === phase.num);
        const phaseCompleted = phaseItems.filter((i) => i.completed).length;
        const isActive = currentPhase === phase.num;
        return (
          <Card key={phase.num} className={`overflow-visible border-border/50 border-l-4 ${phase.borderColor} ${isActive ? "ring-1 ring-primary/20" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Phase {phase.num}: {phase.title}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">Weeks {phase.range}</Badge>
                  {isActive && <Badge className="text-[9px]">Current</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">{phaseCompleted}/{phaseItems.length}</span>
              </div>
              <Progress value={phaseItems.length > 0 ? (phaseCompleted / phaseItems.length) * 100 : 0} className="h-1.5 mt-1" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {phaseItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 py-1.5">
                    <Checkbox className="mt-0.5" checked={item.completed} onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, completed: !!v })} />
                    <div>
                      <p className={`text-xs ${item.completed ? "line-through text-muted-foreground" : "font-medium"}`}>{item.title}</p>
                      {item.description && <p className="text-[10px] text-muted-foreground">{item.description}</p>}
                      {item.completed && item.completedAt && <p className="text-[9px] text-emerald-400 mt-0.5">Completed {new Date(item.completedAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] h-6 mt-2" onClick={() => { setAddPhase(phase.num); setShowAddForm(true); }}><Plus className="w-3 h-3" />Add custom item</Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Materials Checklist */}
      <div className="border-t border-border/30 pt-6 mt-2">
        <MaterialsTab />
      </div>

      <Dialog open={showAddForm} onOpenChange={(o) => !o && setShowAddForm(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Plan Item</DialogTitle><DialogDescription>Add a custom item to Phase {addPhase}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Title *</Label><Input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="What needs to be done" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input value={addDesc} onChange={(e) => setAddDesc(e.target.value)} placeholder="Details or context" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button><Button onClick={() => addMutation.mutate({ phase: addPhase, weekRange: phases[addPhase - 1].range, title: addTitle, description: addDesc })} disabled={!addTitle}><Save className="w-3.5 h-3.5" />Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Materials Tab ──────────────────────────────────────────────────

function MaterialsTab() {
  const { data: items = [], refetch } = useQuery<MaterialItem[]>({ queryKey: ["/api/materials"] });
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState("");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<MaterialItem>) => { const r = await apiRequest("PATCH", `/api/materials/${id}`, data); return r.json(); },
    onSuccess: () => { refetch(); toast({ title: "Material updated" }); },
    onError: () => { toast({ title: "Failed to update material", variant: "destructive" }); },
  });

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    "not-started": { label: "Not Started", color: "text-muted-foreground", bg: "bg-muted/30", icon: Clock },
    "in-progress": { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-400/10", icon: RefreshCw },
    completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle },
  };

  const categories = ["sales", "lead-gen", "partner", "tracking"];
  const totalCompleted = items.filter(i => i.status === "completed").length;
  const overallPct = items.length > 0 ? Math.round((totalCompleted / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />Materials Checklist
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Track creation of all sales, lead gen, partner, and tracking assets</p>
      </div>

      {/* Overall Progress */}
      <Card className="overflow-visible border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Overall Progress</span>
            <span className="text-xs text-muted-foreground">{totalCompleted} / {items.length} completed</span>
          </div>
          <Progress value={overallPct} className="h-2.5" />
          <div className="flex items-center gap-4 mt-3">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const StatusIcon = cfg.icon;
              const count = items.filter(i => i.status === key).length;
              return (
                <div key={key} className="flex items-center gap-1.5 text-[10px]">
                  <StatusIcon className={`w-3 h-3 ${cfg.color}`} />
                  <span className="text-muted-foreground">{cfg.label}: <span className="font-medium text-foreground">{count}</span></span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-Category KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const catCfg = MATERIAL_CATEGORIES[cat];
          const CatIcon = catCfg?.icon || ClipboardList;
          const catItems = items.filter((i) => i.category === cat);
          const completed = catItems.filter((i) => i.status === "completed").length;
          const inProgress = catItems.filter((i) => i.status === "in-progress").length;
          const pct = catItems.length > 0 ? Math.round((completed / catItems.length) * 100) : 0;
          return (
            <Card key={cat} className="overflow-visible border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <CatIcon className={`w-4 h-4 ${catCfg?.color || "text-primary"}`} />
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground truncate">{catCfg?.label || cat}</p>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{completed}/{catItems.length}</span>
                  <span className={`text-[10px] font-medium ${pct === 100 ? "text-emerald-400" : "text-muted-foreground"}`}>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                {inProgress > 0 && <p className="text-[9px] text-yellow-400 mt-1">{inProgress} in progress</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per-Category Detail Cards */}
      {categories.map((cat) => {
        const catCfg = MATERIAL_CATEGORIES[cat];
        const CatIcon = catCfg?.icon || ClipboardList;
        const catItems = items.filter((i) => i.category === cat);
        const completed = catItems.filter((i) => i.status === "completed").length;
        if (catItems.length === 0) return null;
        return (
          <Card key={cat} className={`overflow-visible border-border/50 border-l-4 ${catCfg?.borderColor || "border-l-primary"}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CatIcon className={`w-4 h-4 ${catCfg?.color || "text-primary"}`} />
                  <CardTitle className="text-sm font-semibold">{catCfg?.label || cat}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{completed}/{catItems.length}</Badge>
                </div>
                <Progress value={catItems.length > 0 ? (completed / catItems.length) * 100 : 0} className="h-1.5 w-24" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {catItems.map((item) => {
                  const st = statusConfig[item.status] || statusConfig["not-started"];
                  const StatusIcon = st.icon;
                  return (
                    <div key={item.id} className={`flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/30 transition-colors ${item.status === "completed" ? "opacity-70" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${st.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${st.color}`} />
                      </div>
                      <Select value={item.status} onValueChange={(v) => updateMutation.mutate({ id: item.id, status: v })}>
                        <SelectTrigger className={`h-7 w-28 text-[10px] shrink-0 border ${st.bg} ${st.color}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-started"><span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />Not Started</span></SelectItem>
                          <SelectItem value="in-progress"><span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3" />In Progress</span></SelectItem>
                          <SelectItem value="completed"><span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" />Completed</span></SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.description}</p>
                        {item.updatedAt && <p className="text-[9px] text-muted-foreground/60 mt-0.5">Updated {timeAgo(item.updatedAt)}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {editingUrl === item.id ? (
                          <div className="flex items-center gap-1">
                            <Input className="h-7 w-40 text-[10px]" value={urlValue} onChange={(e) => setUrlValue(e.target.value)} placeholder="File URL..." />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" onClick={() => { updateMutation.mutate({ id: item.id, fileUrl: urlValue }); setEditingUrl(null); }}><Check className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingUrl(null)}><X className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <>
                            {item.fileUrl && (
                              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingUrl(item.id); setUrlValue(item.fileUrl || ""); }} title="Attach file URL">
                              <Paperclip className={`w-3.5 h-3.5 ${item.fileUrl ? "text-primary" : ""}`} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Empty state */}
      {items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No materials tracked yet</p>
            <p className="text-xs text-muted-foreground mt-1">Materials will appear here once configured</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Clients Tab ─────────────────────────────────────────────────────

function ClientsTab() {
  const { data: clients = [], refetch } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({ mutationFn: async (data: Partial<Client>) => { const res = await apiRequest("POST", "/api/clients", data); return res.json(); }, onSuccess: () => { refetch(); toast({ title: "Client added" }); setShowForm(false); setEditingClient(null); } });
  const updateMutation = useMutation({ mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => { const res = await apiRequest("PATCH", `/api/clients/${id}`, data); return res.json(); }, onSuccess: () => { refetch(); toast({ title: "Client updated" }); setShowForm(false); setEditingClient(null); } });
  const deleteMutation = useMutation({ mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/clients/${id}`); }, onSuccess: () => { refetch(); toast({ title: "Client removed" }); } });

  const filtered = useMemo(() => clients.filter((c) => !search || [c.name, c.business, c.email].some((f) => f.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => a.business.localeCompare(b.business)), [clients, search]);
  const handleSave = (form: Partial<Client>) => { if (editingClient) updateMutation.mutate({ ...form, id: editingClient.id } as Client & { id: string }); else createMutation.mutate(form); };
  const WS: Record<string, { label: string; color: string }> = { "not-started": { label: "Not Started", color: "text-muted-foreground" }, "in-progress": { label: "In Progress", color: "text-yellow-400" }, live: { label: "Live", color: "text-emerald-400" }, "self-hosted": { label: "Self-Hosted", color: "text-blue-400" } };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold">Client Directory</h2><p className="text-xs text-muted-foreground">{clients.length} active merchants</p></div>
        <Button size="sm" onClick={() => { setEditingClient(null); setShowForm(true); }}><Plus className="w-3.5 h-3.5" />Add Client</Button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" /></div>
      {filtered.length === 0 ? (
        <Card className="overflow-visible border-dashed"><CardContent className="p-8 text-center"><Building className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{clients.length === 0 ? "No clients yet." : "No match."}</p></CardContent></Card>
      ) : (
        <div className="space-y-2">{filtered.map((client) => (
          <Card key={client.id} className="overflow-visible border-border/50"><CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm">{client.business || client.name}</span>
                  <Badge variant="outline" className={`text-[10px] ${PACKAGE_CONFIG[client.package].color}`}>{PACKAGE_CONFIG[client.package].label}</Badge>
                  {client.maintenance !== "none" && <Badge variant="outline" className="text-[10px] text-primary">{MAINTENANCE_CONFIG[client.maintenance].label} — {MAINTENANCE_CONFIG[client.maintenance].price}</Badge>}
                </div>
                {client.business && client.name && <p className="text-xs text-muted-foreground">{client.name}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="w-3 h-3" />{client.phone}</a>}
                  {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="w-3 h-3" />{client.email}</a>}
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Website: <span className={WS[client.websiteStatus]?.color}>{WS[client.websiteStatus]?.label}</span></span>
                  {client.websiteUrl && <a href={client.websiteUrl.startsWith("http") ? client.websiteUrl : `https://${client.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground text-primary"><ExternalLink className="w-3 h-3" />{client.websiteUrl}</a>}
                  {client.monthlyVolume > 0 && <span><DollarSign className="w-3 h-3 inline" />${client.monthlyVolume.toLocaleString()}/mo</span>}
                </div>
                {client.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{client.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingClient(client); setShowForm(true); }}><Edit3 className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(client.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
      <ClientFormDialog open={showForm} onClose={() => { setShowForm(false); setEditingClient(null); }} onSave={handleSave} client={editingClient} />
    </div>
  );
}

function ClientFormDialog({ open, onClose, onSave, client }: { open: boolean; onClose: () => void; onSave: (form: Partial<Client>) => void; client: Client | null; }) {
  const [form, setForm] = useState<Partial<Client>>({});
  useEffect(() => { if (open) setForm(client || { name: "", business: "", phone: "", email: "", package: "terminal", maintenance: "none", websiteUrl: "", websiteStatus: "not-started", terminalId: "", monthlyVolume: 0, startDate: today(), notes: "" }); }, [open, client]);
  const set = (key: keyof Client, value: string | number) => setForm((p) => ({ ...p, [key]: value }));
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle><DialogDescription>Manage merchant details</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Contact Name</Label><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></div><div className="space-y-1.5"><Label className="text-xs">Business Name</Label><Input value={form.business || ""} onChange={(e) => set("business", e.target.value)} /></div></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></div><div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></div></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Package</Label><Select value={form.package || "terminal"} onValueChange={(v) => set("package", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="terminal">Terminal ($399)</SelectItem><SelectItem value="trial">30-Day Trial</SelectItem><SelectItem value="online">Online (Free)</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs">Maintenance</Label><Select value={form.maintenance || "none"} onValueChange={(v) => set("maintenance", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="basic">Basic ($50/mo)</SelectItem><SelectItem value="pro">Pro ($199/mo)</SelectItem><SelectItem value="premium">Premium ($399/mo)</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Website Status</Label><Select value={form.websiteStatus || "not-started"} onValueChange={(v) => set("websiteStatus", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="not-started">Not Started</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="live">Live</SelectItem><SelectItem value="self-hosted">Self-Hosted</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs">Website URL</Label><Input value={form.websiteUrl || ""} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="example.com" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Terminal ID</Label><Input value={form.terminalId || ""} onChange={(e) => set("terminalId", e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Monthly Vol ($)</Label><Input type="number" value={form.monthlyVolume || ""} onChange={(e) => set("monthlyVolume", Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Start Date</Label><Input type="date" value={form.startDate || today()} onChange={(e) => set("startDate", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} className="resize-none text-sm" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)} disabled={!form.name || !form.business}><Save className="w-3.5 h-3.5" />{client ? "Update" : "Add Client"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Revenue Tab ─────────────────────────────────────────────────────

function RevenueTab() {
  const { data: entries = [], refetch } = useQuery<RevenueEntry[]>({ queryKey: ["/api/revenue"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({ mutationFn: async (d: Partial<RevenueEntry>) => { const r = await apiRequest("POST", "/api/revenue", d); return r.json(); }, onSuccess: () => { refetch(); toast({ title: "Revenue recorded" }); setShowForm(false); setEditingEntry(null); }, onError: () => { toast({ title: "Failed to record revenue", variant: "destructive" }); } });
  const updateMutation = useMutation({ mutationFn: async ({ id, ...d }: Partial<RevenueEntry> & { id: string }) => { const r = await apiRequest("PATCH", `/api/revenue/${id}`, d); return r.json(); }, onSuccess: () => { refetch(); toast({ title: "Updated" }); setShowForm(false); setEditingEntry(null); }, onError: () => { toast({ title: "Failed to update", variant: "destructive" }); } });
  const deleteMutation = useMutation({ mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/revenue/${id}`); }, onSuccess: () => { refetch(); toast({ title: "Deleted" }); }, onError: () => { toast({ title: "Failed to delete", variant: "destructive" }); } });
  const handleSave = (form: Partial<RevenueEntry>) => { if (editingEntry) updateMutation.mutate({ ...form, id: editingEntry.id } as RevenueEntry & { id: string }); else createMutation.mutate(form); };

  const now = new Date();
  const thisMonth = entries.filter((r) => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const lastMonth = entries.filter((r) => { const d = new Date(r.date); const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); });
  const thisMonthTotal = thisMonth.reduce((s, r) => s + r.amount, 0);
  const lastMonthTotal = lastMonth.reduce((s, r) => s + r.amount, 0);
  const mrrFromClients = clients.reduce((sum, c) => { const p: Record<MaintenancePlan, number> = { none: 0, basic: 50, pro: 199, premium: 399 }; return sum + p[c.maintenance]; }, 0);
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold">Revenue Tracker</h2><p className="text-xs text-muted-foreground">{entries.length} entries</p></div>
        <Button size="sm" onClick={() => { setEditingEntry(null); setShowForm(true); }}><Plus className="w-3.5 h-3.5" />Record Revenue</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="overflow-visible border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">This Month</p><p className="text-xl font-extrabold text-primary">${thisMonthTotal.toLocaleString()}</p><p className="text-[10px] text-muted-foreground mt-1">{lastMonthTotal > 0 ? (thisMonthTotal >= lastMonthTotal ? <span className="text-emerald-400 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />vs last mo</span> : <span className="text-red-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />vs last mo</span>) : "No prior data"}</p></CardContent></Card>
        <Card className="overflow-visible border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">One-Time</p><p className="text-xl font-extrabold">${thisMonth.filter((r) => !r.recurring).reduce((s, r) => s + r.amount, 0).toLocaleString()}</p></CardContent></Card>
        <Card className="overflow-visible border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Recurring</p><p className="text-xl font-extrabold text-chart-2">${thisMonth.filter((r) => r.recurring).reduce((s, r) => s + r.amount, 0).toLocaleString()}</p></CardContent></Card>
        <Card className="overflow-visible border-border/50"><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Expected MRR</p><p className="text-xl font-extrabold text-emerald-400">${mrrFromClients.toLocaleString()}</p></CardContent></Card>
      </div>
      {sorted.length === 0 ? (
        <Card className="overflow-visible border-dashed"><CardContent className="p-8 text-center"><DollarSign className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No revenue yet.</p></CardContent></Card>
      ) : (
        <Card className="overflow-visible border-border/50"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs text-right">Amount</TableHead><TableHead className="text-xs w-20"></TableHead></TableRow></TableHeader><TableBody>
          {sorted.map((e) => (<TableRow key={e.id}><TableCell className="text-xs">{e.date}</TableCell><TableCell className="text-xs"><div className="flex items-center gap-1.5">{e.recurring && <Badge variant="outline" className="text-[9px] text-chart-2 border-chart-2/20">Recurring</Badge>}<span>{REVENUE_TYPES[e.type]}</span></div></TableCell><TableCell className="text-xs text-muted-foreground">{e.description}</TableCell><TableCell className="text-xs text-right font-semibold text-primary">${e.amount.toLocaleString()}</TableCell><TableCell><div className="flex items-center gap-1 justify-end"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingEntry(e); setShowForm(true); }}><Edit3 className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(e.id)}><Trash2 className="w-3 h-3" /></Button></div></TableCell></TableRow>))}
        </TableBody></Table></div></Card>
      )}
      <RevenueFormDialog open={showForm} onClose={() => { setShowForm(false); setEditingEntry(null); }} onSave={handleSave} entry={editingEntry} clients={clients} />
    </div>
  );
}

function RevenueFormDialog({ open, onClose, onSave, entry, clients }: { open: boolean; onClose: () => void; onSave: (f: Partial<RevenueEntry>) => void; entry: RevenueEntry | null; clients: Client[]; }) {
  const [form, setForm] = useState<Partial<RevenueEntry>>({});
  useEffect(() => { if (open) setForm(entry || { date: today(), type: "terminal-sale", description: "", amount: 0, clientId: "", recurring: false }); }, [open, entry]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{entry ? "Edit Entry" : "Record Revenue"}</DialogTitle><DialogDescription>Track income</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Date</Label><Input type="date" value={form.date || today()} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></div><div className="space-y-1.5"><Label className="text-xs">Amount ($)</Label><Input type="number" value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} /></div></div>
          <div className="space-y-1.5"><Label className="text-xs">Type</Label><Select value={form.type || "terminal-sale"} onValueChange={(v) => setForm((p) => ({ ...p, type: v as RevenueEntry["type"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(REVENUE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          {clients.length > 0 && <div className="space-y-1.5"><Label className="text-xs">Client</Label><Select value={form.clientId || "none"} onValueChange={(v) => setForm((p) => ({ ...p, clientId: v === "none" ? "" : v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business || c.name}</SelectItem>)}</SelectContent></Select></div>}
          <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.recurring || false} onCheckedChange={(v) => setForm((p) => ({ ...p, recurring: v }))} /><Label className="text-xs">Recurring</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)} disabled={!form.amount}><Save className="w-3.5 h-3.5" />{entry ? "Update" : "Record"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tasks Tab ───────────────────────────────────────────────────────

function TasksTab() {
  const { data: tasks = [], refetch } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: schedule = [], refetch: refetchSchedule } = useQuery<ScheduleItem[]>({ queryKey: ["/api/schedule"] });
  const { data: team = [] } = useQuery<TeamMember[]>({ queryKey: ["/api/team-members"] });
  const { data: planItems = [] } = useQuery<PlanItem[]>({ queryKey: ["/api/plan-items"] });
  const planItemMap = useMemo(() => new Map(planItems.map(p => [p.id, p])), [planItems]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("pending");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(today());
  const { toast } = useToast();

  const createMutation = useMutation({ mutationFn: async (d: Partial<Task>) => { const r = await apiRequest("POST", "/api/tasks", d); return r.json(); }, onSuccess: () => { refetch(); toast({ title: "Task added" }); setShowForm(false); setEditingTask(null); }, onError: () => { toast({ title: "Failed to add task", variant: "destructive" }); } });
  const updateMutation = useMutation({ mutationFn: async ({ id, ...d }: Partial<Task> & { id: string }) => { const r = await apiRequest("PATCH", `/api/tasks/${id}`, d); return r.json(); }, onSuccess: () => { refetch(); toast({ title: "Task updated" }); }, onError: () => { toast({ title: "Failed to update task", variant: "destructive" }); } });
  const deleteMutation = useMutation({ mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/tasks/${id}`); }, onSuccess: () => { refetch(); toast({ title: "Task deleted" }); }, onError: () => { toast({ title: "Failed to delete task", variant: "destructive" }); } });
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const r = await apiRequest("PATCH", `/api/schedule/${id}`, { status }); return r.json(); },
    onSuccess: () => { refetchSchedule(); }, onError: () => { toast({ title: "Failed to update", variant: "destructive" }); },
  });
  const handleSave = (form: Partial<Task>) => { if (editingTask) { updateMutation.mutate({ ...form, id: editingTask.id } as Task & { id: string }); setShowForm(false); setEditingTask(null); } else createMutation.mutate(form); };

  const todayStr = today();
  const filtered = useMemo(() => tasks.filter((t) => {
    if (filter === "overdue") return !t.completed && t.dueDate && t.dueDate < todayStr;
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  }).filter((t) => {
    if (assigneeFilter === "all") return true;
    if (assigneeFilter === "pending") return !t.assignee;
    return t.assignee === assigneeFilter;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const o: Record<string, number> = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return o[a.priority] - o[b.priority];
    return (a.dueDate || "9").localeCompare(b.dueDate || "9");
  }), [tasks, filter, assigneeFilter, todayStr]);

  const overdueCount = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;

  const getAssigneeInfo = (assignee: string) => TEAM_MEMBERS_LIST.find(m => m.value === assignee);

  // Week days for the mini weekly strip (always current week)
  const weekDays = useMemo(() => {
    const d = new Date(todayStr + "T12:00:00");
    const dayOfWeek = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day.toISOString().split("T")[0];
    });
  }, [todayStr]);

  // Full month days for the calendar view
  const monthDays = useMemo(() => {
    const d = new Date(calendarDate + "T12:00:00");
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const days: string[] = [];
    // Pad with previous month days
    for (let i = startPad - 1; i >= 0; i--) {
      const prev = new Date(year, month, -i);
      days.push(prev.toISOString().split("T")[0]);
    }
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i).toISOString().split("T")[0]);
    }
    // Pad to fill last week
    while (days.length % 7 !== 0) {
      const next = new Date(year, month + 1, days.length - startPad - lastDay.getDate() + 1);
      days.push(next.toISOString().split("T")[0]);
    }
    return days;
  }, [calendarDate]);

  const currentMonth = new Date(calendarDate + "T12:00:00").getMonth();

  const SCHED_COLORS: Record<string, string> = { training: "bg-purple-400/20 text-purple-400", outreach: "bg-blue-400/20 text-blue-400", admin: "bg-gray-400/20 text-gray-400", meeting: "bg-emerald-400/20 text-emerald-400", "follow-up": "bg-orange-400/20 text-orange-400", development: "bg-cyan-400/20 text-cyan-400", general: "bg-gray-400/20 text-gray-400" };

  // Mini weekly calendar strip component
  const WeeklyStrip = () => (
    <Card className="border-border/50">
      <CardContent className="p-3">
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-[9px] text-center text-muted-foreground font-semibold">{d}</div>
          ))}
          {weekDays.map(day => {
            const dayTasks = tasks.filter(t => t.dueDate === day && !t.completed);
            const daySchedule = schedule.filter(s => s.date === day && s.status !== "completed");
            const isToday = day === todayStr;
            const count = dayTasks.length + daySchedule.length;
            return (
              <div key={day} className={`rounded-md p-1 min-h-[54px] ${isToday ? "border border-primary/50 bg-primary/5" : "border border-border/20"}`}>
                <div className={`text-[10px] font-semibold text-center mb-0.5 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                  {new Date(day + "T12:00:00").getDate()}
                </div>
                <div className="space-y-0.5">
                  {daySchedule.slice(0, 2).map(s => (
                    <div key={s.id} className={`text-[8px] px-0.5 py-px rounded truncate ${SCHED_COLORS[s.category] || SCHED_COLORS.general}`}>
                      {s.time && <span className="font-mono">{s.time} </span>}{s.title.slice(0, 12)}
                    </div>
                  ))}
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} className={`text-[8px] px-0.5 py-px rounded truncate ${t.priority === "high" ? "bg-red-400/15 text-red-400" : t.priority === "medium" ? "bg-yellow-400/15 text-yellow-500" : "bg-blue-400/15 text-blue-400"}`}>
                      {t.title.slice(0, 12)}
                    </div>
                  ))}
                  {count > 4 && <div className="text-[7px] text-center text-muted-foreground">+{count - 4}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Tasks & Schedule</h2>
          <p className="text-xs text-muted-foreground">{tasks.filter(t => !t.completed).length} pending{overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team</SelectItem>
              <SelectItem value="pending">Unassigned</SelectItem>
              {TEAM_MEMBERS_LIST.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${m.color}`} />{m.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex rounded-md border border-border/50">
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="text-xs h-8 rounded-r-none" onClick={() => setViewMode("list")}>List</Button>
            <Button variant={viewMode === "calendar" ? "default" : "ghost"} size="sm" className="text-xs h-8 rounded-l-none" onClick={() => setViewMode("calendar")}>Calendar</Button>
          </div>
          <Button size="sm" onClick={() => { setEditingTask(null); setShowForm(true); }}><Plus className="w-3.5 h-3.5" />Add Task</Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Weekly calendar strip at top of list view */}
          <WeeklyStrip />

          <div className="flex gap-2 flex-wrap">
            {(["pending", "overdue", "all", "completed"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className={`text-xs ${f === "overdue" && overdueCount > 0 ? "border-destructive/50" : ""}`} onClick={() => setFilter(f)}>
                {f === "pending" ? "Pending" : f === "overdue" ? `Overdue (${overdueCount})` : f === "all" ? "All" : "Completed"}
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <Card className="overflow-visible border-dashed"><CardContent className="p-8 text-center"><CheckCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{filter === "overdue" ? "No overdue tasks!" : "No tasks match."}</p></CardContent></Card>
          ) : (
            <div className="space-y-1.5">{filtered.map((task) => {
              const assigneeInfo = getAssigneeInfo(task.assignee);
              return (
              <Card key={task.id} className={`overflow-visible border-border/50 ${task.completed ? "opacity-60" : ""} ${!task.completed && task.dueDate && task.dueDate < todayStr ? "border-destructive/30" : ""}`}><CardContent className="p-3 flex items-center gap-3">
                <button onClick={() => updateMutation.mutate({ id: task.id, completed: !task.completed })} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${task.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary"}`}>{task.completed && <Check className="w-3 h-3" />}</button>
                {assigneeInfo && <div className={`w-1 h-8 rounded-full shrink-0 ${assigneeInfo.color}`} />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</span><div className={`w-1.5 h-1.5 rounded-full ${task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-yellow-400" : "bg-blue-400"}`} /></div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                    {assigneeInfo && <span className={`font-medium ${assigneeInfo.color.replace("bg-", "text-")}`}>{assigneeInfo.label}</span>}
                    {task.dueDate && <span className={!task.completed && task.dueDate < todayStr ? "text-destructive font-medium" : ""}>Due {task.dueDate}</span>}
                    {task.linkedTo && <span>{task.linkedTo}</span>}
                    {task.planItemId && planItemMap.get(task.planItemId) && <span className="inline-flex items-center gap-1 text-primary/80"><Target className="w-2.5 h-2.5" />{planItemMap.get(task.planItemId)!.title}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTask(task); setShowForm(true); }}><Edit3 className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(task.id)}><Trash2 className="w-3 h-3" /></Button></div>
              </CardContent></Card>
            );})}</div>
          )}
        </>
      ) : (
        /* Full Month Calendar View */
        <Card className="overflow-visible border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const d = new Date(calendarDate + "T12:00:00");
                d.setMonth(d.getMonth() - 1);
                setCalendarDate(d.toISOString().split("T")[0]);
              }}><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {new Date(calendarDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <Button variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => setCalendarDate(todayStr)}>Today</Button>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const d = new Date(calendarDate + "T12:00:00");
                d.setMonth(d.getMonth() + 1);
                setCalendarDate(d.toISOString().split("T")[0]);
              }}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="text-[10px] text-center text-muted-foreground font-semibold pb-1">{d}</div>)}
              {monthDays.map((day, idx) => {
                const dayTasks = tasks.filter(t => t.dueDate === day && !t.completed).filter(t => assigneeFilter === "all" || t.assignee === assigneeFilter);
                const daySchedule = schedule.filter(s => s.date === day && s.status !== "completed");
                const isToday = day === todayStr;
                const isCurrentMonth = new Date(day + "T12:00:00").getMonth() === currentMonth;
                return (
                  <div key={`${day}-${idx}`} className={`min-h-[72px] border rounded-md p-1 ${isToday ? "border-primary/50 bg-primary/5" : "border-border/30"} ${!isCurrentMonth ? "opacity-40" : ""}`}>
                    <div className={`text-[10px] font-semibold mb-0.5 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {new Date(day + "T12:00:00").getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {daySchedule.slice(0, 2).map(s => (
                        <div key={s.id} className={`text-[8px] px-1 py-px rounded truncate cursor-pointer ${SCHED_COLORS[s.category] || SCHED_COLORS.general}`}
                          title={s.title}
                          onClick={() => toggleScheduleMutation.mutate({ id: s.id, status: "completed" })}>
                          {s.time && <span className="font-mono">{s.time} </span>}{s.title.slice(0, 14)}
                        </div>
                      ))}
                      {dayTasks.slice(0, 2).map(t => {
                        const ai = getAssigneeInfo(t.assignee);
                        return (
                        <div key={t.id} className={`text-[8px] px-1 py-px rounded cursor-pointer flex items-center gap-0.5 truncate ${t.priority === "high" ? "bg-red-400/15 text-red-400" : t.priority === "medium" ? "bg-yellow-400/15 text-yellow-500" : "bg-blue-400/15 text-blue-400"}`}
                          onClick={() => updateMutation.mutate({ id: t.id, completed: true })}>
                          {ai && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ai.color}`} />}
                          {t.title.slice(0, 14)}
                        </div>
                      );})}
                      {(daySchedule.length + dayTasks.length) > 4 && (
                        <div className="text-[7px] text-center text-muted-foreground">+{daySchedule.length + dayTasks.length - 4} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      <TaskFormDialog open={showForm} onClose={() => { setShowForm(false); setEditingTask(null); }} onSave={handleSave} task={editingTask} />
    </div>
  );
}
function TaskFormDialog({ open, onClose, onSave, task }: { open: boolean; onClose: () => void; onSave: (f: Partial<Task>) => void; task: Task | null; }) {
  const [form, setForm] = useState<Partial<Task>>({});
  const { data: planItems = [] } = useQuery<PlanItem[]>({ queryKey: ["/api/plan-items"] });
  useEffect(() => { if (open) setForm(task || { title: "", dueDate: "", priority: "medium", completed: false, linkedTo: "", assignee: "", planItemId: "" }); }, [open, task]);
  const PHASE_LABELS: Record<number, { label: string; color: string }> = { 1: { label: "P1", color: "text-blue-400" }, 2: { label: "P2", color: "text-amber-400" }, 3: { label: "P3", color: "text-emerald-400" } };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle><DialogDescription>Create a follow-up</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Task</Label><Input value={form.title || ""} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Follow up with..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Due Date</Label><Input type="date" value={form.dueDate || ""} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Priority</Label><Select value={form.priority || "medium"} onValueChange={(v) => setForm((p) => ({ ...p, priority: v as Task["priority"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Assign To</Label><Select value={form.assignee || "unassigned"} onValueChange={(v) => setForm((p) => ({ ...p, assignee: v === "unassigned" ? "" : v }))}><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{TEAM_MEMBERS_LIST.map(m => <SelectItem key={m.value} value={m.value}><span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${m.color}`} />{m.label}</span></SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs">Linked To</Label><Input value={form.linkedTo || ""} onChange={(e) => setForm((p) => ({ ...p, linkedTo: e.target.value }))} placeholder="Business name" /></div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><Target className="w-3 h-3 text-primary" />90-Day Plan Goal</Label>
            <Select value={form.planItemId || "none"} onValueChange={(v) => setForm((p) => ({ ...p, planItemId: v === "none" ? "" : v }))}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="No linked goal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked goal</SelectItem>
                {[1, 2, 3].map(phase => {
                  const phaseItems = planItems.filter(p => p.phase === phase);
                  if (phaseItems.length === 0) return null;
                  return phaseItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${PHASE_LABELS[phase]?.color || ""}`}>{PHASE_LABELS[phase]?.label}</span>
                        <span className="truncate">{item.title}</span>
                        {item.completed && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                      </span>
                    </SelectItem>
                  ));
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(form)} disabled={!form.title}><Save className="w-3.5 h-3.5" />{task ? "Update" : "Add"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Unified Files Manager Tab (replaces old Files + Classroom) ──────

const DEFAULT_FOLDERS = [
  "Classroom",
  "Equipment",
  "Uploaded Statements",
  "Partner Agreements",
  "Client Resources",
  "Client Resources/Checklist",
  "Website Resources",
];

function FilesManagerTab() {
  const { data: files = [], refetch } = useQuery<AdminFile[]>({ queryKey: ["/api/files"] });
  const { data: resources = [], refetch: refetchResources } = useQuery<AdminResource[]>({
    queryKey: ["/api/resources/all"],
    queryFn: async () => { const r = await fetch("/api/resources/all", { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (d: Partial<AdminFile>) => { const r = await apiRequest("POST", "/api/files", d); return r.json(); },
    onSuccess: () => { refetch(); toast({ title: "File added" }); setShowAddForm(false); },
    onError: () => { toast({ title: "Failed to add file", variant: "destructive" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/files/${id}`); },
    onSuccess: () => { refetch(); toast({ title: "File deleted" }); },
    onError: () => { toast({ title: "Failed to delete file", variant: "destructive" }); },
  });
  const moveMutation = useMutation({
    mutationFn: async ({ id, folder }: { id: string; folder: string }) => { const r = await apiRequest("PATCH", `/api/files/${id}`, { folder }); return r.json(); },
    onSuccess: () => { refetch(); toast({ title: "File moved" }); setMoveTarget(null); },
  });
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => { const r = await apiRequest("PATCH", `/api/files/${id}`, { name }); return r.json(); },
    onSuccess: () => { refetch(); toast({ title: "File renamed" }); setRenameTarget(null); },
    onError: () => { toast({ title: "Failed to rename file", variant: "destructive" }); },
  });
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parent }: { name: string; parent: string }) => { const r = await apiRequest("POST", "/api/files/folders", { name, parent }); return r.json(); },
    onSuccess: () => { refetch(); toast({ title: "Folder created" }); setShowNewFolder(false); setNewFolderName(""); },
    onError: (err: any) => { toast({ title: err.message?.includes("409") ? "Folder already exists" : "Failed to create folder", variant: "destructive" }); },
  });
  const starMutation = useMutation({
    mutationFn: async ({ id, starred }: { id: string; starred: number }) => { const r = await apiRequest("PATCH", `/api/files/${id}`, { starred }); return r.json(); },
    onSuccess: () => { refetch(); },
    onError: () => { toast({ title: "Failed to update star", variant: "destructive" }); },
  });

  // State for rename, move, and new folder dialogs
  const [renameTarget, setRenameTarget] = useState<AdminFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveTarget, setMoveTarget] = useState<AdminFile | null>(null);
  const [moveFolder, setMoveFolder] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminFile | null>(null);

  // Merge admin files + resources (Classroom) into one view
  // Collect folder names from marker files BEFORE filtering them out
  const markerFolders = useMemo(() => files.filter(f => f.name === ".folder-marker").map(f => f.folder).filter(Boolean), [files]);

  const allFiles: AdminFile[] = useMemo(() => {
    const resourcesAsFiles: AdminFile[] = resources.map(r => ({
      id: `res-${r.id}`,
      name: r.title,
      size: 0,
      type: r.type === "pdf" ? "document" : r.type === "video" ? "video" : "document",
      category: r.category,
      folder: "Classroom",
      uploadedAt: r.createdAt,
      url: r.url,
      starred: 0,
    }));
    // Exclude hidden folder marker entries from display
    const visibleFiles = files.filter(f => f.name !== ".folder-marker");
    return [...visibleFiles, ...resourcesAsFiles];
  }, [files, resources]);

  // Build folder tree
  const folderTree = useMemo(() => {
    const usedFolders = Array.from(new Set([...allFiles.map(f => f.folder || "").filter(Boolean), ...markerFolders]));
    const allFolders = Array.from(new Set([...DEFAULT_FOLDERS, ...usedFolders])).sort();
    const topLevel: string[] = [];
    const children: Record<string, string[]> = {};
    for (const f of allFolders) {
      const parts = f.split("/");
      if (parts.length === 1) {
        topLevel.push(f);
      } else {
        const parent = parts.slice(0, -1).join("/");
        if (!children[parent]) children[parent] = [];
        children[parent].push(f);
      }
    }
    return { topLevel, children, allFolders };
  }, [allFiles, markerFolders]);

  // Subfolders of current folder
  const subfolders = useMemo(() => {
    if (currentFolder === "") return folderTree.topLevel;
    return (folderTree.children[currentFolder] || []).map(f => f.split("/").pop()!);
  }, [currentFolder, folderTree]);

  // Direct files in current folder (not in subfolders)
  const directFiles = useMemo(() => {
    return allFiles.filter(f => {
      const fileFolder = f.folder || "";
      if (currentFolder === "") return !fileFolder;
      return fileFolder === currentFolder;
    }).filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  }, [allFiles, currentFolder, search]);

  // When searching, show ALL matching files regardless of folder
  const searchResults = useMemo(() => {
    if (!search) return [];
    return allFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [allFiles, search]);

  // File count per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of allFiles) {
      const folder = f.folder || "";
      if (folder) {
        counts[folder] = (counts[folder] || 0) + 1;
        const parts = folder.split("/");
        for (let i = 1; i < parts.length; i++) {
          const parent = parts.slice(0, i).join("/");
          counts[parent] = (counts[parent] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allFiles]);

  const uploadFiles = async (fileList: FileList | File[]) => {
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(fileList)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", currentFolder);
        fd.append("category", currentFolder === "Classroom" ? "classroom" : "general");
        const resp = await fetch("/api/files/upload", { method: "POST", body: fd, credentials: "include" });
        if (!resp.ok) { const e = await resp.json().catch(() => ({ error: "Upload failed" })); throw new Error((e as any).error); }
        uploaded++;
      } catch (err: any) {
        toast({ title: `Failed: ${file.name}`, description: err.message, variant: "destructive" });
      }
    }
    setUploading(false);
    if (uploaded > 0) { refetch(); toast({ title: `${uploaded} file${uploaded > 1 ? "s" : ""} uploaded` }); }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files); };

  // Helper: file extension from URL or name
  const getFileExt = (file: AdminFile) => {
    const src = file.url || file.name || "";
    const match = src.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    return match ? match[1].toLowerCase() : "";
  };

  // Helper: extract YouTube video ID from URL
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    // youtube.com/watch?v=ID, youtube.com/embed/ID, youtu.be/ID, youtube.com/shorts/ID
    const patterns = [
      /(?:youtube\.com\/watch\?.*v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const isYouTube = (file: AdminFile) => !!getYouTubeId(file.url || "");

  // Helper: get YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string): string | null => {
    const id = getYouTubeId(url);
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  };

  // Helper: is this a PDF file?
  const isPdfFile = (file: AdminFile) => {
    const ext = getFileExt(file);
    return ext === "pdf" || file.url?.toLowerCase().endsWith(".pdf");
  };

  // Helper: get thumbnail URL for any file (for the card preview area)
  const getThumbnailUrl = (file: AdminFile): string | null => {
    if (!file.url) return null;
    // YouTube
    const ytThumb = getYouTubeThumbnail(file.url);
    if (ytThumb) return ytThumb;
    // Images — use the file URL directly
    if (isImageFile(file)) return file.url;
    // PDFs handled by PdfThumbnail component directly
    return null;
  };

  // Helper: is this file actually previewable in browser?
  const isPreviewable = (file: AdminFile) => {
    if (!file.url) return false;
    const ext = getFileExt(file);
    const url = file.url.toLowerCase();
    // YouTube
    if (isYouTube(file)) return true;
    // Images
    if (file.type === "image" || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return true;
    // Video
    if (file.type === "video" || ["mp4", "webm"].includes(ext)) return true;
    // PDFs (only actual PDFs can be rendered in iframe, not .doc/.docx)
    if (ext === "pdf" || url.endsWith(".pdf")) return true;
    // HTML files
    if (ext === "html" || ext === "htm") return true;
    return false;
  };

  // Helper: is image file?
  const isImageFile = (file: AdminFile) => {
    if (file.type === "image") return true;
    const ext = getFileExt(file);
    return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  };

  // Helper: get file type icon with color
  const getFileIcon = (file: AdminFile): { icon: React.ElementType; color: string; bg: string } => {
    const ext = getFileExt(file);
    if (isYouTube(file)) return { icon: Video, color: "text-red-500", bg: "bg-red-500/10" };
    if (isImageFile(file)) return { icon: Image, color: "text-emerald-400", bg: "bg-emerald-400/10" };
    if (file.type === "video" || ["mp4", "webm", "mov"].includes(ext)) return { icon: Video, color: "text-purple-400", bg: "bg-purple-400/10" };
    if (file.type === "spreadsheet" || ["xls", "xlsx", "csv"].includes(ext)) return { icon: FileSpreadsheet, color: "text-green-500", bg: "bg-green-500/10" };
    if (ext === "pdf") return { icon: FileText, color: "text-red-400", bg: "bg-red-400/10" };
    if (["doc", "docx"].includes(ext)) return { icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10" };
    if (["ppt", "pptx"].includes(ext)) return { icon: FileText, color: "text-orange-400", bg: "bg-orange-400/10" };
    if (["zip", "rar", "7z"].includes(ext)) return { icon: File, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (file.type === "document") return { icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10" };
    return { icon: File, color: "text-muted-foreground", bg: "bg-muted/50" };
  };

  // Helper: get human-readable type label
  const getTypeLabel = (file: AdminFile) => {
    if (isYouTube(file)) return "YouTube";
    const ext = getFileExt(file);
    const labels: Record<string, string> = {
      pdf: "PDF", doc: "Word", docx: "Word", xls: "Excel", xlsx: "Excel",
      ppt: "PPT", pptx: "PPT", png: "Image", jpg: "Image", jpeg: "Image",
      gif: "GIF", webp: "Image", svg: "SVG", mp4: "Video", webm: "Video",
      zip: "Archive", csv: "CSV", html: "HTML",
    };
    return labels[ext] || file.type || "File";
  };

  const breadcrumbs = currentFolder ? currentFolder.split("/") : [];
  const [form, setForm] = useState({ name: "", url: "", type: "document", category: "general", folder: "" });
  const [addFileMode, setAddFileMode] = useState<"link" | "upload">("link");
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const [addFileUploading, setAddFileUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<AdminFile | null>(null);

  // Which files to display: search results (global) or directFiles (in current folder)
  const displayFiles = search ? searchResults : directFiles;

  // Render a single file card (grid mode)
  const renderFileCard = (file: AdminFile) => {
    const { icon: TypeIcon, color, bg } = getFileIcon(file);
    const isResource = file.id.startsWith("res-");
    const canPreview = isPreviewable(file);
    const typeLabel = getTypeLabel(file);
    const thumbUrl = getThumbnailUrl(file);
    const yt = isYouTube(file);
    const isPdf = isPdfFile(file);

    return (
      <Card key={file.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => {
        if (!file.url) { toast({ title: "File not available", description: "This file was saved without a download link. Try re-uploading it.", variant: "destructive" }); return; }
        if (canPreview) { setPreviewFile(file); } else { window.open(file.url, "_blank", "noopener,noreferrer"); }
      }}>
        {/* Thumbnail area */}
        <div className={`relative h-32 ${thumbUrl ? "bg-black" : isPdf ? "bg-white" : bg} flex items-center justify-center overflow-hidden`}>
          {isPdf && file.url ? (
            <>
              <TypeIcon className={`w-10 h-10 ${color} absolute`} />
              <PdfThumbnail url={file.url} className="w-full h-full object-cover relative z-10" width={300} height={128} />
            </>
          ) : thumbUrl ? (
            <img src={thumbUrl} alt={file.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <TypeIcon className={`w-10 h-10 ${color}`} />
          )}
          {/* YouTube play button overlay */}
          {yt && <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg"><Video className="w-5 h-5 text-white ml-0.5" /></div></div>}
          {/* Type badge */}
          <span className={`absolute top-2 left-2 text-[9px] font-semibold px-1.5 py-0.5 rounded ${yt ? "bg-red-600 text-white" : `${bg} ${color}`} border border-current/10`}>{typeLabel}</span>
          {/* Star button */}
          {!isResource && (
            <Button variant="ghost" size="icon" className={`absolute top-1.5 right-1.5 h-7 w-7 ${file.starred ? "text-yellow-400 opacity-100" : "text-muted-foreground/60 opacity-0 group-hover:opacity-100"} transition-opacity hover:text-yellow-400`}
              onClick={(e) => { e.stopPropagation(); starMutation.mutate({ id: file.id, starred: file.starred ? 0 : 1 }); }} title={file.starred ? "Unstar" : "Star"}>
              <Star className={`w-4 h-4 ${file.starred ? "fill-yellow-400" : ""}`} />
            </Button>
          )}
          {/* Action buttons overlay */}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {canPreview && <Button variant="secondary" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" onClick={() => setPreviewFile(file)} title="Preview"><Eye className="w-3 h-3" /></Button>}
            {file.url && <a href={file.url} download onClick={(e) => e.stopPropagation()}><Button variant="secondary" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm" title="Download"><Download className="w-3 h-3" /></Button></a>}
          </div>
        </div>
        {/* File info */}
        <CardContent className="p-3">
          <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {file.size > 0 && <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>}
            <span className="text-[10px] text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</span>
            {isResource && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">Resource</Badge>}
            {!file.url && <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">No link</Badge>}
          </div>
          {search && file.folder && <p className="text-[10px] text-muted-foreground mt-1 truncate">in {file.folder}</p>}
          {/* Bottom actions */}
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
            {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex-1"><Button variant="ghost" size="sm" className="h-7 w-full text-xs"><ExternalLink className="w-3 h-3 mr-1" />Open</Button></a>}
            {file.url && <a href={file.url} download><Button variant="ghost" size="sm" className="h-7 text-xs"><Download className="w-3 h-3" /></Button></a>}
            {!isResource && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setRenameTarget(file); setRenameValue(file.name); }} title="Rename"><Edit3 className="w-3 h-3" /></Button>}
            {!isResource && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setMoveTarget(file); setMoveFolder(file.folder || ""); }} title="Move"><FolderOpen className="w-3 h-3" /></Button>}
            {!isResource && <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteTarget(file)}><Trash2 className="w-3 h-3" /></Button>}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render file row (list mode)
  const renderFileRow = (file: AdminFile) => {
    const { icon: TypeIcon, color } = getFileIcon(file);
    const isResource = file.id.startsWith("res-");
    const canPreview = isPreviewable(file);
    const typeLabel = getTypeLabel(file);
    const thumbUrl = getThumbnailUrl(file);
    const isPdf = isPdfFile(file);

    return (
      <div key={file.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => {
        if (!file.url) { toast({ title: "File not available", description: "This file was saved without a download link. Try re-uploading it.", variant: "destructive" }); return; }
        if (canPreview) { setPreviewFile(file); } else { window.open(file.url, "_blank", "noopener,noreferrer"); }
      }}>
        {/* Star indicator */}
        {!isResource && (
          <Button variant="ghost" size="icon" className={`h-6 w-6 shrink-0 ${file.starred ? "text-yellow-400" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100"} transition-opacity hover:text-yellow-400`}
            onClick={(e) => { e.stopPropagation(); starMutation.mutate({ id: file.id, starred: file.starred ? 0 : 1 }); }}>
            <Star className={`w-3.5 h-3.5 ${file.starred ? "fill-yellow-400" : ""}`} />
          </Button>
        )}
        {/* Thumbnail */}
        <div className={`w-10 h-10 rounded-md ${thumbUrl ? "bg-black" : isPdf ? "bg-white" : "bg-muted/50"} flex items-center justify-center shrink-0 overflow-hidden relative`}>
          {isPdf && file.url ? (
            <>
              <TypeIcon className={`w-5 h-5 ${color} absolute`} />
              <PdfThumbnail url={file.url} className="w-full h-full object-cover rounded-md relative z-10" width={40} height={40} />
            </>
          ) : thumbUrl ? (
            <img src={thumbUrl} alt="" className="w-full h-full object-cover rounded-md" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <TypeIcon className={`w-5 h-5 ${color}`} />
          )}
          {isYouTube(file) && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center"><Video className="w-2.5 h-2.5 text-white" /></div></div>}
        </div>
        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-medium ${color}`}>{typeLabel}</span>
            {file.size > 0 && <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>}
            <span className="text-[10px] text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</span>
            {isResource && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">Resource</Badge>}
            {search && file.folder && <span className="text-[10px] text-muted-foreground">in {file.folder}</span>}
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          {canPreview && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewFile(file)} title="Preview"><Eye className="w-3 h-3" /></Button>}
          {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon" className="h-7 w-7" title="Open"><ExternalLink className="w-3 h-3" /></Button></a>}
          {file.url && <a href={file.url} download><Button variant="ghost" size="icon" className="h-7 w-7" title="Download"><Download className="w-3 h-3" /></Button></a>}
          {!isResource && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRenameTarget(file); setRenameValue(file.name); }} title="Rename"><Edit3 className="w-3 h-3" /></Button>}
          {!isResource && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMoveTarget(file); setMoveFolder(file.folder || ""); }} title="Move to folder"><FolderOpen className="w-3 h-3" /></Button>}
          {!isResource && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(file)} title="Delete"><Trash2 className="w-3 h-3" /></Button>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary" />File Manager</h2>
          <p className="text-xs text-muted-foreground mt-1">{allFiles.length} file{allFiles.length !== 1 ? "s" : ""} across {folderTree.allFolders.length} folders</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-none" onClick={() => setViewMode("grid")} title="Grid view"><LayoutGrid className="w-3.5 h-3.5" /></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-none" onClick={() => setViewMode("list")} title="List view"><LayoutList className="w-3.5 h-3.5" /></Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setNewFolderName(""); setShowNewFolder(true); }}><FolderOpen className="w-3.5 h-3.5" />New Folder</Button>
          <Button size="sm" variant="outline" onClick={() => { setForm({ name: "", url: "", type: "document", category: "general", folder: currentFolder }); setAddFileMode("link"); setShowAddForm(true); }}><Plus className="w-3.5 h-3.5" />Add File</Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-3.5 h-3.5" />Upload</Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <Button variant="ghost" size="sm" className={`h-7 text-xs ${currentFolder === "" ? "font-bold text-primary" : ""}`} onClick={() => setCurrentFolder("")}>
          <FolderOpen className="w-3 h-3 mr-1" />All Files
        </Button>
        {breadcrumbs.map((crumb, i) => {
          const path = breadcrumbs.slice(0, i + 1).join("/");
          return (
            <span key={path} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <Button variant="ghost" size="sm" className={`h-7 text-xs ${path === currentFolder ? "font-bold text-primary" : ""}`} onClick={() => setCurrentFolder(path)}>
                {crumb}
              </Button>
            </span>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search all files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        {search && <p className="text-[10px] text-muted-foreground mt-1">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found across all folders</p>}
      </div>

      {/* Starred Files — Quick Access (only on home, not searching) */}
      {!search && currentFolder === "" && (() => {
        const starredFiles = allFiles.filter(f => f.starred && f.name !== ".folder-marker");
        if (starredFiles.length === 0) return null;
        return (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />Starred — Quick Access ({starredFiles.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {starredFiles.map((file) => {
                const { icon: TypeIcon, color, bg } = getFileIcon(file);
                const canPreview = isPreviewable(file);
                const isPdf = isPdfFile(file);
                const ytThumb = getYouTubeThumbnail(file.url || "");
                const isImg = isImageFile(file);
                const hasThumbnail = (isPdf && !!file.url) || !!ytThumb || (isImg && !!file.url);
                return (
                  <Card key={`star-${file.id}`} className="overflow-hidden border-yellow-400/20 hover:border-yellow-400/50 bg-yellow-400/[0.03] transition-colors cursor-pointer group" onClick={() => {
                    if (!file.url) return;
                    if (canPreview) { setPreviewFile(file); } else { window.open(file.url, "_blank", "noopener,noreferrer"); }
                  }}>
                    {hasThumbnail && (
                      <div className={`relative h-24 ${isImg || ytThumb ? "bg-black" : "bg-white"} flex items-center justify-center overflow-hidden`}>
                        {isPdf && file.url ? (
                          <PdfThumbnail url={file.url} className="w-full h-full object-cover" width={300} height={96} />
                        ) : ytThumb ? (
                          <img src={ytThumb} alt="" className="w-full h-full object-cover" />
                        ) : isImg && file.url ? (
                          <img src={file.url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                        {ytThumb && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center"><Video className="w-3.5 h-3.5 text-white ml-0.5" /></div></div>}
                      </div>
                    )}
                    <CardContent className="p-3 flex items-center gap-3">
                      {!hasThumbnail && (
                        <div className={`w-10 h-10 rounded-md ${bg} flex items-center justify-center shrink-0`}>
                          <TypeIcon className={`w-5 h-5 ${color}`} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{file.folder || "Root"} • {getTypeLabel(file)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-yellow-400 shrink-0 hover:text-yellow-500" onClick={(e) => { e.stopPropagation(); starMutation.mutate({ id: file.id, starred: 0 }); }} title="Unstar">
                        <Star className="w-4 h-4 fill-yellow-400" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Upload zone */}
      <Card
        className={`border-2 border-dashed transition-all cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="py-4 text-center">
          <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.zip,.txt,.html" onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }} />
          {uploading ? (
            <><RefreshCw className="w-6 h-6 text-primary mx-auto mb-1 animate-spin" /><p className="text-xs font-medium">Uploading...</p></>
          ) : (
            <><Upload className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1" /><p className="text-xs font-medium">{isDragging ? "Drop files here" : `Drop files to upload${currentFolder ? ` to ${currentFolder}` : ""}`}</p><p className="text-[10px] text-muted-foreground mt-0.5">PDF, DOC, XLS, images, video — up to 50 MB</p></>
          )}
        </CardContent>
      </Card>

      {/* Subfolders (hidden during search) */}
      {subfolders.length > 0 && !search && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Folders</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {subfolders.map((name) => {
              const fullPath = currentFolder ? `${currentFolder}/${name}` : name;
              const count = folderCounts[fullPath] || 0;
              const hasChildren = (folderTree.children[fullPath] || []).length > 0;
              return (
                <Card key={name} className="overflow-visible border-border/50 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors" onClick={() => setCurrentFolder(fullPath)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{count} file{count !== 1 ? "s" : ""}{hasChildren ? " + subfolders" : ""}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Files */}
      {displayFiles.length === 0 && (!subfolders.length || search) ? (
        <Card className="overflow-visible border-dashed">
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{search ? "No files match your search." : "This folder is empty."}</p>
            {!search && <p className="text-xs text-muted-foreground mt-1">Upload files or add links to get started.</p>}
          </CardContent>
        </Card>
      ) : displayFiles.length > 0 ? (
        <div>
          {!search && <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Files ({displayFiles.length})</p>}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {displayFiles.map(renderFileCard)}
            </div>
          ) : (
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-1 divide-y divide-border/30">
                {displayFiles.map(renderFileRow)}
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* Add File Dialog (Link or Upload) */}
      <Dialog open={showAddForm} onOpenChange={(o) => !o && setShowAddForm(false)}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>Add File</DialogTitle><DialogDescription>Upload a file or add a link to an external resource</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button size="sm" variant={addFileMode === "upload" ? "default" : "outline"} className="flex-1" onClick={() => setAddFileMode("upload")}><Upload className="w-3.5 h-3.5 mr-1.5" />Upload File</Button>
              <Button size="sm" variant={addFileMode === "link" ? "default" : "outline"} className="flex-1" onClick={() => setAddFileMode("link")}><ExternalLink className="w-3.5 h-3.5 mr-1.5" />Add Link</Button>
            </div>

            {addFileMode === "upload" ? (
              <>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => addFileInputRef.current?.click()}
                >
                  <input
                    ref={addFileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.zip,.txt,.html"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAddFileUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("folder", form.folder);
                        fd.append("category", form.folder === "Classroom" ? "classroom" : "general");
                        const resp = await fetch("/api/files/upload", { method: "POST", body: fd, credentials: "include" });
                        if (!resp.ok) {
                          const errData = await resp.json().catch(() => ({ error: "Upload failed" }));
                          throw new Error((errData as any).error || "Upload failed");
                        }
                        refetch();
                        toast({ title: "File uploaded", description: `${file.name} added to ${form.folder || "root"}` });
                        setShowAddForm(false);
                      } catch (err: any) {
                        toast({ title: `Upload failed: ${file.name}`, description: err.message, variant: "destructive" });
                      } finally {
                        setAddFileUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  {addFileUploading ? (
                    <><RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" /><p className="text-sm font-medium">Uploading...</p></>
                  ) : (
                    <><Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" /><p className="text-sm font-medium">Click to select a file</p><p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS, images, video — up to 50 MB</p></>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5"><Label className="text-xs">File Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Statement Review Guide.pdf" /></div>
                <div className="space-y-1.5"><Label className="text-xs">URL / Link</Label><Input value={form.url} onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, url: v, ...(getYouTubeId(v) ? { type: "video", name: p.name || "YouTube Video" } : {}) })); }} placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..." /></div>
                <div className="space-y-1.5"><Label className="text-xs">Type</Label><Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="document">Document</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="spreadsheet">Spreadsheet</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              </>
            )}

            {/* Folder Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs">Folder</Label>
              <Select value={form.folder} onValueChange={(v) => setForm((p) => ({ ...p, folder: v === "__root__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select a folder" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">Root (No Folder)</SelectItem>
                  {folderTree.allFolders.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {addFileMode === "link" && (
            <DialogFooter><Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button><Button onClick={() => createMutation.mutate({ name: form.name, url: form.url, type: form.type, category: form.category, folder: form.folder })} disabled={!form.name}><Save className="w-3.5 h-3.5" />Add</Button></DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              {previewFile && (() => { const { icon: Icon, color } = getFileIcon(previewFile); return <Icon className={`w-4 h-4 ${color} shrink-0`} />; })()}
              <span className="truncate">{previewFile?.name}</span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-3">
              {previewFile && <Badge variant="outline" className="text-[10px]">{getTypeLabel(previewFile)}</Badge>}
              {previewFile && previewFile.size > 0 && <span className="text-xs">{formatBytes(previewFile.size)}</span>}
              {previewFile?.folder && <span className="text-xs text-muted-foreground">in {previewFile.folder}</span>}
              {previewFile && !previewFile.id.startsWith("res-") && (
                <Button variant="ghost" size="icon" className={`h-6 w-6 ml-auto ${previewFile.starred ? "text-yellow-400" : "text-muted-foreground"} hover:text-yellow-400`}
                  onClick={() => starMutation.mutate({ id: previewFile.id, starred: previewFile.starred ? 0 : 1 })}>
                  <Star className={`w-3.5 h-3.5 ${previewFile.starred ? "fill-yellow-400" : ""}`} />
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-black/20">
            {previewFile?.url && (() => {
              const url = previewFile.url;
              const ext = getFileExt(previewFile);
              const isImg = isImageFile(previewFile);
              const isVid = previewFile.type === "video" || ["mp4", "webm"].includes(ext);
              const isPdf = ext === "pdf" || url.toLowerCase().endsWith(".pdf");
              const isHtml = ext === "html" || ext === "htm";
              const ytId = getYouTubeId(url);

              if (ytId) {
                return <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} title={previewFile.name} className="w-full h-[65vh] border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
              }
              if (isImg) {
                return <img src={url} alt={previewFile.name} className="max-w-full max-h-[65vh] mx-auto object-contain p-2" />;
              }
              if (isVid) {
                return <video src={url} controls className="w-full max-h-[65vh] mx-auto" />;
              }
              if (isPdf) {
                return <PdfViewer url={url} className="w-full h-[65vh]" />;
              }
              if (isHtml) {
                return <iframe src={url} title={previewFile.name} className="w-full h-[65vh] border-0 bg-white rounded" />;
              }
              return (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  {(() => { const { icon: Icon, color } = getFileIcon(previewFile); return <Icon className={`w-16 h-16 ${color} opacity-30 mb-4`} />; })()}
                  <p className="text-sm font-medium mb-1">{previewFile.name}</p>
                  <p className="text-xs text-muted-foreground mb-4">This file type ({getTypeLabel(previewFile)}) can't be previewed in the browser.</p>
                  <div className="flex gap-2">
                    <a href={url} download><Button variant="outline"><Download className="w-3.5 h-3.5 mr-1.5" />Download</Button></a>
                    <Button onClick={() => window.open(url, "_blank", "noopener,noreferrer")}><ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open in New Tab</Button>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {previewFile?.url && <a href={previewFile.url} download><Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />Download</Button></a>}
            {previewFile?.url && <Button variant="outline" size="sm" onClick={() => window.open(previewFile.url, "_blank", "noopener,noreferrer")}><ExternalLink className="w-3.5 h-3.5 mr-1.5" />Open in New Tab</Button>}
            <Button variant="outline" size="sm" onClick={() => setPreviewFile(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename File Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename File</DialogTitle><DialogDescription>Enter a new name for this file</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="File name" autoFocus onKeyDown={(e) => { if (e.key === "Enter" && renameValue.trim() && renameTarget) renameMutation.mutate({ id: renameTarget.id, name: renameValue.trim() }); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={() => { if (renameTarget && renameValue.trim()) renameMutation.mutate({ id: renameTarget.id, name: renameValue.trim() }); }} disabled={!renameValue.trim() || renameValue === renameTarget?.name}><Save className="w-3.5 h-3.5" />Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move File Dialog */}
      <Dialog open={!!moveTarget} onOpenChange={(o) => !o && setMoveTarget(null)}>
        <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>Move File</DialogTitle><DialogDescription>Select destination folder for &ldquo;{moveTarget?.name}&rdquo;</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Current folder: <span className="font-medium">{moveTarget?.folder || "Root"}</span></Label>
            <Select value={moveFolder || "__root__"} onValueChange={(v) => setMoveFolder(v === "__root__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select folder" /></SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="__root__">Root (No Folder)</SelectItem>
                {folderTree.allFolders.map((f) => (
                  <SelectItem key={f} value={f}>{f}{f === (moveTarget?.folder || "") ? " (current)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveTarget(null)}>Cancel</Button>
            <Button onClick={() => { if (moveTarget) { if (moveFolder === (moveTarget.folder || "")) { toast({ title: "File is already in this folder" }); return; } moveMutation.mutate({ id: moveTarget.id, folder: moveFolder }); } }}><FolderOpen className="w-3.5 h-3.5" />Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={(o) => !o && setShowNewFolder(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create New Folder</DialogTitle><DialogDescription>{currentFolder ? `Inside "${currentFolder}"` : "At the root level"}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" autoFocus onKeyDown={(e) => { if (e.key === "Enter" && newFolderName.trim()) createFolderMutation.mutate({ name: newFolderName.trim(), parent: currentFolder }); }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            <Button onClick={() => { if (newFolderName.trim()) createFolderMutation.mutate({ name: newFolderName.trim(), parent: currentFolder }); }} disabled={!newFolderName.trim()}><FolderOpen className="w-3.5 h-3.5" />Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Delete File</DialogTitle>
            <DialogDescription>Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}><Trash2 className="w-3.5 h-3.5" />Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Integrations Tab ────────────────────────────────────────────────

function IntegrationsTab() {
  const { data: slackCfg, refetch: refetchSlack } = useQuery<SlackConfig>({ queryKey: ["/api/integrations/slack"] });
  const [slack, setSlack] = useState<SlackConfig>({ webhookUrl: "", channel: "#general", enabled: false, notifyNewLead: true, notifyNewClient: true, notifyRevenue: false, notifyTaskDue: true });
  const { toast } = useToast();

  useEffect(() => { if (slackCfg) setSlack(slackCfg); }, [slackCfg]);

  const saveSlackMutation = useMutation({
    mutationFn: async (cfg: SlackConfig) => { const r = await apiRequest("PATCH", "/api/integrations/slack", cfg); return r.json(); },
    onSuccess: () => { refetchSlack(); toast({ title: "Slack settings saved" }); },
  });

  const testSlackMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/integrations/slack/test"); return r.json(); },
    onSuccess: () => { toast({ title: "Test sent", description: "Check your Slack channel" }); },
    onError: () => { toast({ title: "Test failed", description: "Check webhook URL", variant: "destructive" }); },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h2 className="text-lg font-bold flex items-center gap-2"><Plug className="w-5 h-5 text-primary" />Integrations</h2><p className="text-xs text-muted-foreground mt-1">Connect external tools and automate notifications</p></div>

      {/* Slack */}
      <Card className="overflow-visible border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#4A154B]/15 flex items-center justify-center"><Hash className="w-5 h-5 text-[#E01E5A]" /></div>
            <div><CardTitle className="text-sm">Slack Integration</CardTitle><p className="text-xs text-muted-foreground">Get notified in Slack when things happen</p></div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={slack.enabled ? "default" : "outline"}>{slack.enabled ? "Connected" : "Disabled"}</Badge>
              <Switch checked={slack.enabled} onCheckedChange={(v) => setSlack((p) => ({ ...p, enabled: v }))} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Webhook URL</Label><Input value={slack.webhookUrl} onChange={(e) => setSlack((p) => ({ ...p, webhookUrl: e.target.value }))} placeholder="https://hooks.slack.com/services/..." className="text-xs" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Channel</Label><Input value={slack.channel} onChange={(e) => setSlack((p) => ({ ...p, channel: e.target.value }))} placeholder="#general" /></div>
          </div>
          <div>
            <Label className="text-xs mb-2 block">Notify on:</Label>
            <div className="grid grid-cols-2 gap-2">
              {([["notifyNewLead", "New leads"], ["notifyNewClient", "New clients"], ["notifyRevenue", "Revenue recorded"], ["notifyTaskDue", "Tasks due"]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                  <Switch checked={(slack as any)[key]} onCheckedChange={(v) => setSlack((p) => ({ ...p, [key]: v }))} />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => saveSlackMutation.mutate(slack)} disabled={saveSlackMutation.isPending}><Save className="w-3.5 h-3.5" />Save Slack Settings</Button>
            <Button size="sm" variant="outline" onClick={() => testSlackMutation.mutate()} disabled={!slack.webhookUrl || testSlackMutation.isPending}><Send className="w-3.5 h-3.5" />Test Notification</Button>
          </div>
        </CardContent>
      </Card>

      {/* Skool Integration */}
      <Card className="overflow-visible border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-500/15 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-emerald-500" /></div>
            <div><CardTitle className="text-sm">Skool Community</CardTitle><p className="text-xs text-muted-foreground">CashSwipe Clients community hub for training, updates & support</p></div>
            <div className="ml-auto">
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Active</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <p className="text-xs text-muted-foreground">Your clients and team can access the CashSwipe Clients community on Skool for onboarding resources, sales training, and group support.</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">skool.com/cashswipe-clients</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <a href="https://www.skool.com/cashswipe-clients/about?ref=ddf5a5a74b274ecfa88bad706ad88a82" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" />Open Community</a>
            </Button>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText("https://www.skool.com/cashswipe-clients/about?ref=ddf5a5a74b274ecfa88bad706ad88a82"); }}><Copy className="w-3.5 h-3.5" />Copy Invite Link</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Invoices Tab ───────────────────────────────────────────────────

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  notes: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

const INVOICE_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  paid: { label: "Paid", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  overdue: { label: "Overdue", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  void: { label: "Void", color: "text-muted-foreground bg-muted/30 border-muted-foreground/20" },
};

function InvoicesTab() {
  const { toast } = useToast();
  const { data: invoices = [], refetch } = useQuery<InvoiceRecord[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => { const r = await fetch("/api/invoices", { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<InvoiceRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogFileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ invoiceNumber: "", clientName: "", amount: "", status: "pending", dueDate: "", notes: "" });

  const createInvoice = async (file?: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      fd.append("invoiceNumber", form.invoiceNumber);
      fd.append("clientName", form.clientName);
      fd.append("amount", String(parseFloat(form.amount || "0")));
      fd.append("status", form.status);
      fd.append("dueDate", form.dueDate);
      fd.append("notes", form.notes);
      const resp = await fetch("/api/invoices", { method: "POST", body: fd, credentials: "include" });
      if (!resp.ok) throw new Error("Failed to create invoice");
      refetch();
      setShowDialog(false);
      setSelectedFile(null);
      toast({ title: "Invoice added" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<InvoiceRecord> & { id: string }) => apiRequest("PATCH", `/api/invoices/${id}`, data),
    onSuccess: () => { refetch(); setShowDialog(false); setEditing(null); toast({ title: "Invoice updated" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => { refetch(); toast({ title: "Invoice deleted" }); },
  });

  const quickUpload = async (files: FileList | File[]) => {
    setUploading(true);
    let count = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("invoiceNumber", `INV-${Date.now().toString().slice(-6)}`);
        fd.append("clientName", "");
        fd.append("amount", "0");
        fd.append("status", "pending");
        const resp = await fetch("/api/invoices", { method: "POST", body: fd, credentials: "include" });
        if (!resp.ok) throw new Error("Upload failed");
        count++;
      } catch { /* skip */ }
    }
    setUploading(false);
    if (count > 0) { refetch(); toast({ title: `${count} invoice${count > 1 ? "s" : ""} uploaded` }); }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files.length) quickUpload(e.dataTransfer.files); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const openCreate = () => {
    setEditing(null);
    setSelectedFile(null);
    setForm({ invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, clientName: "", amount: "", status: "pending", dueDate: "", notes: "" });
    setShowDialog(true);
  };

  const openEdit = (inv: InvoiceRecord) => {
    setEditing(inv);
    setSelectedFile(null);
    setForm({ invoiceNumber: inv.invoiceNumber, clientName: inv.clientName, amount: String(inv.amount), status: inv.status, dueDate: inv.dueDate, notes: inv.notes });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) {
      updateMut.mutate({ id: editing.id, invoiceNumber: form.invoiceNumber, clientName: form.clientName, amount: parseFloat(form.amount || "0"), status: form.status, dueDate: form.dueDate, notes: form.notes });
    } else {
      createInvoice(selectedFile || undefined);
    }
  };

  const filtered = filterStatus === "all" ? invoices : invoices.filter(i => i.status === filterStatus);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Invoices</h2>
          <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices — upload and track payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(INVOICE_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5" />New Invoice</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
          <p className="text-lg font-bold text-yellow-400">${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
          <p className="text-lg font-bold text-emerald-400">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Overdue</p>
          <p className="text-lg font-bold text-red-400">${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
      </div>

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed transition-all cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="py-6 text-center">
          <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
            onChange={(e) => { if (e.target.files?.length) quickUpload(e.target.files); e.target.value = ""; }} />
          {uploading ? (
            <><RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" /><p className="text-sm">Uploading...</p></>
          ) : (
            <><Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-medium">{isDragging ? "Drop invoices here" : "Quick upload — drag & drop invoice files"}</p>
            <p className="text-[10px] text-muted-foreground mt-1">PDF, images, DOC, XLS — up to 25MB. Creates draft entries you can edit.</p></>
          )}
        </CardContent>
      </Card>

      {/* Invoice table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Invoice #</TableHead>
                <TableHead className="text-xs">Client</TableHead>
                <TableHead className="text-xs w-24">Amount</TableHead>
                <TableHead className="text-xs w-24">Status</TableHead>
                <TableHead className="text-xs w-24">Due Date</TableHead>
                <TableHead className="text-xs w-16">File</TableHead>
                <TableHead className="text-xs w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No invoices yet. Upload some files or create one manually.</TableCell></TableRow>
              )}
              {filtered.map((inv) => {
                const st = INVOICE_STATUSES[inv.status] || INVOICE_STATUSES.pending;
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm font-medium">{inv.invoiceNumber || "—"}</TableCell>
                    <TableCell className="text-sm">{inv.clientName || <span className="text-muted-foreground italic">No client</span>}</TableCell>
                    <TableCell className="text-sm font-medium">${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.dueDate || "—"}</TableCell>
                    <TableCell>
                      {inv.fileUrl ? (
                        <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] flex items-center gap-0.5"><Paperclip className="w-2.5 h-2.5" />View</a>
                      ) : <span className="text-[10px] text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {inv.status !== "paid" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:text-emerald-300" title="Mark Paid"
                            onClick={() => updateMut.mutate({ id: inv.id, status: "paid", paidDate: new Date().toISOString().split("T")[0] })}>
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inv)}><Edit3 className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={() => { if (confirm("Delete this invoice?")) deleteMut.mutate(inv.id); }}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) { setEditing(null); setSelectedFile(null); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Invoice" : "New Invoice"}</DialogTitle>
            <DialogDescription>{editing ? "Update invoice details." : "Create an invoice and optionally attach a file."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Invoice #</Label>
                <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="INV-001" />
              </div>
              <div>
                <Label className="text-xs">Client Name</Label>
                <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Business name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(INVOICE_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" rows={2} />
            </div>
            {!editing && (
              <div>
                <Label className="text-xs">Attach File</Label>
                <input ref={dialogFileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
                <div className="mt-1">
                  {selectedFile ? (
                    <div className="flex items-center gap-2 text-sm p-2 border rounded">
                      <Paperclip className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate flex-1">{selectedFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => dialogFileRef.current?.click()}>
                      <Upload className="w-3.5 h-3.5" />Choose File
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploading}>{editing ? "Update" : "Create"} Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Resources Manager Tab ──────────────────────────────────────────

const RESOURCE_CATEGORIES: Record<string, string> = {
  "classroom": "CashSwipe Classroom",
  "sales-materials": "Client Sales Resources",
  "pos-systems": "POS Systems & Battlecards",
};

const RESOURCE_TYPES: Record<string, string> = {
  video: "Video", pdf: "PDF", doc: "Guide", template: "Template", link: "Link",
};

function ResourcesManagerTab() {
  const { toast } = useToast();
  const { data: resources = [], refetch } = useQuery<AdminResource[]>({
    queryKey: ["/api/resources/all"],
    queryFn: async () => { const r = await fetch("/api/resources/all", { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });
  const [showDialog, setShowDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<AdminResource | null>(null);
  const [previewResource, setPreviewResource] = useState<AdminResource | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("classroom");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "classroom", type: "doc", url: "", thumbnailUrl: "", featured: false, published: true, order: 1 });

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", uploadCategory);
        fd.append("published", "true");
        const resp = await fetch("/api/resources/upload", { method: "POST", body: fd, credentials: "include" });
        if (!resp.ok) { const e = await resp.json().catch(() => ({ error: "Upload failed" })); throw new Error(e.error); }
        uploaded++;
      } catch (err: any) {
        toast({ title: `Failed to upload ${file.name}`, description: err.message, variant: "destructive" });
      }
    }
    setUploading(false);
    if (uploaded > 0) {
      refetch();
      toast({ title: `${uploaded} file${uploaded > 1 ? "s" : ""} uploaded` });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<AdminResource> & { id: string }) => apiRequest("PATCH", `/api/resources/${id}`, data),
    onSuccess: () => { refetch(); setShowDialog(false); setEditingResource(null); toast({ title: "Resource updated" }); },
    onError: () => { toast({ title: "Failed to update resource", variant: "destructive" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/resources/${id}`),
    onSuccess: () => { refetch(); toast({ title: "Resource deleted" }); },
    onError: () => { toast({ title: "Failed to delete resource", variant: "destructive" }); },
  });

  const openEdit = (r: AdminResource) => {
    setEditingResource(r);
    setForm({ title: r.title, description: r.description, category: r.category, type: r.type, url: r.url, thumbnailUrl: r.thumbnailUrl, featured: r.featured, published: r.published, order: r.order });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingResource) {
      updateMut.mutate({ id: editingResource.id, ...form });
    }
  };

  const isPreviewable = (r: AdminResource) => {
    if (!r.url) return false;
    const lower = r.url.toLowerCase();
    return r.type === "pdf" || lower.endsWith(".pdf") || lower.endsWith(".ppt") || lower.endsWith(".pptx") ||
      lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".webp");
  };

  const isImage = (url: string) => /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
  const isPdf = (r: AdminResource) => r.type === "pdf" || r.url?.toLowerCase().endsWith(".pdf");
  const isPpt = (r: AdminResource) => /\.(ppt|pptx)$/i.test(r.url || "");

  const getTypeIcon = (r: AdminResource) => {
    if (isPdf(r)) return <FileText className="w-8 h-8 text-orange-400" />;
    if (isPpt(r)) return <File className="w-8 h-8 text-red-400" />;
    if (r.type === "video") return <Video className="w-8 h-8 text-purple-400" />;
    if (r.type === "doc") return <FileText className="w-8 h-8 text-blue-400" />;
    if (r.type === "template") return <File className="w-8 h-8 text-emerald-400" />;
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const getTypeBadgeColor = (r: AdminResource) => {
    if (isPdf(r)) return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    if (isPpt(r)) return "text-red-400 bg-red-400/10 border-red-400/20";
    if (r.type === "video") return "text-purple-400 bg-purple-400/10 border-purple-400/20";
    if (r.type === "doc") return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    if (r.type === "template") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    return "text-muted-foreground bg-muted/30";
  };

  const getTypeLabel = (r: AdminResource) => {
    if (isPpt(r)) return "PowerPoint";
    return RESOURCE_TYPES[r.type] || r.type;
  };

  const getPreviewUrl = (r: AdminResource) => {
    if (!r.url) return "";
    if (isPdf(r)) return r.url;
    if (isPpt(r)) return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + r.url)}`;
    return r.url;
  };

  const filtered = filterCat === "all" ? resources : resources.filter((r) => r.category === filterCat);
  const grouped = Object.entries(RESOURCE_CATEGORIES).map(([catId, catLabel]) => ({
    id: catId,
    label: catLabel,
    items: filtered.filter((r) => r.category === catId),
  })).filter((g) => filterCat === "all" ? g.items.length > 0 : g.id === filterCat);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" />Classroom Tools</h2>
          <p className="text-xs text-muted-foreground mt-1">Upload and manage files — {resources.length} total, {resources.filter((r) => r.published).length} published</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(RESOURCE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drag-and-drop upload zone */}
      <Card
        className={`border-2 border-dashed transition-all cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="py-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.zip,.txt,.html"
            onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }}
          />
          {uploading ? (
            <>
              <RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
              <p className="text-sm font-medium">Uploading files...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium">{isDragging ? "Drop files here" : "Drag & drop files or click to browse"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">PDF, DOC, XLS, PPT, images, videos, ZIP</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Label className="text-[10px] text-muted-foreground">Upload to:</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger className="w-[180px] h-7 text-[10px]" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RESOURCE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gallery by category */}
      {grouped.map((group) => (
        <div key={group.id} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            {group.label}
            <Badge variant="outline" className="text-[10px]">{group.items.length}</Badge>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.items.map((r) => (
              <Card
                key={r.id}
                className={`overflow-hidden group relative transition-all hover:shadow-md hover:border-primary/30 ${!r.published ? "opacity-60" : ""}`}
              >
                {/* Thumbnail / Preview area */}
                <div
                  className="aspect-[4/3] bg-muted/30 flex items-center justify-center relative cursor-pointer overflow-hidden"
                  onClick={() => isPreviewable(r) ? setPreviewResource(r) : r.url && window.open(r.url, "_blank")}
                >
                  {r.thumbnailUrl || (r.url && isImage(r.url)) ? (
                    <img src={r.thumbnailUrl || r.url} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      {getTypeIcon(r)}
                      <Badge variant="outline" className={`text-[9px] ${getTypeBadgeColor(r)}`}>
                        {getTypeLabel(r)}
                      </Badge>
                    </div>
                  )}

                  {/* Hover overlay with preview button */}
                  {isPreviewable(r) && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary" className="text-xs gap-1.5">
                        <ExternalLink className="w-3 h-3" />
                        Preview
                      </Button>
                    </div>
                  )}

                  {/* Featured star */}
                  {r.featured && (
                    <div className="absolute top-1.5 right-1.5">
                      <Badge variant="outline" className="text-[9px] bg-amber-400/20 text-amber-400 border-amber-400/30"><Star className="w-2.5 h-2.5" /></Badge>
                    </div>
                  )}

                  {/* Status indicator */}
                  {!r.published && (
                    <div className="absolute top-1.5 left-1.5">
                      <Badge variant="outline" className="text-[9px] bg-muted/80 text-muted-foreground">Draft</Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold truncate" title={r.title}>{r.title}</p>
                  {r.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{r.description}</p>}

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="outline" className={`text-[9px] cursor-pointer ${r.published ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-muted-foreground bg-muted/30"}`}
                      onClick={() => updateMut.mutate({ id: r.id, published: !r.published })}>
                      {r.published ? "Published" : "Draft"}
                    </Badge>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => updateMut.mutate({ id: r.id, featured: !r.featured })} title={r.featured ? "Remove featured" : "Mark featured"}>
                        <Star className={`w-3 h-3 ${r.featured ? "text-amber-400 fill-amber-400" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => openEdit(r)} title="Edit"><Edit3 className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100 text-red-400 hover:text-red-300" onClick={() => { if (confirm("Delete this resource?")) deleteMut.mutate(r.id); }} title="Delete"><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <Card className="border-dashed"><CardContent className="p-8 text-center">
          <GraduationCap className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No files yet. Upload some files above to get started.</p>
        </CardContent></Card>
      )}

      {/* File Preview Dialog */}
      <Dialog open={!!previewResource} onOpenChange={(o) => { if (!o) setPreviewResource(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-5 py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm truncate">{previewResource?.title}</DialogTitle>
                <DialogDescription className="text-[10px] truncate">{previewResource?.description || getTypeLabel(previewResource!)}</DialogDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {previewResource?.url && (
                  <Button variant="outline" size="sm" className="text-xs h-7 gap-1" asChild>
                    <a href={previewResource.url} target="_blank" rel="noopener noreferrer" download>
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/20">
            {previewResource && isPdf(previewResource) && (
              <iframe
                src={previewResource.url}
                className="w-full h-full border-0"
                title={previewResource.title}
              />
            )}
            {previewResource && isPpt(previewResource) && (
              <iframe
                src={getPreviewUrl(previewResource)}
                className="w-full h-full border-0"
                title={previewResource.title}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            )}
            {previewResource && previewResource.url && isImage(previewResource.url) && (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img src={previewResource.url} alt={previewResource.title} className="max-w-full max-h-full object-contain rounded" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) setEditingResource(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update the resource details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resource title" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(RESOURCE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(RESOURCE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Display Order</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} min={1} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.featured} onCheckedChange={(c) => setForm({ ...form, featured: !!c })} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: !!c })} />
                Published
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title}>Update Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Activity Tab ────────────────────────────────────────────────────

function ActivityTab() {
  const { data: activity = [], refetch } = useQuery<ActivityEntry[]>({ queryKey: ["/api/activity"], refetchInterval: 15000 });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Activity Feed</h2><p className="text-xs text-muted-foreground mt-1">Real-time log of all admin actions</p></div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" />Refresh</Button>
      </div>
      {activity.length === 0 ? (
        <Card className="overflow-visible border-dashed"><CardContent className="p-8 text-center"><Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No activity yet. Actions will appear here as you use the dashboard.</p></CardContent></Card>
      ) : (
        <div className="space-y-0">{activity.map((a, i) => (
          <div key={a.id} className="flex gap-4 py-3 border-b border-border/30 last:border-0">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full shrink-0 ${ACTIVITY_COLORS[a.type] || "bg-gray-400"}`} />
              {i < activity.length - 1 && <div className="w-px flex-1 bg-border/30 mt-1" />}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{a.action}</span>
                <Badge variant="outline" className="text-[9px]">{a.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(a.timestamp)} — {new Date(a.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

// ─── Team & Business Tab ─────────────────────────────────────────────

function TeamTab() {
  const { data: team = [], refetch: refetchTeam } = useQuery<TeamMember[]>({ queryKey: ["/api/team-members"] });
  const { data: biz, refetch: refetchBiz } = useQuery<BusinessInfoData>({ queryKey: ["/api/business-info"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", role: "", email: "", phone: "", dailyInvolvement: "full" });
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [bizForm, setBizForm] = useState<Partial<BusinessInfoData>>({});
  const [bizDirty, setBizDirty] = useState(false);
  const { toast } = useToast();

  useEffect(() => { if (biz) { setBizForm(biz); setBizDirty(false); } }, [biz]);

  const createMemberMutation = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/team-members", data); return r.json(); },
    onSuccess: () => { refetchTeam(); toast({ title: "Team member added" }); setShowMemberForm(false); setMemberForm({ name: "", role: "", email: "", phone: "", dailyInvolvement: "full" }); },
    onError: () => { toast({ title: "Failed to add team member", variant: "destructive" }); },
  });
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => { const r = await apiRequest("PATCH", `/api/team-members/${id}`, data); return r.json(); },
    onSuccess: () => { refetchTeam(); setEditingMember(null); toast({ title: "Team member updated" }); },
    onError: () => { toast({ title: "Failed to update team member", variant: "destructive" }); },
  });
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/team-members/${id}`); },
    onSuccess: () => { refetchTeam(); toast({ title: "Team member removed" }); },
    onError: () => { toast({ title: "Failed to remove team member", variant: "destructive" }); },
  });
  const saveBizMutation = useMutation({
    mutationFn: async (data: Partial<BusinessInfoData>) => { const r = await apiRequest("PATCH", "/api/business-info", data); return r.json(); },
    onSuccess: () => { refetchBiz(); setBizDirty(false); toast({ title: "Business info saved" }); },
  });

  const PHASE_CONFIG: Record<string, { label: string; color: string }> = {
    onboarding: { label: "Onboarding & Training", color: "text-blue-400" },
    training: { label: "Advanced Training", color: "text-cyan-400" },
    "pre-launch": { label: "Pre-Launch Prep", color: "text-yellow-400" },
    active: { label: "Active Sales", color: "text-emerald-400" },
    scaling: { label: "Scaling", color: "text-purple-400" },
  };

  const INVOLVEMENT_LABELS: Record<string, string> = { minimal: "Minimal", "part-time": "Part-Time", full: "Full-Time" };

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" />Team & Business</h2><p className="text-xs text-muted-foreground mt-1">Manage your team, business details, and client assignments. Everyone on the team can see this.</p></div>

      {/* Business Info */}
      <Card className="overflow-visible border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Building className="w-4 h-4" />Business Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Company Name</Label><Input value={bizForm.companyName || ""} onChange={(e) => { setBizForm(f => ({ ...f, companyName: e.target.value })); setBizDirty(true); }} placeholder="TechSavvy Hawaii LLC" /></div>
            <div className="space-y-1.5"><Label className="text-xs">DBA (Doing Business As)</Label><Input value={bizForm.dba || ""} onChange={(e) => { setBizForm(f => ({ ...f, dba: e.target.value })); setBizDirty(true); }} placeholder="TechSavvy" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={bizForm.phone || ""} onChange={(e) => { setBizForm(f => ({ ...f, phone: e.target.value })); setBizDirty(true); }} placeholder="808-767-5460" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={bizForm.email || ""} onChange={(e) => { setBizForm(f => ({ ...f, email: e.target.value })); setBizDirty(true); }} placeholder="contact@techsavvyhawaii.com" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Address</Label><Input value={bizForm.address || ""} onChange={(e) => { setBizForm(f => ({ ...f, address: e.target.value })); setBizDirty(true); }} placeholder="Honolulu, HI" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Website</Label><Input value={bizForm.website || ""} onChange={(e) => { setBizForm(f => ({ ...f, website: e.target.value })); setBizDirty(true); }} /></div>
            <div className="space-y-1.5"><Label className="text-xs">EIN / Tax ID</Label><Input value={bizForm.taxId || ""} onChange={(e) => { setBizForm(f => ({ ...f, taxId: e.target.value })); setBizDirty(true); }} placeholder="Pending — Joey is handling" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Processor Partner</Label><Input value={bizForm.processorPartner || ""} onChange={(e) => { setBizForm(f => ({ ...f, processorPartner: e.target.value })); setBizDirty(true); }} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Current Phase</Label>
              <Select value={bizForm.currentPhase || "onboarding"} onValueChange={(v) => { setBizForm(f => ({ ...f, currentPhase: v })); setBizDirty(true); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PHASE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Notes</Label><Textarea value={bizForm.notes || ""} onChange={(e) => { setBizForm(f => ({ ...f, notes: e.target.value })); setBizDirty(true); }} rows={2} className="resize-none text-sm" placeholder="Any notes about the business..." /></div>
          {bizDirty && <div className="flex justify-end"><Button size="sm" onClick={() => saveBizMutation.mutate(bizForm)}><Save className="w-3.5 h-3.5" />Save Business Info</Button></div>}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="overflow-visible border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" />Team Members ({team.length})</CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowMemberForm(true)}><Plus className="w-3 h-3" />Add Member</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {team.map((m) => (
              <div key={m.id} className="flex items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0">{m.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-4">{INVOLVEMENT_LABELS[m.dailyInvolvement] || m.dailyInvolvement}</Badge>
                      {m.email && <span className="text-[10px] text-muted-foreground truncate max-w-[140px] sm:max-w-none">{m.email}</span>}
                      {m.phone && <span className="text-[10px] text-muted-foreground">{m.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingMember(m)}><Edit3 className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMemberMutation.mutate(m.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Assignments */}
      <Card className="overflow-visible border-border/50">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" />Client-Team Assignments</CardTitle></CardHeader>
        <CardContent>
          {clients.length === 0 ? <p className="text-xs text-muted-foreground py-2">No clients yet. Once you add clients, you can assign them to team members here.</p> : (
            <div className="space-y-2">{clients.map((c) => {
              const assignMatch = c.notes?.match(/\[ASSIGNED:([^\]]+)\]/);
              const assignedId = assignMatch ? assignMatch[1] : "";
              const assignedMember = team.find(m => m.id === assignedId);
              return (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/30">
                  <div>
                    <p className="text-xs font-medium">{c.business || c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.package} — {c.maintenance !== "none" ? c.maintenance : "no maintenance"}{assignedMember ? ` • ${assignedMember.name}` : ""}</p>
                  </div>
                  <Select value={assignedId || "unassigned"} onValueChange={async (v) => {
                    try {
                      const cleanNotes = (c.notes || "").replace(/\[ASSIGNED:[^\]]+\]\s*/g, "");
                      const newNotes = v !== "unassigned" ? `[ASSIGNED:${v}] ${cleanNotes}` : cleanNotes;
                      await apiRequest("PATCH", `/api/clients/${c.id}`, { notes: newNotes });
                      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                      toast({ title: "Assignment updated" });
                    } catch { toast({ title: "Failed to assign", variant: "destructive" }); }
                  }}>
                    <SelectTrigger className="w-[140px] h-7 text-xs"><SelectValue placeholder="Assign..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {team.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}</div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showMemberForm} onOpenChange={(o) => !o && setShowMemberForm(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle><DialogDescription>Add a new member to the team</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Name *</Label><Input value={memberForm.name} onChange={(e) => setMemberForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Involvement</Label>
                <Select value={memberForm.dailyInvolvement} onValueChange={(v) => setMemberForm(f => ({ ...f, dailyInvolvement: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="full">Full-Time</SelectItem><SelectItem value="part-time">Part-Time</SelectItem><SelectItem value="minimal">Minimal</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Role / Responsibilities</Label><Input value={memberForm.role} onChange={(e) => setMemberForm(f => ({ ...f, role: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={memberForm.email} onChange={(e) => setMemberForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={memberForm.phone} onChange={(e) => setMemberForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowMemberForm(false)}>Cancel</Button><Button onClick={() => createMemberMutation.mutate(memberForm)} disabled={!memberForm.name}><Plus className="w-3.5 h-3.5" />Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(o) => !o && setEditingMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Team Member</DialogTitle><DialogDescription>Update member details</DialogDescription></DialogHeader>
          {editingMember && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={editingMember.name} onChange={(e) => setEditingMember(m => m ? { ...m, name: e.target.value } : m)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Involvement</Label>
                  <Select value={editingMember.dailyInvolvement} onValueChange={(v) => setEditingMember(m => m ? { ...m, dailyInvolvement: v } : m)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="full">Full-Time</SelectItem><SelectItem value="part-time">Part-Time</SelectItem><SelectItem value="minimal">Minimal</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Role</Label><Input value={editingMember.role} onChange={(e) => setEditingMember(m => m ? { ...m, role: e.target.value } : m)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={editingMember.email} onChange={(e) => setEditingMember(m => m ? { ...m, email: e.target.value } : m)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={editingMember.phone} onChange={(e) => setEditingMember(m => m ? { ...m, phone: e.target.value } : m)} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button><Button onClick={() => editingMember && updateMemberMutation.mutate(editingMember)}><Save className="w-3.5 h-3.5" />Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Schedule Tab ────────────────────────────────────────────────────

function ScheduleTab() {
  const { data: schedule = [], refetch: refetchSchedule } = useQuery<ScheduleItem[]>({ queryKey: ["/api/schedule"] });
  const { data: team = [] } = useQuery<TeamMember[]>({ queryKey: ["/api/team-members"] });
  const [showForm, setShowForm] = useState(false);
  const [viewDate, setViewDate] = useState(today());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [form, setForm] = useState({ title: "", description: "", date: today(), time: "09:00", duration: 30, assigneeId: "", priority: "medium", category: "general" });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const r = await apiRequest("POST", "/api/schedule", data); return r.json(); },
    onSuccess: () => { refetchSchedule(); toast({ title: "Scheduled" }); setShowForm(false); setForm({ title: "", description: "", date: today(), time: "09:00", duration: 30, assigneeId: "", priority: "medium", category: "general" }); },
    onError: () => { toast({ title: "Failed to create schedule item", variant: "destructive" }); },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const r = await apiRequest("PATCH", `/api/schedule/${id}`, { status }); return r.json(); },
    onSuccess: () => refetchSchedule(),
    onError: () => { toast({ title: "Failed to update status", variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/schedule/${id}`); },
    onSuccess: () => { refetchSchedule(); toast({ title: "Schedule item deleted" }); },
    onError: () => { toast({ title: "Failed to delete", variant: "destructive" }); },
  });

  const [aiLoading, setAiLoading] = useState(false);
  const handleAiRecommend = async () => {
    setAiLoading(true);
    try {
      const r = await apiRequest("POST", "/api/ai-ops/recommend");
      const data = await r.json();
      if (data.recommendations?.length > 0) {
        for (const rec of data.recommendations) {
          const member = team.find(m => m.name.toLowerCase() === rec.assigneeName?.toLowerCase());
          await apiRequest("POST", "/api/schedule", {
            title: rec.title,
            description: rec.description,
            date: today(),
            assigneeId: member?.id || "",
            priority: rec.priority || "medium",
            category: rec.category || "general",
            isAiGenerated: true,
          });
        }
        refetchSchedule();
        toast({ title: `${data.recommendations.length} AI tasks added to today's schedule` });
      }
    } catch { toast({ title: "Failed to get AI recommendations", variant: "destructive" }); }
    setAiLoading(false);
  };

  const getWeekDates = (d: string) => {
    const date = new Date(d + "T12:00:00");
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      return dt.toISOString().split("T")[0];
    });
  };

  const weekDates = getWeekDates(viewDate);
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const CATEGORY_COLORS: Record<string, string> = { training: "bg-blue-400", outreach: "bg-orange-400", admin: "bg-gray-400", meeting: "bg-purple-400", "follow-up": "bg-cyan-400", development: "bg-pink-400", general: "bg-muted-foreground" };
  const PRIORITY_COLORS: Record<string, string> = { high: "text-red-400", medium: "text-yellow-400", low: "text-muted-foreground" };

  const filteredItems = viewMode === "day"
    ? schedule.filter(s => s.date === viewDate)
    : schedule.filter(s => weekDates.includes(s.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Schedule</h2><p className="text-xs text-muted-foreground mt-1">Daily and weekly task schedule — visible to the whole team</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleAiRecommend} disabled={aiLoading}>
            <Sparkles className="w-3 h-3" />{aiLoading ? "Generating..." : "AI Recommend"}
          </Button>
          <Button size="sm" className="text-xs h-7" onClick={() => { setForm(f => ({ ...f, date: viewDate })); setShowForm(true); }}><Plus className="w-3 h-3" />Add Task</Button>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant={viewMode === "day" ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => setViewMode("day")}>Day</Button>
          <Button variant={viewMode === "week" ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => setViewMode("week")}>Week</Button>
        </div>
        <Input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="w-auto h-7 text-xs" />
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setViewDate(today())}>Today</Button>
      </div>

      {/* Schedule items */}
      {viewMode === "day" ? (
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <Card className="border-dashed border-border/50"><CardContent className="p-6 text-center"><p className="text-xs text-muted-foreground">No tasks scheduled for this day. Click "AI Recommend" to get suggestions or add tasks manually.</p></CardContent></Card>
          ) : filteredItems.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99")).map((item) => {
            const member = team.find(m => m.id === item.assigneeId);
            return (
              <Card key={item.id} className={`overflow-visible border-border/50 ${item.status === "completed" ? "opacity-60" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <Checkbox checked={item.status === "completed"} onCheckedChange={(v) => toggleStatusMutation.mutate({ id: item.id, status: v ? "completed" : "pending" })} className="mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold ${item.status === "completed" ? "line-through" : ""}`}>{item.title}</span>
                          {item.isAiGenerated && <Sparkles className="w-3 h-3 text-primary" />}
                          <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[item.category] || "bg-muted"}`} />
                          <span className={`text-[10px] ${PRIORITY_COLORS[item.priority] || ""}`}>{item.priority}</span>
                        </div>
                        {item.description && <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {item.time && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{item.time}</span>}
                          {member && <Badge variant="outline" className="text-[10px] h-4">{member.name}</Badge>}
                          {!member && item.assigneeId && <Badge variant="outline" className="text-[10px] h-4">AI</Badge>}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-7 gap-2 min-w-[600px] sm:min-w-0">
            {weekDates.map((d, i) => {
              const dayItems = schedule.filter(s => s.date === d);
              const isToday = d === today();
              return (
                <div key={d} className={`rounded-lg border p-2 min-h-[120px] ${isToday ? "border-primary/50 bg-primary/5" : "border-border/30"}`}>
                  <p className={`text-[10px] font-semibold mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{DAY_NAMES[i]} {d.slice(5)}</p>
                  <div className="space-y-1">{dayItems.map((item) => (
                    <div key={item.id} className={`rounded px-1.5 py-0.5 text-[9px] cursor-pointer ${item.status === "completed" ? "line-through opacity-50" : ""} ${(CATEGORY_COLORS[item.category] || "bg-muted") + "/10"}`} onClick={() => toggleStatusMutation.mutate({ id: item.id, status: item.status === "completed" ? "pending" : "completed" })}>
                      {item.title.slice(0, 25)}{item.title.length > 25 ? "…" : ""}
                    </div>
                  ))}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Schedule Item</DialogTitle><DialogDescription>Create a new task on the schedule</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Title *</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Complete CashSwipe Module 3" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Time</Label><Input type="time" value={form.time} onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Duration (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Assign To</Label>
                <Select value={form.assigneeId || "unassigned"} onValueChange={(v) => setForm(f => ({ ...f, assigneeId: v === "unassigned" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {team.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    <SelectItem value="ai">AI Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="training">Training</SelectItem><SelectItem value="outreach">Outreach</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="follow-up">Follow-Up</SelectItem><SelectItem value="development">Development</SelectItem><SelectItem value="general">General</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => createMutation.mutate(form)} disabled={!form.title}><Plus className="w-3.5 h-3.5" />Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Prospector Tab ─────────────────────────────────────────────────

interface TechDetection {
  name: string;
  category: string;
  confidence: "high" | "medium" | "low";
  products: string[];
  signatures: string[];
}

interface TechScanResult {
  url: string;
  techStack: TechDetection[];
  title: string;
  error?: string;
}

interface Prospect {
  business: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  vertical: string;
  currentProcessor: string;
  processorConfidence?: string;
  socialLinks?: Record<string, string>;
  notes: string;
  _sourceUrl?: string;
  _techStack?: TechDetection[];
  _selected?: boolean;
}

const GOOGLE_DORK_PRESETS = [
  { label: "Square merchants", category: "Processor Hunt", dork: 'site:square.site "{vertical}" "{location}"', desc: "Find businesses hosted on Square Online" },
  { label: "Powered by Square", category: "Processor Hunt", dork: '"Powered by Square" "{vertical}" "{location}"', desc: "Sites with Square branding" },
  { label: "Square Appointments", category: "Processor Hunt", dork: 'inurl:squareup.com/appointments "{vertical}" "{location}"', desc: "Businesses using Square booking" },
  { label: "Clover merchants", category: "Processor Hunt", dork: '"Powered by Clover" OR "clover.com" "{vertical}" "{location}"', desc: "Find Clover POS users" },
  { label: "Toast restaurants", category: "Processor Hunt", dork: 'site:toasttab.com "{location}"', desc: "Restaurants on Toast online ordering" },
  { label: "Yelp directory", category: "Directory Scrape", dork: 'site:yelp.com "{vertical}" "{location}"', desc: "Yelp business listings" },
  { label: "Google Maps listings", category: "Directory Scrape", dork: 'site:google.com/maps "{vertical}" "{location}"', desc: "Google Maps business results" },
  { label: "Local directory", category: "Directory Scrape", dork: '"{vertical}" "{location}" "contact us" "phone" -site:facebook.com -site:yelp.com', desc: "Direct business websites with contact info" },
  { label: "BBB listings", category: "Directory Scrape", dork: 'site:bbb.org "{vertical}" "{location}"', desc: "Better Business Bureau listings" },
  { label: "Hawaii businesses", category: "Hawaii Local", dork: '"{vertical}" hawaii "phone" "email" -site:facebook.com -site:yelp.com', desc: "Hawaii businesses with contact info" },
  { label: "Honolulu merchants", category: "Hawaii Local", dork: '"{vertical}" honolulu "accepts" OR "payment" OR "credit card"', desc: "Honolulu businesses mentioning payments" },
  { label: "Maui businesses", category: "Hawaii Local", dork: '"{vertical}" maui hawaii "phone" OR "call" -site:tripadvisor.com', desc: "Maui business websites" },
];

function ProspectorTab() {
  const [mode, setMode] = useState<"url" | "dork" | "batch" | "techscan">("dork");
  const [urlInput, setUrlInput] = useState("");
  const [techScanUrls, setTechScanUrls] = useState("");
  const [batchUrls, setBatchUrls] = useState("");
  const [dorkQuery, setDorkQuery] = useState("");
  const [dorkLocation, setDorkLocation] = useState("Honolulu, Hawaii");
  const [dorkVertical, setDorkVertical] = useState("restaurant");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [techResults, setTechResults] = useState<TechScanResult[]>([]);
  const [dorkUrls, setDorkUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const { toast } = useToast();

  const techScanMutation = useMutation({
    mutationFn: async (data: { url: string | string[] }) => {
      const r = await apiRequest("POST", "/api/ai-ops/tech-scan", data);
      return r.json();
    },
    onSuccess: (data) => {
      setTechResults(prev => [...prev, ...(data.results || [])]);
      const total = (data.results || []).length;
      const withTech = (data.results || []).filter((r: TechScanResult) => r.techStack.length > 0).length;
      toast({ title: `Scanned ${total} site(s)`, description: `${withTech} had detectable tech stacks` });
    },
    onError: () => { toast({ title: "Tech scan failed", variant: "destructive" }); },
  });

  const scrapeMutation = useMutation({
    mutationFn: async (data: { url: string | string[]; mode?: string }) => {
      const r = await apiRequest("POST", "/api/ai-ops/scrape-prospects", data);
      return r.json();
    },
    onSuccess: (data) => {
      const newProspects = (data.prospects || []).map((p: Prospect) => ({ ...p, _selected: true }));
      setProspects(prev => [...prev, ...newProspects]);
      toast({ title: `Found ${newProspects.length} prospect(s)`, description: `From ${data.source}` });
    },
    onError: (err: any) => { toast({ title: "Scrape failed", description: err.message, variant: "destructive" }); },
  });

  const dorkMutation = useMutation({
    mutationFn: async (data: { query: string; location: string }) => {
      const r = await apiRequest("POST", "/api/ai-ops/google-dork", data);
      return r.json();
    },
    onSuccess: (data) => {
      // Handle various response states
      if (data.noApiKey) {
        toast({ title: "No API key configured", description: "Use 'Open in Google' to search manually, then paste URLs into URL Scanner.", variant: "destructive" });
        return;
      }
      if (data.aiFailed) {
        toast({ title: "Search unavailable", description: data.message || "Use 'Open in Google' to search manually.", variant: "destructive" });
        return;
      }
      if (data.error && data.message) {
        toast({ title: "Search issue", description: data.message, variant: "destructive" });
      }
      if (data.aiGenerated) {
        toast({ title: "AI-generated prospects", description: "Google was blocked. Results are AI-suggested based on your search criteria." });
      }
      const newProspects = (data.results || []).map((p: Prospect) => ({ ...p, _selected: true }));
      setProspects(prev => [...prev, ...newProspects]);
      setDorkUrls(data.urls || []);
      if (newProspects.length > 0) toast({ title: `Found ${newProspects.length} prospect(s)` });
      else if (!data.aiGenerated && !data.error) toast({ title: "No results found", description: "Try a different dork query or location" });
    },
    onError: (err: Error) => { toast({ title: "Search failed", description: err.message.replace(/^\d+:\s*/, ""), variant: "destructive" }); },
  });

  const importMutation = useMutation({
    mutationFn: async (data: { prospects: Prospect[]; sourceLabel: string }) => {
      const r = await apiRequest("POST", "/api/ai-ops/import-prospects", data);
      return r.json();
    },
    onSuccess: (data) => {
      setImportCount(prev => prev + data.imported);
      toast({ title: `Imported ${data.imported} leads into pipeline` });
      setProspects(prev => prev.filter(p => !p._selected));
    },
  });

  const handleScrapeUrl = () => {
    if (!urlInput.trim()) return;
    scrapeMutation.mutate({ url: urlInput.trim() });
  };

  const handleBatchScrape = () => {
    const urls = batchUrls.split("\n").map(u => u.trim()).filter(u => u && u.startsWith("http"));
    if (urls.length === 0) return;
    scrapeMutation.mutate({ url: urls, mode: "batch" });
  };

  const handleDorkSearch = () => {
    const q = dorkQuery
      .replace(/\{location\}/g, dorkLocation)
      .replace(/\{vertical\}/g, dorkVertical);
    if (!q.trim()) return;
    dorkMutation.mutate({ query: q, location: dorkLocation });
  };

  const handleApplyPreset = (dork: string) => {
    setDorkQuery(dork);
  };

  const handleImportSelected = () => {
    const selected = prospects.filter(p => p._selected);
    if (selected.length === 0) return;
    importMutation.mutate({ prospects: selected, sourceLabel: `AI Prospector - ${mode === "dork" ? "Google Dork" : "URL Scrape"}` });
  };

  const toggleSelect = (idx: number) => {
    setProspects(prev => prev.map((p, i) => i === idx ? { ...p, _selected: !p._selected } : p));
  };

  const toggleSelectAll = () => {
    const allSelected = prospects.every(p => p._selected);
    setProspects(prev => prev.map(p => ({ ...p, _selected: !allSelected })));
  };

  const CONF_COLORS: Record<string, string> = { high: "text-red-400 bg-red-400/10", medium: "text-yellow-400 bg-yellow-400/10", low: "text-muted-foreground bg-muted/30" };
  const isLoading = scrapeMutation.isPending || dorkMutation.isPending || techScanMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Search className="w-5 h-5 text-primary" />AI Lead Prospector</h2>
        <p className="text-xs text-muted-foreground mt-1">Find businesses using competitor payment processors. Scrape directories, run Google dorks, detect Square/Clover/Toast signatures, and import leads directly into your pipeline.</p>
      </div>

      {importCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">{importCount} leads imported this session</span>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/30 w-fit">
        {([
          { key: "dork", label: "Google Dorks", icon: Globe },
          { key: "url", label: "URL Scanner", icon: Search },
          { key: "batch", label: "Batch URLs", icon: FileText },
          { key: "techscan", label: "Tech Stack", icon: Zap },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setMode(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors ${mode === key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          {mode === "dork" && (
            <Card className="overflow-visible border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" />Google Dork Builder</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Location</Label>
                    <Input value={dorkLocation} onChange={(e) => setDorkLocation(e.target.value)} placeholder="Honolulu, Hawaii" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Vertical</Label>
                    <Select value={dorkVertical} onValueChange={setDorkVertical}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(VERTICAL_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Dork Query</Label>
                  <Textarea value={dorkQuery} onChange={(e) => setDorkQuery(e.target.value)} placeholder='site:square.site "restaurant" "honolulu"' className="text-xs min-h-[60px] font-mono" />
                </div>

                <Button size="sm" className="w-full" onClick={handleDorkSearch} disabled={!dorkQuery.trim() || isLoading}>
                  {dorkMutation.isPending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Searching...</> : <><Search className="w-3.5 h-3.5" />Run Dork Search</>}
                </Button>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  <span>If Google blocks, copy query and search manually</span>
                </div>

                <Button variant="outline" size="sm" className="w-full text-[10px] h-7" onClick={() => {
                  const q = dorkQuery.replace(/\{location\}/g, dorkLocation).replace(/\{vertical\}/g, dorkVertical);
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
                }}>
                  <ExternalLink className="w-3 h-3" />Open in Google
                </Button>

                {/* Presets */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <p className="text-[10px] font-semibold text-muted-foreground">Preset Dorks</p>
                  {["Processor Hunt", "Directory Scrape", "Hawaii Local"].map(cat => (
                    <div key={cat}>
                      <p className="text-[9px] font-semibold text-muted-foreground/70 mb-1">{cat}</p>
                      <div className="space-y-1">
                        {GOOGLE_DORK_PRESETS.filter(p => p.category === cat).map(preset => (
                          <button key={preset.label} onClick={() => handleApplyPreset(preset.dork)}
                            className="w-full text-left p-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors border border-border/20">
                            <p className="text-[10px] font-medium">{preset.label}</p>
                            <p className="text-[9px] text-muted-foreground font-mono truncate">{preset.dork}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {mode === "url" && (
            <Card className="overflow-visible border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4 text-primary" />URL Scanner</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Website URL</Label>
                  <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://giveandgetlocal.com" className="text-xs" />
                </div>
                <p className="text-[10px] text-muted-foreground">Scans the page for business listings, contact info, and payment processor signatures (Square, Clover, Toast, Stripe, PayPal, Shopify).</p>
                <Button size="sm" className="w-full" onClick={handleScrapeUrl} disabled={!urlInput.trim() || isLoading}>
                  {scrapeMutation.isPending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Scanning...</> : <><Search className="w-3.5 h-3.5" />Scan URL</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {mode === "batch" && (
            <Card className="overflow-visible border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400" />Batch URL Scanner</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">URLs (one per line, max 20)</Label>
                  <Textarea value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)} placeholder={"https://example-coffee.com\nhttps://mybarbershop.com\nhttps://localbakery.square.site"} className="text-xs min-h-[120px] font-mono" />
                </div>
                <p className="text-[10px] text-muted-foreground">Each URL is scanned for processor signatures and business data. Uses AI to extract contacts.</p>
                <Button size="sm" className="w-full" onClick={handleBatchScrape} disabled={!batchUrls.trim() || isLoading}>
                  {scrapeMutation.isPending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Scanning {batchUrls.split("\n").filter(u => u.trim()).length} URLs...</> : <><Zap className="w-3.5 h-3.5" />Scan All URLs</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {mode === "techscan" && (
            <Card className="overflow-visible border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" />Tech Stack Scanner</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">URLs to scan (one per line, max 50)</Label>
                  <Textarea value={techScanUrls} onChange={(e) => setTechScanUrls(e.target.value)} placeholder={"https://example-coffee.com\nhttps://mybarbershop.com\nhttps://localbakery.square.site"} className="text-xs min-h-[120px] font-mono" />
                </div>
                <p className="text-[10px] text-muted-foreground">Scans HTML + response headers for 100+ technologies: payments, CMS, frameworks, analytics, marketing, chat, industry platforms, scheduling, and more. No AI needed - pure signature detection.</p>
                <Button size="sm" className="w-full" onClick={() => {
                  const urls = techScanUrls.split("\n").map(u => u.trim()).filter(u => u && u.startsWith("http"));
                  if (urls.length === 0) return;
                  techScanMutation.mutate({ url: urls });
                }} disabled={!techScanUrls.trim() || isLoading}>
                  {techScanMutation.isPending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Scanning...</> : <><Zap className="w-3.5 h-3.5" />Scan Tech Stacks</>}
                </Button>
                {techResults.length > 0 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs text-destructive" onClick={() => setTechResults([])}>
                    <Trash2 className="w-3 h-3" />Clear Results
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dork discovered URLs */}
          {dorkUrls.length > 0 && (
            <Card className="overflow-visible border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" />Discovered URLs ({dorkUrls.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-[10px] text-muted-foreground">URLs found in Google results. Deep-scan them for more data.</p>
                <div className="max-h-[200px] overflow-y-auto space-y-1 scrollbar-none">
                  {dorkUrls.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-muted/20">
                      <span className="truncate flex-1 font-mono">{u}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => scrapeMutation.mutate({ url: u })} disabled={isLoading}>
                        <Search className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                  setBatchUrls(dorkUrls.join("\n"));
                  setMode("batch");
                }}>
                  <Zap className="w-3.5 h-3.5" />Send All to Batch Scanner
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-visible border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Prospects ({prospects.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {prospects.length > 0 && (
                    <>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={toggleSelectAll}>
                        {prospects.every(p => p._selected) ? "Deselect All" : "Select All"}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => setProspects([])}>
                        <Trash2 className="w-3 h-3" />Clear
                      </Button>
                      <Button size="sm" className="text-xs h-7" onClick={handleImportSelected}
                        disabled={importMutation.isPending || prospects.filter(p => p._selected).length === 0}>
                        <UserPlus className="w-3.5 h-3.5" />
                        Import {prospects.filter(p => p._selected).length} to Pipeline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {prospects.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No prospects yet</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Use Google Dorks or URL Scanner to find businesses</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-none">
                  {prospects.map((p, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${p._selected ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border/30"}`}>
                      <Checkbox checked={p._selected} onCheckedChange={() => toggleSelect(idx)} className="mt-1" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{p.business || "Unknown Business"}</p>
                          {p.currentProcessor && (
                            <Badge variant="outline" className={`text-[9px] ${CONF_COLORS[p.processorConfidence || "low"] || CONF_COLORS.low}`}>
                              {p.currentProcessor} {p.processorConfidence && `(${p.processorConfidence})`}
                            </Badge>
                          )}
                          {p.vertical && p.vertical !== "other" && (
                            <Badge variant="outline" className="text-[9px]">{VERTICAL_CONFIG[p.vertical as Vertical] || p.vertical}</Badge>
                          )}
                        </div>
                        {p.name && <p className="text-[10px] text-muted-foreground">Contact: {p.name}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground">
                          {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                          {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                          {p.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.address}</span>}
                          {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="w-3 h-3" />{new URL(p.website).hostname}</a>}
                        </div>
                        {p.socialLinks && Object.entries(p.socialLinks).some(([, v]) => v) && (
                          <div className="flex gap-2 text-[10px]">
                            {Object.entries(p.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                              <a key={k} href={v as string} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{k}</a>
                            ))}
                          </div>
                        )}
                        {p._techStack && p._techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p._techStack.slice(0, 8).map(t => (
                              <span key={t.name} className="text-[8px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{t.name}</span>
                            ))}
                            {p._techStack.length > 8 && <span className="text-[8px] text-muted-foreground">+{p._techStack.length - 8} more</span>}
                          </div>
                        )}
                        {p.notes && <p className="text-[10px] text-muted-foreground/70">{p.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {p.website && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => scrapeMutation.mutate({ url: p.website })} disabled={isLoading} title="Deep scan with AI">
                            <Search className="w-3 h-3" />
                          </Button>
                        )}
                        {p.website && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setTechScanUrls(p.website); setMode("techscan"); techScanMutation.mutate({ url: p.website }); }} disabled={isLoading} title="Tech stack scan">
                            <Zap className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tech Stack Scan Results */}
          {techResults.length > 0 && (
            <Card className="overflow-visible border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" />Tech Stack Results ({techResults.length} sites)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-none">
                  {techResults.map((r, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{r.title || new URL(r.url).hostname}</p>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-mono truncate block">{r.url}</a>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setUrlInput(r.url); setMode("url"); }} title="Deep scan with AI">
                            <Search className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {r.error ? (
                        <p className="text-[10px] text-destructive">{r.error}</p>
                      ) : r.techStack.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground">No technologies detected</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(["PAYMENTS", "CMS", "FRAMEWORK", "ANALYTICS", "MARKETING", "INDUSTRY", "SCHEDULING", "CHAT", "CDN", "HOSTING", "EMAIL", "COMMUNICATIONS"] as const).map(cat => {
                            const catTech = r.techStack.filter(t => t.category === cat);
                            if (catTech.length === 0) return null;
                            return (
                              <div key={cat} className="flex flex-wrap items-center gap-1">
                                <span className="text-[9px] font-semibold text-muted-foreground w-16 shrink-0">{cat}</span>
                                {catTech.map(t => (
                                  <Badge key={t.name} variant="outline" className={`text-[9px] ${CONF_COLORS[t.confidence] || ""}`}>
                                    {t.name}
                                  </Badge>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processor Detection Summary */}
          {prospects.length > 0 && (
            <Card className="overflow-visible border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Payment Processors Found</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                  {["Square", "Clover", "Toast", "Stripe", "PayPal", "Shopify"].map(proc => {
                    const count = prospects.filter(p => p.currentProcessor?.toLowerCase().includes(proc.toLowerCase())).length;
                    if (count === 0) return null;
                    return (
                      <div key={proc} className="flex items-center justify-between p-2 rounded bg-muted/20">
                        <span className="font-medium">{proc}</span>
                        <Badge variant="outline" className="text-[9px]">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI Ops Tab ──────────────────────────────────────────────────────

function AiOpsTab() {
  const { data: team = [] } = useQuery<TeamMember[]>({ queryKey: ["/api/team-members"] });
  const { data: schedule = [], refetch: refetchSchedule } = useQuery<ScheduleItem[]>({ queryKey: ["/api/schedule"] });
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const newMsg = { role: "user" as const, content: input.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);
    try {
      const r = await apiRequest("POST", "/api/ai-ops/chat", { message: newMsg.content, history: messages });
      const data = await r.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]); }
    setLoading(false);
  };

  const handleGetRecommendations = async () => {
    setRecLoading(true);
    try {
      const r = await apiRequest("POST", "/api/ai-ops/recommend");
      const data = await r.json();
      setRecommendations(data.recommendations || []);
    } catch { toast({ title: "Failed to get recommendations", variant: "destructive" }); }
    setRecLoading(false);
  };

  const handleAddToSchedule = async (rec: AiRecommendation) => {
    const member = team.find(m => m.name.toLowerCase() === rec.assigneeName?.toLowerCase());
    await apiRequest("POST", "/api/schedule", {
      title: rec.title,
      description: rec.description,
      date: today(),
      assigneeId: member?.id || "",
      priority: rec.priority,
      category: rec.category,
      isAiGenerated: true,
    });
    refetchSchedule();
    toast({ title: `Added "${rec.title}" to schedule` });
    setRecommendations(prev => prev.filter(r => r.title !== rec.title));
  };

  const todayItems = schedule.filter(s => s.date === today());
  const PRIORITY_ICON: Record<string, string> = { high: "text-red-400", medium: "text-yellow-400", low: "text-green-400" };

  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />AI Operations Assistant</h2><p className="text-xs text-muted-foreground mt-1">Get AI-powered recommendations, reminders, and manage daily ops. Ask anything about your business.</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chat Panel */}
        <Card className="overflow-visible border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" />Chat with AI Ops</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px] overflow-y-auto mb-3 space-y-2 p-2 rounded-md bg-muted/20 border border-border/30">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Ask me about daily tasks, reminders, business strategy, or anything else.</p>
                  <div className="flex flex-wrap gap-1 mt-3 justify-center">
                    {["What should the team focus on today?", "Give me a status update", "What tasks are overdue?", "Help me plan this week"].map(q => (
                      <Button key={q} variant="outline" size="sm" className="text-[10px] h-6" onClick={() => { setInput(q); }}>{q}</Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground animate-pulse">Thinking...</div></div>}
            </div>
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask AI anything..." className="text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
              <Button size="sm" onClick={handleSend} disabled={!input.trim() || loading}><Send className="w-3.5 h-3.5" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations Panel */}
        <div className="space-y-4">
          <Card className="overflow-visible border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" />AI Recommendations</CardTitle>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleGetRecommendations} disabled={recLoading}>
                  <RefreshCw className={`w-3 h-3 ${recLoading ? "animate-spin" : ""}`} />{recLoading ? "Loading..." : "Generate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Click "Generate" to get AI-powered task recommendations for today.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-md bg-muted/20 border border-border/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold ${PRIORITY_ICON[rec.priority] || ""}`}>{rec.priority?.toUpperCase()}</span>
                          <span className="text-xs font-medium">{rec.title}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{rec.description}</p>
                        <Badge variant="outline" className="text-[10px] h-4 mt-1">{rec.assigneeName}</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="text-[10px] h-6 shrink-0" onClick={() => handleAddToSchedule(rec)}>
                        <Plus className="w-2.5 h-2.5" />Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Quick View */}
          <Card className="overflow-visible border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" />Today's Schedule ({todayItems.length})</CardTitle></CardHeader>
            <CardContent>
              {todayItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No tasks scheduled for today.</p>
              ) : (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {todayItems.map((item) => {
                    const member = team.find(m => m.id === item.assigneeId);
                    return (
                      <div key={item.id} className={`flex items-center gap-2 p-1.5 rounded text-xs ${item.status === "completed" ? "opacity-50 line-through" : ""}`}>
                        <Checkbox checked={item.status === "completed"} onCheckedChange={async (v) => { try { await apiRequest("PATCH", `/api/schedule/${item.id}`, { status: v ? "completed" : "pending" }); refetchSchedule(); } catch { /* silent */ } }} />
                        <span className="flex-1">{item.title}</span>
                        {member && <span className="text-[10px] text-muted-foreground">{member.name}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Inbox Tab ──────────────────────────────────────────────────────

function InboxTab() {
  const { toast } = useToast();
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [viewStarred, setViewStarred] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // Config state
  const [cfgEnabled, setCfgEnabled] = useState(false);
  const [cfgFromEmail, setCfgFromEmail] = useState("contact@techsavvyhawaii.com");
  const [cfgFromName, setCfgFromName] = useState("TechSavvy Hawaii");
  const [cfgAutoConfirm, setCfgAutoConfirm] = useState(true);
  const [cfgForwardTo, setCfgForwardTo] = useState("");

  // Outreach state
  const [outreachPreview, setOutreachPreview] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [outreachEditSubject, setOutreachEditSubject] = useState("");
  const [outreachEditBody, setOutreachEditBody] = useState("");

  // Reply state
  const [replyBody, setReplyBody] = useState("");

  // Template state
  const { data: templates = [], refetch: refetchTemplates } = useQuery<OutreachTemplate[]>({ queryKey: ["/api/email/templates"] });
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateCategory, setTemplateCategory] = useState<"cold" | "follow-up" | "confirmation">("cold");
  const resetTemplateForm = () => { setTemplateName(""); setTemplateSubject(""); setTemplateBody(""); setTemplateCategory("cold"); };

  // ── Queries ──
  const threadQuery = viewStarred ? "/api/email/threads?starred=true" : `/api/email/threads?folder=${activeFolder}`;
  const { data: threads = [], refetch: refetchThreads } = useQuery<EmailThread[]>({ queryKey: [threadQuery] });
  const { data: stats, refetch: refetchStats } = useQuery<EmailStats>({ queryKey: ["/api/email/stats"] });
  const { data: emailConfig } = useQuery<ResendEmailConfig>({ queryKey: ["/api/email/config"] });
  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

  const { data: threadDetail, refetch: refetchDetail } = useQuery<EmailThread & { messages: EmailMessage[] }>({
    queryKey: ["/api/email/threads", selectedThread?.id],
    enabled: !!selectedThread,
  });

  useEffect(() => {
    if (emailConfig) {
      setCfgEnabled(emailConfig.enabled);
      setCfgFromEmail(emailConfig.fromEmail);
      setCfgFromName(emailConfig.fromName);
      setCfgAutoConfirm(emailConfig.autoConfirmEnabled);
      setCfgForwardTo(emailConfig.forwardCopyTo);
    }
  }, [emailConfig]);

  // Clear selection when changing folder
  useEffect(() => { setSelectedIds(new Set()); setSelectedThread(null); }, [activeFolder, viewStarred]);

  // ── Filtered threads by source ──
  const filteredThreads = threads.filter(t => {
    if (sourceFilter === "all") return true;
    if (sourceFilter === "unread") return t.unread;
    if (sourceFilter === "outreach") return t.source === "outreach" || t.source === "outreach-reply";
    if (sourceFilter === "direct") return t.source === "direct" || t.source === "email_inbound";
    if (sourceFilter === "contact-form") return t.source === "contact-form";
    if (sourceFilter === "statement-review") return t.source === "statement-review";
    if (sourceFilter === "lead-magnet") return t.source === "lead-magnet";
    return true;
  });

  // ── Mutations ──
  const refetchAll = () => { refetchThreads(); refetchStats(); };

  const sendMutation = useMutation({
    mutationFn: async (data: { to: string; subject: string; html: string; threadId?: string }) => {
      const res = await apiRequest("POST", "/api/email/send", data);
      return res.json();
    },
    onSuccess: () => { toast({ title: "Email sent" }); setShowCompose(false); setComposeTo(""); setComposeSubject(""); setComposeBody(""); setReplyBody(""); refetchAll(); if (selectedThread) refetchDetail(); },
    onError: (err: Error) => toast({ title: "Send failed", description: err.message, variant: "destructive" }),
  });

  const configMutation = useMutation({
    mutationFn: async (data: Partial<ResendEmailConfig>) => { const res = await apiRequest("PATCH", "/api/email/config", data); return res.json(); },
    onSuccess: () => { toast({ title: "Email config saved" }); queryClient.invalidateQueries({ queryKey: ["/api/email/config"] }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const bulkMutation = useMutation({
    mutationFn: async (data: { ids: string[]; action: string; folder?: string }) => {
      const res = await apiRequest("POST", "/api/email/threads/bulk", data);
      return res.json();
    },
    onSuccess: (_data, vars) => {
      const labels: Record<string, string> = { move: "Moved", star: "Starred", unstar: "Unstarred", read: "Marked read", unread: "Marked unread", delete: "Deleted permanently" };
      toast({ title: labels[vars.action] || "Done", description: `${vars.ids.length} thread(s)` });
      setSelectedIds(new Set());
      refetchAll();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async ({ id, permanent }: { id: string; permanent: boolean }) => {
      const res = await apiRequest("DELETE", `/api/email/threads/${id}?permanent=${permanent}`);
      return res.json();
    },
    onSuccess: () => { setSelectedThread(null); refetchAll(); },
  });

  const outreachGenerateMutation = useMutation({
    mutationFn: async (leadId: string) => { const res = await apiRequest("POST", "/api/email/outreach/generate", { leadId }); return res.json(); },
    onSuccess: (data: { subject: string; html: string; text: string }) => { setOutreachPreview(data); setOutreachEditSubject(data.subject); setOutreachEditBody(data.text); },
  });

  const outreachSendMutation = useMutation({
    mutationFn: async (data: { leadId: string; subject: string; html: string; text: string }) => { const res = await apiRequest("POST", "/api/email/outreach/send", data); return res.json(); },
    onSuccess: () => { toast({ title: "Outreach email sent!" }); setShowOutreach(false); setOutreachPreview(null); setSelectedLeadId(""); refetchAll(); queryClient.invalidateQueries({ queryKey: ["/api/leads"] }); },
    onError: (err: Error) => toast({ title: "Send failed", description: err.message, variant: "destructive" }),
  });

  const callScriptMutation = useMutation({
    mutationFn: async (leadId: string) => { const res = await apiRequest("POST", "/api/email/call-script/generate", { leadId }); return res.json(); },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; subject: string; body: string; category: string }) => { const res = await apiRequest("POST", "/api/email/templates", data); return res.json(); },
    onSuccess: () => { toast({ title: "Template created" }); refetchTemplates(); setShowTemplateForm(false); resetTemplateForm(); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; subject?: string; body?: string; category?: string }) => { const res = await apiRequest("PATCH", `/api/email/templates/${id}`, data); return res.json(); },
    onSuccess: () => { toast({ title: "Template updated" }); refetchTemplates(); setShowTemplateForm(false); setEditingTemplate(null); resetTemplateForm(); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest("DELETE", `/api/email/templates/${id}`); return res.json(); },
    onSuccess: () => { toast({ title: "Template deleted" }); refetchTemplates(); },
  });

  // ── Helpers ──
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const selectAll = () => {
    if (selectedIds.size === filteredThreads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredThreads.map(t => t.id)));
  };
  const bulkAction = (action: string, folder?: string) => {
    if (selectedIds.size === 0) return;
    bulkMutation.mutate({ ids: Array.from(selectedIds), action, folder });
  };

  const sourceLabel: Record<string, string> = {
    direct: "Direct", "contact-form": "Form", outreach: "Outreach", "outreach-reply": "Reply", email_inbound: "Inbound",
    "statement-review": "Statement", "lead-magnet": "Lead Magnet",
  };
  const sourceBadge: Record<string, string> = {
    direct: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "contact-form": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    outreach: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "outreach-reply": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    email_inbound: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    "statement-review": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "lead-magnet": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };
  const intentBadge: Record<string, string> = {
    new_lead: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    support_request: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    billing_question: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    general_inquiry: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    spam: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const priorityDot: Record<string, string> = { urgent: "bg-red-500", high: "bg-orange-500", normal: "bg-blue-400", low: "bg-gray-400" };

  // ── Folder definitions ──
  const folderItems = [
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "sent", label: "Sent", icon: Send },
    { key: "starred", label: "Starred", icon: Star, isSpecial: true },
    { key: "spam", label: "Spam", icon: ShieldAlert },
    { key: "trash", label: "Trash", icon: Trash2 },
    { key: "archived", label: "Archived", icon: Archive },
  ];

  // ════════════════════════════════════════════════════════
  // Thread Detail View
  // ════════════════════════════════════════════════════════
  if (selectedThread && threadDetail) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)}><ArrowLeft className="w-4 h-4" /><span className="ml-1">Back</span></Button>
          <div className="flex-1">
            <h3 className="text-sm font-bold">{threadDetail.subject || "(no subject)"}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">{threadDetail.contactName} &lt;{threadDetail.contactEmail}&gt;</p>
              <span className={`${sourceBadge[threadDetail.source]} px-1.5 py-0.5 rounded text-[10px] font-medium`}>{sourceLabel[threadDetail.source] || threadDetail.source}</span>
              {threadDetail.aiIntent && <span className={`${intentBadge[threadDetail.aiIntent] || intentBadge.general_inquiry} px-1.5 py-0.5 rounded text-[10px] font-medium`}>{threadDetail.aiIntent.replace(/_/g, " ")}</span>}
              {threadDetail.aiPriority && threadDetail.aiPriority !== "normal" && (
                <span className="flex items-center gap-1 text-[10px]"><span className={`w-1.5 h-1.5 rounded-full ${priorityDot[threadDetail.aiPriority] || ""}`} />{threadDetail.aiPriority}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Star" onClick={() => bulkMutation.mutate({ ids: [threadDetail.id], action: threadDetail.starred ? "unstar" : "star" })}>
              <Star className={`w-4 h-4 ${threadDetail.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </Button>
            {threadDetail.folder !== "archived" && (
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Archive" onClick={() => { bulkMutation.mutate({ ids: [threadDetail.id], action: "move", folder: "archived" }); setSelectedThread(null); }}>
                <Archive className="w-4 h-4" />
              </Button>
            )}
            {threadDetail.folder !== "spam" && (
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Report spam" onClick={() => { bulkMutation.mutate({ ids: [threadDetail.id], action: "move", folder: "spam" }); setSelectedThread(null); }}>
                <ShieldAlert className="w-4 h-4" />
              </Button>
            )}
            {threadDetail.folder === "trash" ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete permanently" onClick={() => { if (confirm("Permanently delete this thread and all messages?")) deleteThreadMutation.mutate({ id: threadDetail.id, permanent: true }); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Move to trash" onClick={() => { deleteThreadMutation.mutate({ id: threadDetail.id, permanent: false }); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {(threadDetail.folder === "trash" || threadDetail.folder === "spam" || threadDetail.folder === "archived") && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { bulkMutation.mutate({ ids: [threadDetail.id], action: "move", folder: "inbox" }); setSelectedThread(null); }}>
                <Inbox className="w-3.5 h-3.5 mr-1" />Move to Inbox
              </Button>
            )}
          </div>
        </div>

        {threadDetail.leadId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs">
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Linked to lead:</span>
            <span className="font-medium">{leads.find(l => l.id === threadDetail.leadId)?.business || leads.find(l => l.id === threadDetail.leadId)?.name || threadDetail.leadId}</span>
          </div>
        )}

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {(threadDetail.messages || []).map((msg) => (
            <Card key={msg.id} className={`border-border/50 ${msg.direction === "outbound" ? "ml-8 border-primary/20" : "mr-8"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${msg.direction === "outbound" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {msg.direction === "outbound" ? "TS" : (msg.fromName?.[0] || "?")}
                    </div>
                    <div>
                      <span className="text-xs font-medium">{msg.direction === "outbound" ? "TechSavvy Hawaii" : msg.fromName}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">&lt;{msg.fromEmail}&gt;</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(msg.sentAt)}</span>
                </div>
                {msg.htmlBody ? (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.htmlBody }} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Reply to {threadDetail.contactEmail}</p>
            <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Type your reply..." rows={4} className="resize-none text-sm" />
            <div className="flex justify-end">
              <Button size="sm" disabled={!replyBody.trim() || sendMutation.isPending} onClick={() => sendMutation.mutate({
                to: threadDetail.contactEmail,
                subject: `Re: ${threadDetail.subject}`,
                html: `<p>${replyBody.replace(/\n/g, "<br/>")}</p><div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;"><p style="font-size:14px;color:#374151;font-weight:600;">TechSavvy Hawaii</p><p style="font-size:14px;color:#6b7280;">(808) 767-5460 | contact@techsavvyhawaii.com</p></div>`,
                threadId: threadDetail.id,
              })}><Send className="w-4 h-4 mr-1" />{sendMutation.isPending ? "Sending..." : "Send Reply"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // Main Inbox View
  // ════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Mail className="w-5 h-5 text-primary" />Email</h2>
          <p className="text-xs text-muted-foreground mt-1">contact@techsavvyhawaii.com</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}><Settings className="w-4 h-4 mr-1" />Config</Button>
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}><FileText className="w-4 h-4 mr-1" />Templates</Button>
          <Button variant="outline" size="sm" onClick={() => setShowOutreach(true)}><Zap className="w-4 h-4 mr-1" />Outreach</Button>
          <Button size="sm" onClick={() => setShowCompose(true)}><Plus className="w-4 h-4 mr-1" />Compose</Button>
        </div>
      </div>

      {/* Email enabled status banner */}
      {emailConfig && !emailConfig.enabled && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
            <p className="text-xs flex-1">Email sending is disabled. <span className="text-muted-foreground">Enable in Config for outreach, auto-replies, and inbox replies.</span></p>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowConfig(true)}>Configure</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        {/* ── Folder Sidebar ── */}
        <div className="w-48 shrink-0 space-y-1">
          {folderItems.map(({ key, label, icon: Icon, isSpecial }) => {
            const isActive = isSpecial ? viewStarred : (!viewStarred && activeFolder === key);
            const folderStats = stats?.folders?.[key];
            const count = isSpecial ? (stats?.starred || 0) : (folderStats?.total || 0);
            const unreadCount = isSpecial ? 0 : (folderStats?.unread || 0);

            return (
              <button key={key}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
                onClick={() => { if (isSpecial) { setViewStarred(true); setActiveFolder("inbox"); } else { setViewStarred(false); setActiveFolder(key); } }}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""} ${key === "starred" && isActive ? "fill-yellow-400 text-yellow-400" : ""}`} />
                <span className="flex-1 text-left truncate">{label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${unreadCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {unreadCount > 0 ? unreadCount : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Thread List ── */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Bulk Action Bar */}
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg">
              <Checkbox checked={selectedIds.size === filteredThreads.length && filteredThreads.length > 0} onCheckedChange={selectAll} />
              <span className="text-xs font-medium">{selectedIds.size} selected</span>
              <div className="flex-1" />
              {activeFolder !== "inbox" && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => bulkAction("move", "inbox")}><Inbox className="w-3.5 h-3.5 mr-1" />Inbox</Button>}
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => bulkAction("read")}><MailOpen className="w-3.5 h-3.5 mr-1" />Read</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => bulkAction("unread")}><Mail className="w-3.5 h-3.5 mr-1" />Unread</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => bulkAction("star")}><Star className="w-3.5 h-3.5 mr-1" />Star</Button>
              {activeFolder !== "archived" && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => bulkAction("move", "archived")}><Archive className="w-3.5 h-3.5 mr-1" />Archive</Button>}
              {activeFolder !== "spam" && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => bulkAction("move", "spam")}><ShieldAlert className="w-3.5 h-3.5 mr-1" />Spam</Button>}
              {activeFolder === "trash" || activeFolder === "spam" ? (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => bulkAction("delete")}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete Forever</Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => bulkAction("move", "trash")}><Trash2 className="w-3.5 h-3.5 mr-1" />Trash</Button>
              )}
            </div>
          ) : (
            /* Source filter bar */
            <div className="flex items-center gap-2 flex-wrap">
              <Checkbox checked={false} onCheckedChange={selectAll} className="mr-1" />
              {(["all", "unread", "direct", "outreach", "contact-form", "statement-review", "lead-magnet"] as const).map(f => (
                <Button key={f} variant={sourceFilter === f ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => setSourceFilter(f)}>
                  {f === "all" ? "All" : f === "unread" ? `Unread` : f === "outreach" ? "Outreach" : f === "direct" ? "Direct" : f === "contact-form" ? "Contact Form" : f === "statement-review" ? "Statements" : "Lead Magnet"}
                </Button>
              ))}
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => refetchAll()}><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
            </div>
          )}

          {/* Empty folder state */}
          {activeFolder === "trash" && filteredThreads.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Messages in Trash are kept until manually deleted.</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive ml-auto" onClick={() => {
                if (confirm(`Permanently delete all ${filteredThreads.length} messages in Trash?`)) {
                  bulkMutation.mutate({ ids: filteredThreads.map(t => t.id), action: "delete" });
                }
              }}>Empty Trash</Button>
            </div>
          )}

          {activeFolder === "spam" && filteredThreads.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg text-xs text-muted-foreground">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Messages classified as spam by AI.</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive ml-auto" onClick={() => {
                if (confirm(`Permanently delete all ${filteredThreads.length} spam messages?`)) {
                  bulkMutation.mutate({ ids: filteredThreads.map(t => t.id), action: "delete" });
                }
              }}>Delete All Spam</Button>
            </div>
          )}

          {/* Thread list */}
          {filteredThreads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {activeFolder === "inbox" && <Inbox className="w-8 h-8 mx-auto mb-3 opacity-30" />}
              {activeFolder === "spam" && <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-30" />}
              {activeFolder === "trash" && <Trash2 className="w-8 h-8 mx-auto mb-3 opacity-30" />}
              {activeFolder === "sent" && <Send className="w-8 h-8 mx-auto mb-3 opacity-30" />}
              {activeFolder === "archived" && <Archive className="w-8 h-8 mx-auto mb-3 opacity-30" />}
              {viewStarred && <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />}
              <p className="text-sm">No emails in {viewStarred ? "Starred" : activeFolder}</p>
              {activeFolder === "inbox" && !viewStarred && <p className="text-xs mt-1">Send an outreach email or wait for inbound emails</p>}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredThreads.map((thread) => (
                <div key={thread.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                    selectedIds.has(thread.id) ? "bg-primary/10 border border-primary/20" :
                    thread.unread ? "bg-primary/5 border border-primary/10 hover:bg-primary/10" : "border border-transparent hover:bg-muted/50"
                  }`}
                >
                  <Checkbox checked={selectedIds.has(thread.id)} onCheckedChange={() => toggleSelect(thread.id)} onClick={(e) => e.stopPropagation()} />
                  <button className="p-0.5 shrink-0 opacity-40 hover:opacity-100 transition-opacity" onClick={(e) => {
                    e.stopPropagation();
                    bulkMutation.mutate({ ids: [thread.id], action: thread.starred ? "unstar" : "star" });
                  }}>
                    <Star className={`w-3.5 h-3.5 ${thread.starred ? "fill-yellow-400 text-yellow-400 opacity-100" : ""}`} />
                  </button>
                  {thread.aiPriority && thread.aiPriority !== "normal" && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[thread.aiPriority] || ""}`} title={thread.aiPriority} />
                  )}
                  <div className="flex-1 min-w-0" onClick={() => setSelectedThread(thread)}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${thread.unread ? "font-bold" : "font-medium"}`}>{thread.contactName || thread.contactEmail}</span>
                      <span className={`${sourceBadge[thread.source] || sourceBadge.direct} px-1 py-0.5 rounded text-[9px] font-medium shrink-0`}>{sourceLabel[thread.source] || thread.source}</span>
                      {thread.aiIntent && thread.aiIntent !== "general_inquiry" && (
                        <span className={`${intentBadge[thread.aiIntent] || ""} px-1 py-0.5 rounded text-[9px] font-medium shrink-0`}>{thread.aiIntent.replace(/_/g, " ")}</span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${thread.unread ? "text-foreground" : "text-muted-foreground"}`}>{thread.subject || "(no subject)"}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(thread.lastMessageAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Compose Email</DialogTitle><DialogDescription>Send from contact@techsavvyhawaii.com</DialogDescription></DialogHeader>
          {templates.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground shrink-0">Load template:</span>
              <Select onValueChange={(id) => { const t = templates.find(tpl => tpl.id === id); if (t) { setComposeSubject(t.subject); setComposeBody(t.body); } }}>
                <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name} ({TEMPLATE_CATEGORIES[t.category]?.label || t.category})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">To</Label><Input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="recipient@email.com" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Subject</Label><Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Email subject" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Message</Label><Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your email..." rows={8} className="resize-none text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button disabled={!composeTo || !composeSubject || !composeBody || sendMutation.isPending} onClick={() => sendMutation.mutate({
              to: composeTo, subject: composeSubject,
              html: `<p>${composeBody.replace(/\n/g, "<br/>")}</p><div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;"><p style="font-size:14px;color:#374151;font-weight:600;">TechSavvy Hawaii</p><p style="font-size:14px;color:#6b7280;">(808) 767-5460 | contact@techsavvyhawaii.com</p></div>`,
            })}><Send className="w-4 h-4 mr-1" />{sendMutation.isPending ? "Sending..." : "Send"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Email Configuration</DialogTitle><DialogDescription>Configure email settings</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Email Sending</p><p className="text-xs text-muted-foreground">Enable outbound email via Resend</p></div>
              <Switch checked={cfgEnabled} onCheckedChange={setCfgEnabled} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">From Email</Label><Input value={cfgFromEmail} onChange={(e) => setCfgFromEmail(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">From Name</Label><Input value={cfgFromName} onChange={(e) => setCfgFromName(e.target.value)} /></div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Auto-Confirm Contact Forms</p><p className="text-xs text-muted-foreground">Send confirmation to form submitters</p></div>
              <Switch checked={cfgAutoConfirm} onCheckedChange={setCfgAutoConfirm} />
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Forward Copy To</Label><Input value={cfgForwardTo} onChange={(e) => setCfgForwardTo(e.target.value)} placeholder="your@email.com" /><p className="text-[10px] text-muted-foreground">Get inbound email copies on your phone</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfig(false)}>Cancel</Button>
            <Button disabled={configMutation.isPending} onClick={() => configMutation.mutate({
              enabled: cfgEnabled, fromEmail: cfgFromEmail, fromName: cfgFromName, autoConfirmEnabled: cfgAutoConfirm, forwardCopyTo: cfgForwardTo,
            })}><Save className="w-4 h-4 mr-1" />{configMutation.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outreach Dialog */}
      <Dialog open={showOutreach} onOpenChange={(v) => { setShowOutreach(v); if (!v) { setOutreachPreview(null); setSelectedLeadId(""); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle><Zap className="w-5 h-5 inline mr-2 text-primary" />Send Outreach Email</DialogTitle><DialogDescription>Select a lead to generate a personalized outreach email and call script</DialogDescription></DialogHeader>

          {!outreachPreview ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Select Lead</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger><SelectValue placeholder="Choose a lead..." /></SelectTrigger>
                  <SelectContent>
                    {leads.filter(l => l.email && l.status !== "won" && l.status !== "lost").map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.business || l.name} — {l.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedLeadId && (() => {
                const lead = leads.find(l => l.id === selectedLeadId);
                if (!lead) return null;
                return (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Business:</span> <span className="font-medium">{lead.business}</span></div>
                        <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{lead.name}</span></div>
                        <div><span className="text-muted-foreground">Processor:</span> <span className="font-medium">{lead.currentProcessor || "Unknown"}</span></div>
                        <div><span className="text-muted-foreground">Volume:</span> <span className="font-medium">{lead.monthlyVolume || "Unknown"}</span></div>
                        <div><span className="text-muted-foreground">Vertical:</span> <span className="font-medium">{lead.vertical}</span></div>
                        <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{lead.status}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              <div className="flex gap-2">
                <Button disabled={!selectedLeadId || outreachGenerateMutation.isPending} onClick={() => outreachGenerateMutation.mutate(selectedLeadId)}>
                  <Sparkles className="w-4 h-4 mr-1" />{outreachGenerateMutation.isPending ? "Generating..." : "Generate Email"}
                </Button>
                <Button variant="outline" disabled={!selectedLeadId || callScriptMutation.isPending} onClick={() => callScriptMutation.mutate(selectedLeadId)}>
                  <Phone className="w-4 h-4 mr-1" />{callScriptMutation.isPending ? "Generating..." : "Generate Call Script"}
                </Button>
              </div>
              {callScriptMutation.data && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Call Script</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-4 rounded-lg max-h-[300px] overflow-y-auto font-mono">{callScriptMutation.data.script}</pre>
                    <div>
                      <p className="text-xs font-semibold mb-1">Talking Points:</p>
                      <ul className="text-xs space-y-1">{callScriptMutation.data.talkingPoints.map((tp: string, i: number) => <li key={i} className="flex items-start gap-1.5"><Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />{tp}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Objection Handlers:</p>
                      <div className="space-y-2">{callScriptMutation.data.objections.map((obj: { objection: string; response: string }, i: number) => (
                        <div key={i} className="bg-muted/30 p-2 rounded text-xs">
                          <p className="font-medium text-orange-600 dark:text-orange-400">"{obj.objection}"</p>
                          <p className="mt-1 text-muted-foreground">{obj.response}</p>
                        </div>
                      ))}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(callScriptMutation.data.script); toast({ title: "Script copied!" }); }}><Copy className="w-3 h-3 mr-1" />Copy Script</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs">Subject (editable)</Label><Input value={outreachEditSubject} onChange={(e) => setOutreachEditSubject(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preview</Label>
                <div className="border rounded-lg p-4 bg-white dark:bg-card max-h-[300px] overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: outreachPreview.html }} />
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Plain Text (editable)</Label><Textarea value={outreachEditBody} onChange={(e) => setOutreachEditBody(e.target.value)} rows={6} className="resize-none text-sm font-mono" /></div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOutreachPreview(null)}>Back</Button>
                <Button disabled={outreachSendMutation.isPending} onClick={() => outreachSendMutation.mutate({
                  leadId: selectedLeadId, subject: outreachEditSubject, html: outreachPreview.html, text: outreachEditBody,
                })}><Send className="w-4 h-4 mr-1" />{outreachSendMutation.isPending ? "Sending..." : "Approve & Send"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Email Templates</DialogTitle>
            <DialogDescription>Manage reusable email templates for outreach campaigns</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => { resetTemplateForm(); setEditingTemplate(null); setShowTemplateForm(true); }}><Plus className="w-4 h-4 mr-1" />New Template</Button>
          </div>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No templates yet</p>
              <p className="text-xs mt-1">Create your first email template to speed up outreach</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => {
                const catCfg = TEMPLATE_CATEGORIES[t.category] || TEMPLATE_CATEGORIES.cold;
                const CatIcon = catCfg.icon;
                return (
                  <Card key={t.id} className="border-border/50 hover:border-primary/20 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold truncate">{t.name || "Untitled"}</h3>
                            <Badge variant="outline" className={`text-[10px] ${catCfg.color}`}><CatIcon className="w-3 h-3 mr-1" />{catCfg.label}</Badge>
                            {t.isDefault && <Badge className="text-[9px]">Default</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">Subject: {t.subject || "(no subject)"}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.body || "(no body)"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setComposeSubject(t.subject); setComposeBody(t.body); setShowTemplates(false); setShowCompose(true); }}><Copy className="w-3 h-3 mr-1" />Use</Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTemplate(t); setTemplateName(t.name); setTemplateSubject(t.subject); setTemplateBody(t.body); setTemplateCategory(t.category); setShowTemplateForm(true); }}><Edit3 className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteTemplateMutation.mutate(t.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Form Dialog */}
      <Dialog open={showTemplateForm} onOpenChange={(v) => { setShowTemplateForm(v); if (!v) { setEditingTemplate(null); resetTemplateForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>{editingTemplate ? "Update this email template" : "Create a reusable email template"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Template Name</Label><Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Cold Outreach - Restaurant" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={templateCategory} onValueChange={(v) => setTemplateCategory(v as "cold" | "follow-up" | "confirmation")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Cold Outreach</SelectItem>
                  <SelectItem value="follow-up">Follow-Up</SelectItem>
                  <SelectItem value="confirmation">Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Subject Line</Label><Input value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="Email subject..." /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body</Label>
              <Textarea value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} placeholder="Write your email template body..." rows={8} className="resize-none text-sm" />
              <p className="text-[10px] text-muted-foreground">Tip: Use placeholders like {"{business}"}, {"{name}"}, {"{vertical}"} for personalization</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); resetTemplateForm(); }}>Cancel</Button>
            <Button disabled={!templateName || !templateSubject || (editingTemplate ? updateTemplateMutation.isPending : createTemplateMutation.isPending)}
              onClick={() => {
                if (editingTemplate) {
                  updateTemplateMutation.mutate({ id: editingTemplate.id, name: templateName, subject: templateSubject, body: templateBody, category: templateCategory });
                } else {
                  createTemplateMutation.mutate({ name: templateName, subject: templateSubject, body: templateBody, category: templateCategory });
                }
              }}>
              <Save className="w-4 h-4 mr-1" />
              {editingTemplate ? (updateTemplateMutation.isPending ? "Saving..." : "Save Changes") : (createTemplateMutation.isPending ? "Creating..." : "Create Template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── AI Settings Tab ─────────────────────────────────────────────────

function AiSettingsTab() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<AiConfig>({ queryKey: ["/api/ai-config/full"] });
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState("claude-sonnet-4-20250514");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [maxTokens, setMaxTokens] = useState(1024);

  useEffect(() => { if (config) { setEnabled(config.enabled); setModel(config.model); setSystemPrompt(config.systemPrompt); setWelcomeMessage(config.welcomeMessage); setMaxTokens(config.maxTokens); } }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<AiConfig>) => { const res = await apiRequest("PATCH", "/api/ai-config", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/ai-config/full"] }); toast({ title: "Settings saved" }); },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });
  const toggleMutation = useMutation({
    mutationFn: async (v: boolean) => { const res = await apiRequest("PATCH", "/api/ai-config", { enabled: v }); return res.json(); },
    onSuccess: (data: AiConfig) => { setEnabled(data.enabled); queryClient.invalidateQueries({ queryKey: ["/api/ai-config/full"] }); toast({ title: data.enabled ? "AI Enabled" : "AI Disabled" }); },
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h2 className="text-lg font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-primary" />AI Chatbot Settings</h2><p className="text-xs text-muted-foreground mt-1">Configure the AI assistant on your main website</p></div>
      <Card className="overflow-visible border-primary/10">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/5 to-transparent" />
        <CardContent className="p-5 relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div><div><p className="text-sm font-semibold">Agent Status</p><p className="text-xs text-muted-foreground">Turn chatbot on or off</p></div></div>
            <div className="flex items-center gap-3"><Badge variant={enabled ? "default" : "outline"}>{enabled ? "Active" : "Inactive"}</Badge><Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); toggleMutation.mutate(v); }} /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-visible border-border/50"><CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-md bg-chart-2/15 flex items-center justify-center"><Settings className="w-5 h-5 text-chart-2" /></div><div><p className="text-sm font-semibold">Model Settings</p></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-xs">AI Model</Label><Select value={model} onValueChange={setModel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label className="text-xs">Max Response Length</Label><Select value={String(maxTokens)} onValueChange={(v) => setMaxTokens(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="512">Short (512)</SelectItem><SelectItem value="1024">Medium (1024)</SelectItem><SelectItem value="2048">Long (2048)</SelectItem><SelectItem value="4096">Very Long (4096)</SelectItem></SelectContent></Select></div>
        </div>
      </CardContent></Card>
      <Card className="overflow-visible border-border/50"><CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-md bg-chart-4/15 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-chart-4" /></div><div><p className="text-sm font-semibold">Chat Configuration</p></div></div>
        <div className="space-y-1.5"><Label className="text-xs">System Prompt</Label><Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={6} className="resize-none text-sm" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Welcome Message</Label><Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} className="resize-none text-sm" /></div>
      </CardContent></Card>
      <div className="flex justify-end"><Button onClick={() => saveMutation.mutate({ model, systemPrompt, welcomeMessage, maxTokens })} disabled={saveMutation.isPending}><Save className="w-4 h-4" />{saveMutation.isPending ? "Saving..." : "Save Settings"}</Button></div>
    </div>
  );
}
