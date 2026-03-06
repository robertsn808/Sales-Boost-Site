import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit3, Users, Shield, UserCog, Mail, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import type { UserAccount, UserRole } from "./types";
import { USER_ROLE_CONFIG } from "./constants";

export default function UsersTab() {
  const { toast } = useToast();
  const { data: users = [], refetch } = useQuery<UserAccount[]>({ queryKey: ["/api/user-accounts"] });
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [form, setForm] = useState({
    email: "", displayName: "", role: "sales-rep" as UserRole, password: "",
  });

  const createMut = useMutation({
    mutationFn: async (data: typeof form) => { const r = await apiRequest("POST", "/api/user-accounts", data); return r.json(); },
    onSuccess: () => { refetch(); setShowForm(false); toast({ title: "User created" }); },
    onError: (err: Error) => { toast({ title: "Failed to create user", description: err.message.replace(/^\d+:\s*/, ""), variant: "destructive" }); },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<UserAccount> & { id: string; password?: string }) => { const r = await apiRequest("PATCH", `/api/user-accounts/${id}`, data); return r.json(); },
    onSuccess: () => { refetch(); setShowForm(false); setEditingUser(null); toast({ title: "User updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/user-accounts/${id}`),
    onSuccess: () => { refetch(); toast({ title: "User deleted" }); },
  });

  const toggleActive = (user: UserAccount) => {
    updateMut.mutate({ id: user.id, isActive: !user.isActive } as any);
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: "", displayName: "", role: "sales-rep", password: "" });
    setShowForm(true);
  };

  const openEdit = (u: UserAccount) => {
    setEditingUser(u);
    setForm({ email: u.email, displayName: u.displayName, role: u.role as UserRole, password: "" });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingUser) {
      const data: any = { id: editingUser.id, email: form.email, displayName: form.displayName, role: form.role };
      if (form.password) data.password = form.password;
      updateMut.mutate(data);
    } else {
      if (!form.password) { toast({ title: "Password is required for new users", variant: "destructive" }); return; }
      createMut.mutate(form);
    }
  };

  const activeUsers = users.filter(u => u.isActive);
  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Management</h2>
          <p className="text-xs text-muted-foreground mt-1">{activeUsers.length} active users | {users.length} total</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5" /> Add User</Button>
      </div>

      {/* Role breakdown */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(USER_ROLE_CONFIG).map(([role, cfg]) => (
          <Badge key={role} variant="outline" className={`text-xs ${cfg.color}`}>
            <Shield className="w-3 h-3 mr-1" />
            {cfg.label}: {roleCounts[role] || 0}
          </Badge>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {users.map(user => {
          const roleCfg = USER_ROLE_CONFIG[user.role as UserRole] || USER_ROLE_CONFIG["sales-rep"];
          return (
            <Card key={user.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${user.isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {user.displayName.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{user.displayName || "Unnamed"}</h3>
                        <Badge variant="outline" className={`text-[10px] ${roleCfg.color}`}>{roleCfg.label}</Badge>
                        {!user.isActive && <Badge variant="outline" className="text-[10px] text-red-400 bg-red-400/10">Inactive</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{user.email || "No email"}</span>
                        {user.lastLoginAt && <span className="ml-2">Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(user)} title={user.isActive ? "Deactivate" : "Activate"}>
                      {user.isActive ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}><Edit3 className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => { if (confirm(`Delete ${user.displayName}?`)) deleteMut.mutate(user.id); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {users.length === 0 && (
          <Card className="border-dashed"><CardContent className="p-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No users yet. Add team members to enable role-based access control.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}><Plus className="w-3.5 h-3.5" /> Add First User</Button>
          </CardContent></Card>
        )}
      </div>

      {/* Permissions Reference */}
      <Card className="border-border/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(USER_ROLE_CONFIG).map(([role, cfg]) => (
              <div key={role} className="space-y-1">
                <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                <ul className="text-[10px] text-muted-foreground space-y-0.5 ml-2">
                  {cfg.permissions.map(p => <li key={p} className="flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5 text-emerald-400" />{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setEditingUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>Manage user access to the CRM dashboard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Display Name</Label>
              <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="John Smith" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(USER_ROLE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{editingUser ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingUser ? "Leave blank to keep current" : "Initial password"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.displayName || !form.email}>{editingUser ? "Update" : "Create"} User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
