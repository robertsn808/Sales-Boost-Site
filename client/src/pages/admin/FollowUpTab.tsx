import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, Mail, MessageSquare, Calendar, ArrowRight, Sparkles, Clock,
  Search, Filter, ChevronRight, Send, RefreshCw, AlertTriangle,
  CheckCircle, TrendingUp, UserPlus, Building, Zap, MoreHorizontal,
  ArrowUpRight, Target, FileText, X, Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import type { Lead, PipelineStage } from "./types";
import { PIPELINE_CONFIG } from "./constants";

// ─── Action Config ───────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  send_email:              { label: "Send Email", icon: Mail, color: "text-blue-400", bg: "bg-blue-400/10" },
  call_now:                { label: "Call Now", icon: Phone, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  send_text:               { label: "Send Text", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-400/10" },
  schedule_meeting:        { label: "Schedule Meeting", icon: Calendar, color: "text-amber-400", bg: "bg-amber-400/10" },
  send_statement_request:  { label: "Request Statement", icon: FileText, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  send_proposal:           { label: "Send Proposal", icon: Send, color: "text-pink-400", bg: "bg-pink-400/10" },
  follow_up_later:         { label: "Follow Up Later", icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10" },
  nurture_drip:            { label: "Add to Nurture", icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-400/10" },
  close_deal:              { label: "Close Deal", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  drop_lead:               { label: "Drop Lead", icon: X, color: "text-red-400", bg: "bg-red-400/10" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  high:   { label: "High", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  low:    { label: "Low", color: "text-gray-400", bg: "bg-gray-400/10 border-gray-400/30" },
};

// Active pipeline stages (not new, not terminal)
const FOLLOW_UP_STAGES: PipelineStage[] = [
  "contacted", "qualified", "statement-requested", "statement-received",
  "analysis-delivered", "proposal-sent", "negotiation",
];

interface Recommendation {
  leadId: string;
  nextAction: string;
  priority: string;
  reasoning: string;
  suggestedMessage: string;
  moveToStage: string;
  timing: string;
  confidence: number;
  error?: string;
}

// ─── Component ───────────────────────────────────────────────────────

export default function FollowUpTab() {
  const { data: leads = [], refetch } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<PipelineStage | "all">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation>>({});
  const [loadingRecs, setLoadingRecs] = useState<Record<string, boolean>>({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ lead: Lead; rec: Recommendation } | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  // Only leads that have been contacted (active pipeline, not new/won/lost/nurture)
  const followUpLeads = useMemo(() => leads
    .filter(l => FOLLOW_UP_STAGES.includes(l.status))
    .filter(l => filterStage === "all" || l.status === filterStage)
    .filter(l => !search || [l.name, l.business, l.email, l.phone, l.currentProcessor].some(f => f?.toLowerCase().includes(search.toLowerCase())))
    .filter(l => {
      if (filterPriority === "all") return true;
      const rec = recommendations[l.id];
      return rec?.priority === filterPriority;
    })
    .sort((a, b) => {
      // Sort by priority if we have recs
      const pa = recommendations[a.id]?.priority;
      const pb = recommendations[b.id]?.priority;
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      const oa = pa ? (order[pa as keyof typeof order] ?? 4) : 4;
      const ob = pb ? (order[pb as keyof typeof order] ?? 4) : 4;
      if (oa !== ob) return oa - ob;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }),
  [leads, filterStage, filterPriority, search, recommendations]);

  const daysSince = (date: string) => {
    if (!date) return 0;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  };

  // Get AI recommendation for a single lead
  const getRecommendation = async (leadId: string) => {
    setLoadingRecs(prev => ({ ...prev, [leadId]: true }));
    try {
      const res = await apiRequest("POST", `/api/leads/${leadId}/recommend`, {});
      const data = await res.json();
      setRecommendations(prev => ({ ...prev, [leadId]: data }));
    } catch {
      toast({ title: "Failed to get AI recommendation", variant: "destructive" });
    } finally {
      setLoadingRecs(prev => ({ ...prev, [leadId]: false }));
    }
  };

  // Get recommendations for all visible leads
  const getAllRecommendations = async () => {
    setLoadingAll(true);
    const ids = followUpLeads.map(l => l.id);
    // Do them in parallel batches of 3 to avoid overwhelming the worker
    for (let i = 0; i < ids.length; i += 3) {
      const batch = ids.slice(i, i + 3);
      await Promise.all(batch.map(id => getRecommendation(id)));
    }
    setLoadingAll(false);
    toast({ title: `AI analyzed ${ids.length} leads` });
  };

  // Move lead to a new stage
  const moveMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const body: any = { status };
      if (notes) body.notes = notes;
      body.nextStep = recommendations[id]?.suggestedMessage || "";
      const res = await apiRequest("PATCH", `/api/leads/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Lead updated" });
      setActionDialog(null);
      setActionNotes("");
    },
    onError: () => toast({ title: "Failed to update lead", variant: "destructive" }),
  });

  const handleAction = (lead: Lead, rec: Recommendation) => {
    setActionDialog({ lead, rec });
    setActionNotes("");
  };

  const confirmAction = () => {
    if (!actionDialog) return;
    const { lead, rec } = actionDialog;
    const newStage = rec.moveToStage || lead.status;
    const existingNotes = lead.notes || "";
    const timestamp = new Date().toLocaleString();
    const actionLog = `\n[${timestamp}] AI: ${rec.nextAction} — ${rec.reasoning}${actionNotes ? `\nNotes: ${actionNotes}` : ""}`;
    moveMutation.mutate({
      id: lead.id,
      status: newStage,
      notes: existingNotes + actionLog,
    });
  };

  // Quick stage move without AI
  const quickMove = (lead: Lead, stage: PipelineStage) => {
    moveMutation.mutate({ id: lead.id, status: stage });
  };

  // Stats
  const stats = useMemo(() => {
    const all = leads.filter(l => FOLLOW_UP_STAGES.includes(l.status));
    const stale = all.filter(l => daysSince(l.updatedAt) >= 7);
    const urgent = Object.values(recommendations).filter(r => r.priority === "urgent" || r.priority === "high").length;
    return { total: all.length, stale: stale.length, withRecs: Object.keys(recommendations).length, urgent };
  }, [leads, recommendations]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Follow-Up Hub
          </h2>
          <p className="text-xs text-muted-foreground">
            {stats.total} contacted leads — {stats.stale} stale ({">"}7 days) — {stats.urgent} need attention
          </p>
        </div>
        <Button
          size="sm"
          onClick={getAllRecommendations}
          disabled={loadingAll || followUpLeads.length === 0}
          className="gap-1.5"
        >
          {loadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loadingAll ? "Analyzing..." : "AI Analyze All"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FOLLOW_UP_STAGES.slice(0, 4).map(stage => {
          const count = leads.filter(l => l.status === stage).length;
          const cfg = PIPELINE_CONFIG[stage];
          return (
            <Card key={stage} className="cursor-pointer hover:ring-1 ring-border/50 transition-all" onClick={() => setFilterStage(filterStage === stage ? "all" : stage)}>
              <CardContent className="p-3">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{cfg.short}</p>
                <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search contacted leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterStage} onValueChange={v => setFilterStage(v as PipelineStage | "all")}>
          <SelectTrigger className="w-full sm:w-40 h-9"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {FOLLOW_UP_STAGES.map(s => <SelectItem key={s} value={s}>{PIPELINE_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={v => setFilterPriority(v)}>
          <SelectTrigger className="w-full sm:w-36 h-9"><Target className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lead Cards */}
      {followUpLeads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <UserPlus className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {leads.filter(l => FOLLOW_UP_STAGES.includes(l.status)).length === 0
                ? "No contacted leads yet. Move leads from 'New' to 'Contacted' in the Pipeline tab."
                : "No leads match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {followUpLeads.map(lead => {
            const rec = recommendations[lead.id];
            const loading = loadingRecs[lead.id];
            const days = daysSince(lead.updatedAt);
            const isStale = days >= 7;
            const stageCfg = PIPELINE_CONFIG[lead.status];
            const nextStages = FOLLOW_UP_STAGES.filter(s => {
              const idx = FOLLOW_UP_STAGES.indexOf(lead.status);
              const nIdx = FOLLOW_UP_STAGES.indexOf(s);
              return nIdx > idx;
            });

            return (
              <Card key={lead.id} className={`overflow-hidden transition-all ${isStale ? "border-amber-500/30" : ""}`}>
                <CardContent className="p-0">
                  {/* Lead header row */}
                  <div className="flex items-center justify-between gap-3 p-3 pb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stageCfg.bg} border`}>
                        <Building className={`w-4 h-4 ${stageCfg.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{lead.business || lead.name}</p>
                          {isStale && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400 gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />{days}d
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {lead.name && lead.business && <span>{lead.name}</span>}
                          <span>•</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${stageCfg.bg} ${stageCfg.color} border`}>
                            {stageCfg.short}
                          </Badge>
                          {lead.vertical && <><span>•</span><span className="capitalize">{lead.vertical}</span></>}
                          {lead.monthlyVolume && <><span>•</span><span>{lead.monthlyVolume}/mo</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Quick action buttons */}
                      {nextStages.length > 0 && (
                        <Select onValueChange={v => quickMove(lead, v as PipelineStage)}>
                          <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent [&>svg:last-child]:hidden">
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            {nextStages.map(s => (
                              <SelectItem key={s} value={s}>
                                <span className="flex items-center gap-1.5">
                                  <ArrowRight className="w-3 h-3" />Move to {PIPELINE_CONFIG[s].label}
                                </span>
                              </SelectItem>
                            ))}
                            <SelectItem value="won"><span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle className="w-3 h-3" />Won</span></SelectItem>
                            <SelectItem value="lost"><span className="flex items-center gap-1.5 text-red-400"><X className="w-3 h-3" />Lost</span></SelectItem>
                            <SelectItem value="nurture"><span className="flex items-center gap-1.5 text-violet-400"><TrendingUp className="w-3 h-3" />Nurture</span></SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => getRecommendation(lead.id)}
                        disabled={loading}
                        title="Get AI recommendation"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                      </Button>
                    </div>
                  </div>

                  {/* Pain points / notes preview */}
                  {(lead.painPoints || lead.nextStep) && (
                    <div className="px-3 pb-2">
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {lead.painPoints && <><span className="font-medium text-foreground/70">Pain:</span> {lead.painPoints}</>}
                        {lead.painPoints && lead.nextStep && <span className="mx-1.5">•</span>}
                        {lead.nextStep && <><span className="font-medium text-foreground/70">Next:</span> {lead.nextStep}</>}
                      </p>
                    </div>
                  )}

                  {/* AI Recommendation Panel */}
                  {rec && !rec.error && (
                    <div className="border-t border-border/50 bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-[11px] font-bold text-primary">AI RECOMMENDATION</span>
                            {rec.priority && PRIORITY_CONFIG[rec.priority] && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_CONFIG[rec.priority].bg} ${PRIORITY_CONFIG[rec.priority].color}`}>
                                {PRIORITY_CONFIG[rec.priority].label}
                              </Badge>
                            )}
                            {rec.confidence && (
                              <span className="text-[10px] text-muted-foreground">{rec.confidence}% confident</span>
                            )}
                          </div>

                          {/* Action badge */}
                          {rec.nextAction && ACTION_CONFIG[rec.nextAction] && (() => {
                            const cfg = ACTION_CONFIG[rec.nextAction];
                            const Icon = cfg.icon;
                            return (
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.color} mb-1.5`}>
                                <Icon className="w-3 h-3" />{cfg.label}
                                {rec.timing && <span className="text-[10px] opacity-70">• {rec.timing}</span>}
                              </div>
                            );
                          })()}

                          <p className="text-xs text-muted-foreground">{rec.reasoning}</p>

                          {rec.suggestedMessage && (
                            <div className="mt-1.5 p-2 rounded bg-background/50 border border-border/30">
                              <p className="text-[11px] text-foreground/80 italic">"{rec.suggestedMessage}"</p>
                            </div>
                          )}

                          {rec.moveToStage && rec.moveToStage !== lead.status && (
                            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              Suggested move: <span className="font-medium text-foreground/70">{PIPELINE_CONFIG[rec.moveToStage as PipelineStage]?.label || rec.moveToStage}</span>
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="shrink-0 gap-1"
                          onClick={() => handleAction(lead, rec)}
                        >
                          <CheckCircle className="w-3 h-3" />Apply
                        </Button>
                      </div>
                    </div>
                  )}

                  {rec?.error && (
                    <div className="border-t border-border/50 bg-red-500/5 p-3">
                      <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />Failed to get recommendation. Try again.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Apply AI Recommendation
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (() => {
            const { lead, rec } = actionDialog;
            const actionCfg = ACTION_CONFIG[rec.nextAction] || { label: rec.nextAction, icon: ArrowRight, color: "text-primary", bg: "bg-primary/10" };
            const Icon = actionCfg.icon;
            const newStage = rec.moveToStage || lead.status;
            const stageName = PIPELINE_CONFIG[newStage as PipelineStage]?.label || newStage;

            return (
              <div className="space-y-4">
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{lead.business || lead.name}</p>
                    <Badge variant="outline" className={`text-[10px] ${PRIORITY_CONFIG[rec.priority]?.bg} ${PRIORITY_CONFIG[rec.priority]?.color}`}>
                      {PRIORITY_CONFIG[rec.priority]?.label || rec.priority}
                    </Badge>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${actionCfg.bg} ${actionCfg.color}`}>
                    <Icon className="w-3 h-3" />{actionCfg.label}
                  </div>

                  <p className="text-xs text-muted-foreground">{rec.reasoning}</p>

                  {rec.suggestedMessage && (
                    <div className="p-2 rounded bg-muted/50 border border-border/30">
                      <p className="text-[11px] italic text-foreground/80">"{rec.suggestedMessage}"</p>
                    </div>
                  )}

                  {newStage !== lead.status && (
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className={`${PIPELINE_CONFIG[lead.status].bg} ${PIPELINE_CONFIG[lead.status].color}`}>
                        {PIPELINE_CONFIG[lead.status].short}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className={`${PIPELINE_CONFIG[newStage as PipelineStage]?.bg} ${PIPELINE_CONFIG[newStage as PipelineStage]?.color}`}>
                        {stageName}
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Add notes (optional)</label>
                  <Textarea
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    placeholder="Any additional notes about this action..."
                    className="text-sm h-20 resize-none"
                  />
                </div>
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={confirmAction} disabled={moveMutation.isPending} className="gap-1.5">
              {moveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Confirm & Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
