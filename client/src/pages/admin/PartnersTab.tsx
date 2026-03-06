import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Search, Users, GraduationCap, DollarSign, Star, Trophy, Award, Zap,
  Copy, Check, Trash2, Edit, Eye, EyeOff, Mail, Phone, Building, User,
  ExternalLink, MoreHorizontal, Shield, TrendingUp, Clock,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface PartnerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatarColor: string;
  tier: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalEarned: number;
  lastLogin: string;
  createdAt: string;
  accessCode?: string;
}

// ─── Config ──────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; textColor: string; icon: typeof Star; payout: string }> = {
  bronze: { label: "Bronze", color: "text-amber-600", bg: "bg-amber-500/10", textColor: "text-amber-500", icon: Star, payout: "$50" },
  silver: { label: "Silver", color: "text-slate-400", bg: "bg-slate-400/10", textColor: "text-slate-300", icon: Award, payout: "$75" },
  gold: { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-400/10", textColor: "text-yellow-400", icon: Trophy, payout: "$100+" },
  platinum: { label: "Platinum", color: "text-cyan-300", bg: "bg-cyan-300/10", textColor: "text-cyan-300", icon: Zap, payout: "$150+" },
};

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6d28d9",
];

// ─── Component ───────────────────────────────────────────────────────

export default function PartnersTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerAccount | null>(null);
  const [copiedId, setCopiedId] = useState("");
  const [showCodes, setShowCodes] = useState(false);
  const [viewPartner, setViewPartner] = useState<PartnerAccount | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "",
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    accessCode: "",
  });

  const { data: partners = [], isLoading } = useQuery<PartnerAccount[]>({
    queryKey: ["/api/partner-accounts"],
  });

  const createPartner = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/partner-accounts", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-accounts"] });
      toast({ title: "Partner created", description: `Access code: ${data.accessCode}` });
      setShowForm(false);
      resetForm();
    },
    onError: () => toast({ title: "Failed to create partner", variant: "destructive" }),
  });

  const updatePartner = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PartnerAccount> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/partner-accounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-accounts"] });
      toast({ title: "Partner updated" });
      setEditingPartner(null);
      resetForm();
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/partner-accounts/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner-accounts"] });
      toast({ title: "Partner removed" });
      setViewPartner(null);
    },
  });

  const resetForm = () => setForm({
    name: "", email: "", phone: "", company: "",
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    accessCode: "",
  });

  const openEdit = (p: PartnerAccount) => {
    setEditingPartner(p);
    setForm({ name: p.name, email: p.email, phone: p.phone, company: p.company, avatarColor: p.avatarColor, accessCode: "" });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingPartner(null);
    resetForm();
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingPartner) {
      updatePartner.mutate({ id: editingPartner.id, name: form.name, email: form.email, phone: form.phone, company: form.company });
    } else {
      createPartner.mutate(form);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
    toast({ title: "Copied!", description: "Access code copied to clipboard" });
  };

  const filtered = partners.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.company.toLowerCase().includes(search.toLowerCase())
  );

  const totalEarned = partners.reduce((s, p) => s + (p.totalEarned || 0), 0);
  const totalReferrals = partners.reduce((s, p) => s + (p.totalReferrals || 0), 0);
  const activePartners = partners.filter(p => p.lastLogin).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Partner Program
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage referral partner accounts and access codes</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://program.techsavvyhawaii.com" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-3 h-3" />program.techsavvyhawaii.com
          </a>
          <Button size="sm" className="h-8 text-xs" onClick={openNew}>
            <Plus className="w-3.5 h-3.5 mr-1" />Add Partner
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Total Partners</span>
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold">{partners.length}</div>
            <p className="text-[10px] text-muted-foreground">{activePartners} active</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Total Referrals</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold">{totalReferrals}</div>
            <p className="text-[10px] text-muted-foreground">across all partners</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Paid Out</span>
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="text-xl font-bold">${totalEarned.toFixed(0)}</div>
            <p className="text-[10px] text-muted-foreground">total commissions</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">Avg/Partner</span>
              <Star className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-xl font-bold">{partners.length ? (totalReferrals / partners.length).toFixed(1) : 0}</div>
            <p className="text-[10px] text-muted-foreground">referrals each</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners..." className="pl-8 h-8 text-xs" />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowCodes(!showCodes)}>
          {showCodes ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showCodes ? "Hide" : "Show"} Codes
        </Button>
      </div>

      {/* Partner List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="py-10 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{search ? "No partners match your search" : "No partners yet"}</p>
            <Button size="sm" variant="outline" className="mt-3 text-xs" onClick={openNew}>
              <Plus className="w-3.5 h-3.5 mr-1" />Create First Partner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const tier = TIER_CONFIG[p.tier] || TIER_CONFIG.bronze;
            const TierIcon = tier.icon;
            return (
              <Card key={p.id} className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: p.avatarColor }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        <Badge variant="outline" className={`text-[9px] ${tier.textColor} border-current/20`}>
                          <TierIcon className="w-2.5 h-2.5 mr-0.5" />{tier.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                        {p.company && <span className="flex items-center gap-1"><Building className="w-2.5 h-2.5" />{p.company}</span>}
                        {p.email && <span className="flex items-center gap-1 hidden sm:flex"><Mail className="w-2.5 h-2.5" />{p.email}</span>}
                        {p.phone && <span className="flex items-center gap-1 hidden md:flex"><Phone className="w-2.5 h-2.5" />{p.phone}</span>}
                      </div>
                    </div>

                    {/* Access code */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <code className={`px-2 py-1 rounded text-[10px] font-mono bg-muted/50 ${showCodes ? "" : "blur-sm select-none"}`}>
                        {p.accessCode || "••••••••"}
                      </code>
                      {showCodes && p.accessCode && (
                        <button onClick={() => copyCode(p.accessCode!, p.id)} className="text-muted-foreground hover:text-primary transition-colors">
                          {copiedId === p.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-[10px]">
                      <div className="text-center hidden sm:block">
                        <div className="font-bold text-sm">{p.totalReferrals}</div>
                        <div className="text-muted-foreground">refs</div>
                      </div>
                      <div className="text-center hidden md:block">
                        <div className="font-bold text-sm text-green-400">${p.totalEarned?.toFixed(0) || 0}</div>
                        <div className="text-muted-foreground">earned</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewPartner(p)} title="View details">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)} title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingPartner(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPartner ? "Edit Partner" : "Create Partner Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@email.com" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="808-555-1234" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company / Niche</Label>
              <Input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Aloha Networking Group" className="h-9" />
            </div>
            {!editingPartner && (
              <div className="space-y-1.5">
                <Label className="text-xs">Access Code (leave blank to auto-generate)</Label>
                <Input value={form.accessCode} onChange={(e) => setForm(f => ({ ...f, accessCode: e.target.value.toUpperCase() }))} placeholder="e.g. ALOHA2025" className="h-9 font-mono tracking-wider" maxLength={12} />
                <p className="text-[10px] text-muted-foreground">Partners use this code to log in at program.techsavvyhawaii.com</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Avatar Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm(f => ({ ...f, avatarColor: color }))}
                    className={`w-7 h-7 rounded-lg transition-all ${form.avatarColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingPartner(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || createPartner.isPending || updatePartner.isPending}>
              {createPartner.isPending || updatePartner.isPending ? "Saving..." : editingPartner ? "Update" : "Create Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Partner Details Dialog */}
      <Dialog open={!!viewPartner} onOpenChange={(open) => { if (!open) setViewPartner(null); }}>
        <DialogContent className="sm:max-w-lg">
          {viewPartner && (() => {
            const tier = TIER_CONFIG[viewPartner.tier] || TIER_CONFIG.bronze;
            const TierIcon = tier.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: viewPartner.avatarColor }}>
                      {viewPartner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div>{viewPartner.name}</div>
                      <div className={`text-xs font-normal flex items-center gap-1 ${tier.textColor}`}>
                        <TierIcon className="w-3 h-3" />{tier.label} Partner — {tier.payout}/referral
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Contact info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewPartner.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />{viewPartner.email}
                      </div>
                    )}
                    {viewPartner.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />{viewPartner.phone}
                      </div>
                    )}
                    {viewPartner.company && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="w-3.5 h-3.5" />{viewPartner.company}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />Joined {new Date(viewPartner.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Access code */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Access Code:</span>
                    <code className="font-mono font-bold tracking-wider text-sm">{viewPartner.accessCode || "—"}</code>
                    {viewPartner.accessCode && (
                      <button onClick={() => copyCode(viewPartner.accessCode!, viewPartner.id)} className="ml-auto text-muted-foreground hover:text-primary">
                        {copiedId === viewPartner.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 rounded-lg bg-muted/20 border">
                      <div className="text-lg font-bold">{viewPartner.totalReferrals}</div>
                      <div className="text-[10px] text-muted-foreground">Referrals</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/20 border">
                      <div className="text-lg font-bold text-emerald-400">{viewPartner.successfulReferrals}</div>
                      <div className="text-[10px] text-muted-foreground">Activated</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/20 border">
                      <div className="text-lg font-bold text-green-400">${viewPartner.totalEarned?.toFixed(0) || 0}</div>
                      <div className="text-[10px] text-muted-foreground">Earned</div>
                    </div>
                  </div>

                  {/* Tier upgrade */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Partner Tier</Label>
                    <Select value={viewPartner.tier} onValueChange={(val) => {
                      updatePartner.mutate({ id: viewPartner.id, tier: val } as any);
                      setViewPartner({ ...viewPartner, tier: val });
                    }}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            <span className={`flex items-center gap-1.5 ${cfg.textColor}`}>
                              <cfg.icon className="w-3 h-3" />{cfg.label} — {cfg.payout}/referral
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Manual earnings/referral update */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Successful Referrals</Label>
                      <Input
                        type="number" min={0}
                        value={viewPartner.successfulReferrals}
                        onChange={(e) => setViewPartner({ ...viewPartner, successfulReferrals: parseInt(e.target.value) || 0 })}
                        onBlur={() => updatePartner.mutate({ id: viewPartner.id, successfulReferrals: viewPartner.successfulReferrals } as any)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Total Earned ($)</Label>
                      <Input
                        type="number" min={0} step={0.01}
                        value={viewPartner.totalEarned || 0}
                        onChange={(e) => setViewPartner({ ...viewPartner, totalEarned: parseFloat(e.target.value) || 0 })}
                        onBlur={() => updatePartner.mutate({ id: viewPartner.id, totalEarned: viewPartner.totalEarned } as any)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-row justify-between sm:justify-between">
                  <Button variant="destructive" size="sm" className="text-xs" onClick={() => {
                    if (confirm(`Delete partner "${viewPartner.name}"? This cannot be undone.`)) deletePartner.mutate(viewPartner.id);
                  }}>
                    <Trash2 className="w-3 h-3 mr-1" />Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => openEdit(viewPartner)}>
                      <Edit className="w-3 h-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" className="text-xs" onClick={() => setViewPartner(null)}>Done</Button>
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
