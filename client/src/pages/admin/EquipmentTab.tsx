import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Monitor, Wifi, CreditCard, Printer, Package, AlertTriangle,
  CheckCircle2, Wrench, XCircle, Trash2, Edit, Link, Unlink, Filter,
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  model: string;
  brand: string;
  firmwareVersion: string;
  partNumber: string;
  productCode: string;
  featureCode: string;
  appCode: string;
  connectivity: string;
  manufactureDate: string;
  status: string;
  condition: string;
  clientId: string;
  clientName: string;
  deployedDate: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  business: string;
}

const TYPES = [
  { value: "terminal", label: "Terminal", icon: CreditCard },
  { value: "pos", label: "POS System", icon: Monitor },
  { value: "gateway", label: "Gateway", icon: Wifi },
  { value: "pinpad", label: "PIN Pad", icon: CreditCard },
  { value: "printer", label: "Printer", icon: Printer },
  { value: "other", label: "Other", icon: Package },
];

const STATUSES = [
  { value: "available", label: "Available", color: "bg-emerald-500", icon: CheckCircle2 },
  { value: "deployed", label: "Deployed", color: "bg-blue-500", icon: Link },
  { value: "maintenance", label: "Maintenance", color: "bg-amber-500", icon: Wrench },
  { value: "decommissioned", label: "Decommissioned", color: "bg-gray-500", icon: XCircle },
  { value: "lost", label: "Lost", color: "bg-red-500", icon: AlertTriangle },
];

const CONDITIONS = ["new", "good", "fair", "poor"];

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find(st => st.value === status) || STATUSES[0];
  const Icon = s.icon;
  return (
    <Badge variant="outline" className="gap-1 text-[11px]">
      <div className={`w-2 h-2 rounded-full ${s.color}`} />
      {s.label}
    </Badge>
  );
}

function TypeIcon({ type }: { type: string }) {
  const t = TYPES.find(tp => tp.value === type) || TYPES[5];
  const Icon = t.icon;
  return <Icon className="w-4 h-4 text-muted-foreground" />;
}

const emptyForm = {
  name: "", type: "terminal", serialNumber: "", model: "", brand: "",
  firmwareVersion: "", partNumber: "", productCode: "", featureCode: "",
  appCode: "", connectivity: "", manufactureDate: "",
  status: "available", condition: "new", clientId: "", clientName: "",
  deployedDate: "", purchaseDate: "", purchaseCost: 0, warrantyExpiry: "", notes: "",
};

