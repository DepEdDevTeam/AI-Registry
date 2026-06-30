import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import {
  Search, CheckCircle2, XCircle, Clock, Trash2, Mail, Phone, User, Building2, Loader2,
} from "lucide-react";
import ConfirmDeleteDialog from "@/components/collaboration/ConfirmDeleteDialog";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface PartnerRow {
  id: string;
  name: string;
  description: string;
  background: string | null;
  status: string;
  owner_email: string | null;
  contact_person: string | null;
  contact_position: string | null;
  contact_number: string | null;
  contact_email: string | null;
  proposed_by: string | null;
  created_at: string;
  key: string;
  logo_svg: string | null;
  theme_config: { primary?: string; accent?: string } | null;
}

const normalizeStatus = (s: string): "approved" | "pending" | "rejected" => {
  if (s === "approved" || s === "active") return "approved";
  if (s === "rejected") return "rejected";
  return "pending"; // pending, proposed, anything else
};

const StatusBadge = ({ status }: { status: string }) => {
  const norm = normalizeStatus(status);
  if (norm === "approved")
    return (
      <Badge className="bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/20 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </Badge>
    );
  if (norm === "rejected")
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 gap-1">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  return (
    <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/20 gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
};

const PartnerManagement = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string; email: string }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<PartnerRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PartnerRow | null>(null);
  const [actioning, setActioning] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [partnersRes, profilesRes] = await Promise.all([
      supabase.from("partners").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name, email"),
    ]);
    setPartners((partnersRes.data || []) as unknown as PartnerRow[]);
    const map: Record<string, { display_name: string; email: string }> = {};
    (profilesRes.data || []).forEach((p: any) => {
      map[p.id] = { display_name: p.display_name, email: p.email };
    });
    setProfiles(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("dashboard-partners")
      .on("postgres_changes", { event: "*", schema: "public", table: "partners" }, fetchAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getContactPerson = (p: PartnerRow) =>
    p.contact_person || (p.proposed_by ? profiles[p.proposed_by]?.display_name : "") || "—";
  const getContactEmail = (p: PartnerRow) =>
    p.contact_email || p.owner_email || (p.proposed_by ? profiles[p.proposed_by]?.email : "") || "—";

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      const norm = normalizeStatus(p.status);
      if (statusFilter !== "all" && norm !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        getContactPerson(p).toLowerCase().includes(q) ||
        getContactEmail(p).toLowerCase().includes(q)
      );
    });
  }, [partners, statusFilter, search, profiles]);

  const counts = useMemo(() => {
    const c = { all: partners.length, pending: 0, approved: 0, rejected: 0 };
    partners.forEach((p) => {
      c[normalizeStatus(p.status)]++;
    });
    return c;
  }, [partners]);

  const updateStatus = async (p: PartnerRow, next: "approved" | "rejected") => {
    setActioning(true);
    const before = { status: p.status };
    const { error } = await supabase.from("partners").update({ status: next }).eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await logAudit(`partner.${next}`, "partners", p.id, before, { status: next });
      toast({ title: `Partner ${next}`, description: `"${p.name}" was ${next}.` });
      setSelected((cur) => (cur && cur.id === p.id ? { ...cur, status: next } : cur));
      fetchAll();
    }
    setActioning(false);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const before = { name: pendingDelete.name };
    const { data: deleted, error } = await supabase.rpc("delete_partner_as_super_admin", {
      _partner_id: pendingDelete.id,
    });
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return;
    }
    if (!deleted) {
      toast({
        title: "Delete not completed",
        description: "The partner record still exists. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    await logAudit("delete", "partners", pendingDelete.id, before, null);
    toast({ title: "Partner deleted", description: `${pendingDelete.name} was removed.` });
    setSelected(null);
    setPendingDelete(null);
    fetchAll();
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {([
          { key: "all", label: "Total", value: counts.all, icon: Building2, color: "text-primary" },
          { key: "pending", label: "Pending", value: counts.pending, icon: Clock, color: "text-yellow-600" },
          { key: "approved", label: "Approved", value: counts.approved, icon: CheckCircle2, color: "text-green-600" },
          { key: "rejected", label: "Rejected", value: counts.rejected, icon: XCircle, color: "text-destructive" },
        ] as const).map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key as StatusFilter)}
            className={`text-left rounded-lg border bg-card/40 backdrop-blur-md p-4 transition-all hover:border-primary/50 ${
              statusFilter === s.key ? "border-primary ring-1 ring-primary/30" : "border-border/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, contact, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="bg-card/40 backdrop-blur-md border-border/40">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No partners found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{getContactPerson(p)}</TableCell>
                    <TableCell className="text-muted-foreground">{getContactEmail(p)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  {selected.logo_svg ? (
                    <div
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary/50 p-0.5"
                      dangerouslySetInnerHTML={{ __html: selected.logo_svg }}
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                    <DialogDescription className="mt-1">
                      Submitted {new Date(selected.created_at).toLocaleString()}
                    </DialogDescription>
                    <div className="mt-2"><StatusBadge status={selected.status} /></div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {selected.description && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Concept Note</div>
                    <p className="text-foreground/90 whitespace-pre-wrap">{selected.description}</p>
                  </div>
                )}
                {selected.background && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Background</div>
                    <p className="text-foreground/90 whitespace-pre-wrap">{selected.background}</p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border/40 bg-background/40 p-4">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Contact person</div>
                      <div className="font-medium">{getContactPerson(selected)}</div>
                      {selected.contact_position && (
                        <div className="text-xs text-muted-foreground">{selected.contact_position}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium break-all">{getContactEmail(selected)}</div>
                    </div>
                  </div>
                  {selected.contact_number && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Contact number</div>
                        <div className="font-medium">{selected.contact_number}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Profile key</div>
                      <div className="font-mono text-xs">{selected.key}</div>
                    </div>
                  </div>
                </div>

                {normalizeStatus(selected.status) === "approved" && (
                  <a
                    href={`/partners/${selected.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Open public profile →
                  </a>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => setPendingDelete(selected)}
                  disabled={actioning}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <div className="flex-1" />
                {normalizeStatus(selected.status) !== "rejected" && (
                  <Button
                    variant="outline"
                    className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => updateStatus(selected, "rejected")}
                    disabled={actioning}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                )}
                {normalizeStatus(selected.status) !== "approved" && (
                  <Button
                    className="gap-1"
                    onClick={() => updateStatus(selected, "approved")}
                    disabled={actioning}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        itemName={pendingDelete?.name || ""}
        itemType="Partner"
      />
    </div>
  );
};

export default PartnerManagement;
