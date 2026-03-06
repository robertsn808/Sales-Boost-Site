import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit3, DollarSign, Calendar, Monitor } from "lucide-react";
import { useState } from "react";
import type { Opportunity, Lead, TeamMember, DealStage } from "./types";
import { DEAL_STAGE_CONFIG, DEAL_STAGES } from "./constants";

interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  brand: string;
  status: string;
}

export default function DealsTab() {
  const { toast } = useToast();
  const { data: deals = [] } = useQuery<Opportunity[]>({ queryKey: ["/api/opportunities"] });
  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });
  const { data: team = [] } = useQuery<TeamMember[]>({ queryKey: ["/api/team-members"] });
  const { data: equipment = [] } = useQuery<Equipment[]>({ queryKey: ["/api/equipment"] });
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Opportunity | null>(null);
  const [filterStage, setFilterStage] = useState("all");
  const [form, setForm] = useState({
    title: "", leadId: "", stage: "prospecting" as DealStage, value: 0,
    probability: 10, expectedCloseDate: "", notes: "", assigneeId: "", equipmentId: "",
  });

  const createMut = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await apiRequest("POST", "/api/opportunities", data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setShowForm(false);
      toast({ title: "Deal created" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create deal", description: String(err?.message || ""), variant: "destructive" });
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Opportunity> & { id: string }) => {
      const r = await apiRequest("PATCH", `/api/opportunities/${id}`, data);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setShowForm(false);
      setEditingDeal(null);
      toast({ title: "Deal updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update deal", description: String(err?.message || ""), variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/opportunities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({ title: "Deal deleted" });
    },
  });

  const openCreate = () => {
    setEditingDeal(null);
    setForm({
      title: "", leadId: "", stage: "prospecting", value: 399,
      probability: 10, expectedCloseDate: "", notes: "", assigneeId: "", equipmentId: "",
    });
    setShowForm(true);
  };

  const openEdit = (d: Opportunity) => {
    setEditingDeal(d);
    setForm({
      title: d.title, leadId: d.leadId, stage: d.stage as DealStage,
      value: d.value, probability: d.probability, expectedCloseDate: d.expectedCloseDate,
      notes: d.notes, assigneeId: d.assigneeId, equipmentId: d.equipmentId || "",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title) return;
    if (editingDeal) updateMut.mutate({ id: editingDeal.id, ...form });
    else createMut.mutate(form);
  };

  const handleStageChange = (dealId: string, newStage: DealStage) => {
    updateMut.mutate({ id: dealId, stage: newStage });
  };

  const activeDeals = deals.filter(d => d.stage !== "closed-won" && d.stage !== "closed-lost");
  const totalPipeline = activeDeals.reduce((s, d) => s + d.value, 0);
  const weightedPipeline = activeDeals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
  const wonDeals = deals.filter(d => d.stage === "closed-won");
  const wonTotal = wonDeals.reduce((s, d) => s + d.value, 0);
  const filtered = filterStage === "all" ? deals : deals.filter(d => d.stage === filterStage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Deal Pipeline</h2>
          <p className="text-xs text-muted-foreground mt-1">{activeDeals.length} active deals | ${totalPipeline.toLocaleString()} total pipeline</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> New Deal</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Pipeline", value: `$${totalPipeline.toLocaleString()}`, sub: `${activeDeals.length} active deals` },
          { label: "Weighted Pipeline", value: `$${Math.round(weightedPipeline).toLocaleString()}`, sub: "probability-adjusted", color: "text-primary" },
          { label: "Closed Won", value: `$${wonTotal.toLocaleString()}`, sub: `${wonDeals.length} deals`, color: "text-emerald-400" },
          { label: "Win Rate", value: deals.filter(d => d.stage === "closed-won" || d.stage === "closed-lost").length > 0
            ? `${Math.round((wonDeals.length / deals.filter(d => d.stage === "closed-won" || d.stage === "closed-lost").length) * 100)}%` : "—",
            sub: "of closed deals" },
        ].map(k => (
          <Card key={k.label} className="border-border/50"><CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color || ""}`}>{k.value}</div>
            <div className="text-[10px] text-muted-foreground">{k.sub}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader className="py-3 px-4"><CardTitle className="text-sm">Pipeline Funnel</CardTitle></CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {DEAL_STAGES.filter(s => s !== "closed-won" && s !== "closed-lost").map(stage => {
              const cfg = DEAL_STAGE_CONFIG[stage];
              const inStage = deals.filter(d => d.stage === stage);
              const stageValue = inStage.reduce((s, d) => s + d.value, 0);
              const pct = totalPipeline > 0 ? (stageValue / totalPipeline) * 100 : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className="w-28 text-xs font-medium">{cfg.label}</div>
                  <div className="flex-1"><Progress value={pct} className="h-2" /></div>
                  <div className="w-16 text-right text-xs text-muted-foreground">{inStage.length} deals</div>
                  <div className="w-20 text-right text-xs font-medium">${stageValue.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{DEAL_STAGE_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} deals</span>
      </div>

      <div className="space-y-2">
        {filtered.map(deal => {
          const cfg = DEAL_STAGE_CONFIG[deal.stage as DealStage] || DEAL_STAGE_CONFIG.prospecting;
          const weighted = deal.value * (deal.probability / 100);
          return (
            <Card key={deal.id} className="border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{deal.title || "Untitled Deal"}</h3>
                      <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {deal.leadBusiness && <span>{deal.leadBusiness}</span>}
                      {deal.assigneeName && <span>Assigned: {deal.assigneeName}</span>}
                      {deal.equipmentName && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{deal.equipmentName}</span>}
                      {deal.expectedCloseDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{deal.expectedCloseDate}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">${deal.value.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">{deal.probability}% → ${Math.round(weighted).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {deal.stage !== "closed-won" && deal.stage !== "closed-lost" && (
                      <Select value={deal.stage} onValueChange={(v) => handleStageChange(deal.id, v as DealStage)}>
                        <SelectTrigger className="w-[100px] h-7 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEAL_STAGES.map(s => <SelectItem key={s} value={s} className="text-xs">{DEAL_STAGE_CONFIG[s].label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(deal)}><Edit3 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => { if (confirm("Delete this deal?")) deleteMut.mutate(deal.id); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="border-dashed"><CardContent className="p-8 text-center">
            <DollarSign className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No deals yet. Create your first deal to start tracking your pipeline.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}><Plus className="w-3.5 h-3.5 mr-1" /> New Deal</Button>
          </CardContent></Card>
        )}
      </div>

      {/* Deal Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditingDeal(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeal ? "Edit Deal" : "New Deal"}</DialogTitle>
            <DialogDescription>Track an opportunity through your sales pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Deal Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. ABC Restaurant - Terminal Deal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Linked Lead</Label>
                <Select value={form.leadId || "none"} onValueChange={(v) => {
                  const lid = v === "none" ? "" : v;
                  const lead = leads.find(l => l.id === lid);
                  setForm({ ...form, leadId: lid, title: form.title || (lead ? `${lead.business || lead.name} - Terminal Deal` : "") });
                }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select lead..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.business || l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Assigned To</Label>
                <Select value={form.assigneeId || "none"} onValueChange={(v) => setForm({ ...form, assigneeId: v === "none" ? "" : v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {team.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5"><Monitor className="w-3 h-3" />Linked Equipment</Label>
              <Select value={form.equipmentId || "none"} onValueChange={(v) => setForm({ ...form, equipmentId: v === "none" ? "" : v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No equipment linked</SelectItem>
                  {equipment.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name || e.model}{e.serialNumber ? ` (${e.serialNumber.slice(-6)})` : ""} — {e.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Stage</Label>
                <Select value={form.stage} onValueChange={(v) => {
                  const probMap: Record<string, number> = { prospecting: 10, qualification: 25, proposal: 50, negotiation: 75, "closed-won": 100, "closed-lost": 0 };
                  setForm({ ...form, stage: v as DealStage, probability: probMap[v] ?? form.probability });
                }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{DEAL_STAGE_CONFIG[s].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Value ($)</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Probability (%)</Label>
                <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Expected Close Date</Label>
              <Input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Deal context, next steps..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) ? "Saving..." : (editingDeal ? "Update Deal" : "Create Deal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