export default function EquipmentTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [assignItem, setAssignItem] = useState<Equipment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => apiRequest("POST", "/api/equipment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setShowAdd(false);
      setForm(emptyForm);
      toast({ title: "Equipment added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/equipment/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setEditItem(null);
      setAssignItem(null);
      toast({ title: "Equipment updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/equipment/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "Equipment removed" });
    },
  });

  const filtered = equipment.filter(e => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.serialNumber.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q) ||
        (e.brand || "").toLowerCase().includes(q) ||
        e.clientName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === "available").length,
    deployed: equipment.filter(e => e.status === "deployed").length,
    maintenance: equipment.filter(e => e.status === "maintenance").length,
    totalValue: equipment.reduce((s, e) => s + (e.purchaseCost || 0), 0),
  };

  function openEdit(item: Equipment) {
    setForm({
      name: item.name, type: item.type, serialNumber: item.serialNumber, model: item.model,
      brand: item.brand || "", firmwareVersion: item.firmwareVersion || "",
      partNumber: item.partNumber || "", productCode: item.productCode || "",
      featureCode: item.featureCode || "", appCode: item.appCode || "",
      connectivity: item.connectivity || "", manufactureDate: item.manufactureDate || "",
      status: item.status, condition: item.condition, clientId: item.clientId,
      clientName: item.clientName, deployedDate: item.deployedDate, purchaseDate: item.purchaseDate,
      purchaseCost: item.purchaseCost, warrantyExpiry: item.warrantyExpiry, notes: item.notes,
    });
    setEditItem(item);
  }

  function EquipmentForm({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) {
    const [showDetails, setShowDetails] = useState(false);
    return (
      <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Name / Description</Label>
            <Input placeholder="PaybotX VP100" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Brand</Label>
            <Input placeholder="PaybotX" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Serial Number</Label>
            <Input placeholder="B9CA00229574" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Model</Label>
            <Input placeholder="SP880" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Condition</Label>
            <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Purchase Cost</Label>
            <Input type="number" placeholder="399" value={form.purchaseCost || ""} onChange={e => setForm(f => ({ ...f, purchaseCost: parseFloat(e.target.value) || 0 }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Purchase Date</Label>
            <Input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Warranty Expiry</Label>
            <Input type="date" value={form.warrantyExpiry} onChange={e => setForm(f => ({ ...f, warrantyExpiry: e.target.value }))} />
          </div>
        </div>

        {/* Collapsible Hardware Details */}
        <button type="button" onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
          <span className={`transition-transform ${showDetails ? "rotate-90" : ""}`}>▶</span>
          Hardware Details (firmware, part number, connectivity)
        </button>
        {showDetails && (
          <div className="space-y-3 pl-2 border-l-2 border-border/50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Firmware Version</Label>
                <Input placeholder="8.4.0.1" value={form.firmwareVersion} onChange={e => setForm(f => ({ ...f, firmwareVersion: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Connectivity</Label>
                <Input placeholder="CST/ETH/WL/RF/SD/BL" value={form.connectivity} onChange={e => setForm(f => ({ ...f, connectivity: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Part Number (PN)</Label>
                <Input placeholder="B9G-HB76W70000" value={form.partNumber} onChange={e => setForm(f => ({ ...f, partNumber: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Product Code</Label>
                <Input placeholder="58B9G-HB76W70000000" value={form.productCode} onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Feature Code</Label>
                <Input placeholder="M024582" value={form.featureCode} onChange={e => setForm(f => ({ ...f, featureCode: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">APP Code</Label>
                <Input placeholder="AH99" value={form.appCode} onChange={e => setForm(f => ({ ...f, appCode: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Manufacture Date</Label>
                <Input placeholder="11/2025" value={form.manufactureDate} onChange={e => setForm(f => ({ ...f, manufactureDate: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="Any notes..." className="h-16" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <Button onClick={onSubmit} className="w-full">{submitLabel}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Package, color: "text-foreground" },
          { label: "Available", value: stats.available, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Deployed", value: stats.deployed, icon: Link, color: "text-blue-500" },
          { label: "Maintenance", value: stats.maintenance, icon: Wrench, color: "text-amber-500" },
          { label: "Inventory Value", value: `$${stats.totalValue.toLocaleString()}`, icon: CreditCard, color: "text-foreground" },
        ].map(s => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <s.icon className={`w-5 h-5 ${s.color} opacity-50`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, serial, model, or client..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (v) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Add Equipment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
            <EquipmentForm
              submitLabel="Add Equipment"
              onSubmit={() => addMutation.mutate(form)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Equipment Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Serial / Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Deployed</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    {equipment.length === 0 ? "No equipment yet. Add your first item above." : "No equipment matches your filters."}
                  </TableCell>
                </TableRow>
              ) : filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell><TypeIcon type={item.type} /></TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{item.name || "Unnamed"}</div>
                    <div className="text-[10px] text-muted-foreground">{item.brand ? `${item.brand} · ` : ""}{TYPES.find(t => t.value === item.type)?.label}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{item.serialNumber || "—"}</div>
                    <div className="text-[10px] text-muted-foreground">{[item.model, item.firmwareVersion ? `FW ${item.firmwareVersion}` : ""].filter(Boolean).join(" · ") || "—"}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    <span className={`text-xs capitalize ${item.condition === "poor" ? "text-red-500" : item.condition === "fair" ? "text-amber-500" : "text-foreground"}`}>
                      {item.condition}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.clientName ? (
                      <span className="text-sm text-blue-500">{item.clientName}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.deployedDate || "—"}</TableCell>
                  <TableCell className="text-right text-sm">{item.purchaseCost ? `$${item.purchaseCost}` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* Assign/Unassign client */}
                      <Dialog open={assignItem?.id === item.id} onOpenChange={v => { if (!v) setAssignItem(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setAssignItem(item)}>
                            {item.clientId ? <Unlink className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{item.clientId ? "Reassign" : "Assign to Client"}</DialogTitle></DialogHeader>
                          <div className="space-y-3 py-2">
                            <p className="text-sm text-muted-foreground">
                              {item.name} {item.serialNumber ? `(${item.serialNumber})` : ""}
                            </p>
                            <Select onValueChange={clientId => {
                              const client = clients.find(c => c.id === clientId);
                              updateMutation.mutate({
                                id: item.id,
                                clientId,
                                clientName: client?.name || client?.business || "",
                                status: "deployed",
                                deployedDate: new Date().toISOString().split("T")[0],
                              });
                            }}>
                              <SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger>
                              <SelectContent>
                                {clients.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name || c.business}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {item.clientId && (
                              <Button variant="outline" className="w-full" onClick={() => {
                                updateMutation.mutate({ id: item.id, clientId: "", clientName: "", status: "available", deployedDate: "" });
                              }}>
                                <Unlink className="w-3.5 h-3.5 mr-1.5" />Unassign (Return to Inventory)
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Edit */}
                      <Dialog open={editItem?.id === item.id} onOpenChange={v => { if (!v) setEditItem(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
                          <EquipmentForm
                            submitLabel="Save Changes"
                            onSubmit={() => updateMutation.mutate({ id: item.id, ...form })}
                          />
                        </DialogContent>
                      </Dialog>

                      {/* Delete */}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        onClick={() => { if (confirm(`Delete ${item.name}?`)) deleteMutation.mutate(item.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
