import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // 1. Swapped MongoDB for Supabase
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { Shield, Loader2, CheckCircle2, Trash2 } from "lucide-react";

interface ToolDetailModalProps {
  open: boolean;
  onClose: () => void;
  toolName: string;
  partnerId?: string;
  proposalId?: string;
  existingDetailId?: string;
  onSaved?: () => void;
  onDeleted?: () => void;
  isAdminOrAbove?: boolean;
}

const riskLevels = [
  { value: "Minimal", label: "Minimal", description: "Low/no-risk (e.g. grammar checkers)" },
  { value: "Limited", label: "Limited", description: "Interactive tools, requires transparency" },
  { value: "High", label: "High", description: "High-stakes decisions, requires PIA & audit" },
  { value: "Unacceptable", label: "Unacceptable", description: "Prohibited in basic education" },
];

const ToolDetailModal = ({ open, onClose, toolName, partnerId, proposalId, existingDetailId, onSaved, onDeleted, isAdminOrAbove = false }: ToolDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [riskApproved, setRiskApproved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    risk_classification: "Minimal",
    description: "",
    intended_use: "",
    privacy_impact_assessment: "",
    compliance_assessment: "",
    responsible_officer: "",
    oversight_mechanism: "",
    tool_url: "",
  });

  useEffect(() => {
    if (open && existingDetailId) {
      setFetching(true);
      setConfirmDelete(false);
      
      // 2. Fetch tool details directly from Postgres
      const fetchDetail = async () => {
        const { data, error } = await supabase
          .from("partner_tool_details")
          .select("*")
          .eq("id", existingDetailId)
          .single();

        if (data && !error) {
          setForm({
            risk_classification: data.risk_classification || "Minimal",
            description: data.description || "",
            intended_use: data.intended_use || "",
            privacy_impact_assessment: data.privacy_impact_assessment || "",
            compliance_assessment: data.compliance_assessment || "",
            responsible_officer: data.responsible_officer || "",
            oversight_mechanism: data.oversight_mechanism || "",
            tool_url: data.tool_url || "",
          });
          setRiskApproved(data.risk_approved || false);
        }
        setFetching(false);
      };
      
      fetchDetail();
    } else if (open) {
      setForm({
        risk_classification: "Minimal",
        description: "",
        intended_use: "",
        privacy_impact_assessment: "",
        compliance_assessment: "",
        responsible_officer: "",
        oversight_mechanism: "",
        tool_url: "",
      });
      setRiskApproved(false);
      setConfirmDelete(false);
    }
  }, [open, existingDetailId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const beforeData = existingDetailId ? { ...form } : null;
      
      // 3. Update or Insert directly to Postgres
      if (existingDetailId) {
        const { error } = await supabase
          .from("partner_tool_details")
          .update(form as any)
          .eq("id", existingDetailId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("partner_tool_details")
          .insert({
            tool_name: toolName,
            partner_id: partnerId || null,
            proposal_id: proposalId || null,
            risk_approved: false,
            ...form,
          } as any);
        if (error) throw error;
      }

      await logAudit(
        existingDetailId ? "tool_detail.updated" : "tool_detail.created",
        "partner_tool_details",
        existingDetailId || null,
        beforeData,
        form
      );
      toast({ title: "Saved", description: `Governance details for "${toolName}" saved.` });
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingDetailId) return;
    setLoading(true);
    try {
      // 4. Delete directly from Postgres
      const { error } = await supabase
        .from("partner_tool_details")
        .delete()
        .eq("id", existingDetailId);
      if (error) throw error;

      await logAudit("tool_detail.deleted", "partner_tool_details", existingDetailId, form, null);
      toast({ title: "Deleted", description: `"${toolName}" has been removed.` });
      onDeleted?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const handleApproveRisk = async () => {
    if (!existingDetailId) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 5. Update risk approval directly in Postgres
      const { error } = await supabase
        .from("partner_tool_details")
        .update({
          risk_approved: true,
          risk_approved_by: session?.user?.id,
          risk_approved_at: new Date().toISOString(),
        } as any)
        .eq("id", existingDetailId);
        
      if (error) throw error;

      await logAudit("risk.approved", "partner_tool_details", existingDetailId, { risk_approved: false }, { risk_approved: true, risk_classification: form.risk_classification });
      setRiskApproved(true);
      toast({ title: "Approved", description: "Risk classification verified." });
      onSaved?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const riskColor = {
    Minimal: "text-green-600",
    Limited: "text-yellow-600",
    High: "text-orange-600",
    Unacceptable: "text-destructive",
  }[form.risk_classification] || "";

  const riskReadOnly = !isAdminOrAbove && riskApproved;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tool Governance: {toolName}
            {riskApproved && (
              <Badge variant="outline" className="ml-2 gap-1 text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Risk Classification</Label>
              {riskReadOnly ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={riskColor}>{form.risk_classification}</Badge>
                  <span className="text-xs text-muted-foreground">(Locked — verified by admin)</span>
                </div>
              ) : (
                <Select value={form.risk_classification} onValueChange={(v) => setForm({ ...form, risk_classification: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {riskLevels.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <div>
                          <span className="font-medium">{r.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{r.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className={`text-xs font-medium ${riskColor}`}>
                {riskLevels.find((r) => r.value === form.risk_classification)?.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of the tool..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Tool URL</Label>
              <Input placeholder="https://tool-website.com" value={form.tool_url} onChange={(e) => setForm({ ...form, tool_url: e.target.value })} />
              {form.tool_url && (
                <a href={form.tool_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Visit tool →</a>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Intended Use</Label>
              <Textarea placeholder="Describe the intended educational use..." value={form.intended_use} onChange={(e) => setForm({ ...form, intended_use: e.target.value })} rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Privacy Impact Assessment</Label>
              <Textarea placeholder="Data collected, storage, third-party sharing..." value={form.privacy_impact_assessment} onChange={(e) => setForm({ ...form, privacy_impact_assessment: e.target.value })} rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Compliance Assessment</Label>
              <Textarea placeholder="DepEd Order compliance, Data Privacy Act..." value={form.compliance_assessment} onChange={(e) => setForm({ ...form, compliance_assessment: e.target.value })} rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Responsible Officer</Label>
              <Input placeholder="Name and position" value={form.responsible_officer} onChange={(e) => setForm({ ...form, responsible_officer: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <Label>Oversight Mechanism</Label>
              <Textarea placeholder="Monitoring, reporting, review cycles..." value={form.oversight_mechanism} onChange={(e) => setForm({ ...form, oversight_mechanism: e.target.value })} rows={2} />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isAdminOrAbove && existingDetailId && !riskApproved && (
            <Button variant="outline" onClick={handleApproveRisk} disabled={loading} className="gap-1 text-green-600 border-green-600 hover:bg-green-50">
              <CheckCircle2 className="h-4 w-4" /> Approve Risk
            </Button>
          )}
          {isAdminOrAbove && existingDetailId && (
            confirmDelete ? (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleDelete} disabled={loading} size="sm">
                  {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Confirm Delete
                </Button>
                <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading} size="sm">
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setConfirmDelete(true)} disabled={loading} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" /> Delete Tool
              </Button>
            )
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || fetching}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Details
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToolDetailModal;