import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { logAudit } from "@/lib/audit";
import { CheckCircle2, XCircle, Clock, Wrench, ShieldCheck } from "lucide-react";
import AuditLog from "@/components/collaboration/AuditLog";
import ToolDetailModal from "@/components/collaboration/ToolDetailModal";

interface PartnerRow {
  id: string;
  name: string;
  description: string;
  tools: string;
  status: string;
  proposed_by: string | null;
  created_at: string;
  theme_config: { primary: string; secondary: string; accent: string } | null;
  logo_svg: string | null;
}

interface ToolDetail {
  id: string;
  tool_name: string;
  risk_classification: string;
  risk_approved: boolean;
  partner_id: string | null;
}

const AdminPanel = () => {
  const [pendingPartners, setPendingPartners] = useState<PartnerRow[]>([]);
  const [pendingTools, setPendingTools] = useState<ToolDetail[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [toolModalData, setToolModalData] = useState({ id: "", name: "", partnerId: "" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdminOrAbove, loading: roleLoading } = useRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdminOrAbove) {
      navigate("/");
      toast({ title: "Access denied", description: "Admin privileges required.", variant: "destructive" });
    }
  }, [roleLoading, isAdminOrAbove, navigate]);

  useEffect(() => {
    if (isAdminOrAbove) {
      fetchPendingPartners();
      fetchPendingTools();
      fetchProfiles();
    }
  }, [isAdminOrAbove]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, display_name");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((p) => (map[p.id] = p.display_name));
      setProfiles(map);
    }
  };

  const fetchPendingPartners = async () => {
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingPartners((data || []) as unknown as PartnerRow[]);
  };

  const fetchPendingTools = async () => {
    const { data } = await supabase
      .from("partner_tool_details")
      .select("*")
      .eq("risk_approved", false);
    setPendingTools((data || []) as unknown as ToolDetail[]);
  };

  const handleApprove = async (p: PartnerRow) => {
    const { error } = await supabase.from("partners").update({ status: "approved" }).eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await logAudit("partner.approved", "partners", p.id, { status: "pending" }, { status: "approved" });
      toast({ title: "Approved", description: `"${p.name}" approved.` });
      fetchPendingPartners();
    }
  };

  const handleReject = async (p: PartnerRow) => {
    const { error } = await supabase.from("partners").update({ status: "rejected" }).eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await logAudit("partner.rejected", "partners", p.id, { status: "pending" }, { status: "rejected" });
      toast({ title: "Rejected", description: `"${p.name}" rejected.` });
      fetchPendingPartners();
    }
  };

  if (roleLoading) return <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading...</div>;
  if (!isAdminOrAbove) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-muted-foreground">Manage pending approvals and review audit trail</p>
      </div>

      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tools" className="gap-1">
            <Wrench className="h-3.5 w-3.5" /> Pending Risk Reviews ({pendingTools.length})
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingTools.map((tool) => (
              <Card key={tool.id} className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => {
                  setToolModalData({ id: tool.id, name: tool.tool_name, partnerId: tool.partner_id || "" });
                  setToolModalOpen(true);
                }}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" /> {tool.tool_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{tool.risk_classification}</Badge>
                    <span className="text-xs text-muted-foreground">Awaiting review</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingTools.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
                All tools reviewed
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <AuditLog profiles={profiles} />
        </TabsContent>
      </Tabs>

      <ToolDetailModal
        open={toolModalOpen}
        onClose={() => { setToolModalOpen(false); fetchPendingTools(); }}
        toolName={toolModalData.name}
        existingDetailId={toolModalData.id || undefined}
        partnerId={toolModalData.partnerId || undefined}
        onSaved={() => fetchPendingTools()}
        onDeleted={() => fetchPendingTools()}
        isAdminOrAbove={isAdminOrAbove}
      />
    </div>
  );
};

export default AdminPanel;
