import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wrench, X, Shield, ExternalLink } from "lucide-react";
import ToolDetailModal from "./ToolDetailModal";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface PartnerSource {
  id: string;
  name: string;
  tools: string;
}

interface ToolDetail {
  id: string;
  tool_name: string;
  tool_url: string;
  partner_id: string | null;
  risk_classification: string;
}

const isValidUrl = (str: string) => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const ExistingPartnerTools = ({ isAdminOrAbove = false }: { isAdminOrAbove?: boolean }) => {
  const [partners, setPartners] = useState<PartnerSource[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newToolName, setNewToolName] = useState("");
  const [newToolUrl, setNewToolUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [toolDetails, setToolDetails] = useState<ToolDetail[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTool, setModalTool] = useState({ name: "", partnerId: "", detailId: "" });
  const [deleteToolTarget, setDeleteToolTarget] = useState<{ partner: PartnerSource; toolName: string } | null>(null);
  const { toast } = useToast();

  const fetchPartners = async () => {
    const { data } = await supabase
      .from("partners")
      .select("id, name, tools")
      .in("status", ["approved", "active"]);
    setPartners((data || []).map((p) => ({ id: p.id, name: p.name, tools: p.tools || "" })));
  };

  const fetchToolDetails = async () => {
    const { data } = await supabase
      .from("partner_tool_details")
      .select("id, tool_name, tool_url, partner_id, risk_classification");
    if (data) setToolDetails(data as unknown as ToolDetail[]);
  };

  useEffect(() => {
    fetchPartners();
    fetchToolDetails();
  }, []);

  const getToolDetail = (partner: PartnerSource, toolName: string) =>
    toolDetails.find((d) => d.partner_id === partner.id && d.tool_name === toolName);

  const openToolModal = (toolName: string, partner: PartnerSource, detailId?: string) => {
    setModalTool({ name: toolName, partnerId: partner.id, detailId: detailId || "" });
    setModalOpen(true);
  };

  const handleAddTool = async (partner: PartnerSource) => {
    if (!newToolName.trim()) return;
    if (!newToolUrl.trim() || !isValidUrl(newToolUrl.trim())) {
      setUrlError("Please enter a valid URL (https://...)");
      return;
    }
    setUrlError("");

    const existing = partner.tools ? partner.tools.split(",").map((t) => t.trim()).filter(Boolean) : [];
    existing.push(newToolName.trim());
    const updatedTools = existing.join(", ");

    const { error } = await supabase.from("partners").update({ tools: updatedTools }).eq("id", partner.id);

    if (error) {
      toast({ title: "Error", description: "Could not update tools.", variant: "destructive" });
    } else {
      await supabase.from("partner_tool_details").insert({
        tool_name: newToolName.trim(),
        tool_url: newToolUrl.trim(),
        partner_id: partner.id,
      });

      const addedToolName = newToolName.trim();
      setNewToolName("");
      setNewToolUrl("");
      setEditingId(null);
      fetchPartners();
      fetchToolDetails();
      openToolModal(addedToolName, partner);
    }
  };

  const handleRemoveTool = async (partner: PartnerSource, toolToRemove: string) => {
    const existing = partner.tools ? partner.tools.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const updated = existing.filter((t) => t !== toolToRemove).join(", ");

    const { error } = await supabase.from("partners").update({ tools: updated }).eq("id", partner.id);

    if (error) {
      toast({ title: "Error", description: "Could not update tools.", variant: "destructive" });
    } else {
      const detail = getToolDetail(partner, toolToRemove);
      if (detail) {
        await supabase.from("partner_tool_details").delete().eq("id", detail.id);
      }
      fetchPartners();
      fetchToolDetails();
    }
  };

  if (partners.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Wrench className="h-5 w-5" />
        Partner Tools
      </h2>
      <div className="space-y-3">
        {partners.map((partner) => {
          const tools = partner.tools ? partner.tools.split(",").map((t) => t.trim()).filter(Boolean) : [];
          return (
            <Card key={partner.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{partner.name}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(editingId === partner.id ? null : partner.id); setUrlError(""); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {tools.length === 0 && <span className="text-xs text-muted-foreground">No tools yet</span>}
                  {tools.map((tool, i) => {
                    const detail = getToolDetail(partner, tool);
                    return (
                      <Badge key={i} variant="outline" className="gap-1 text-xs group cursor-pointer" onClick={() => openToolModal(tool, partner, detail?.id)}>
                        {detail && (
                          <Shield className={`h-3 w-3 ${detail.risk_classification === "High" || detail.risk_classification === "Unacceptable" ? "text-destructive" : "text-green-600"}`} />
                        )}
                        {tool}
                        {detail?.tool_url && (
                          <a href={detail.tool_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="ml-0.5 hover:text-primary">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {detail && (
                          <span className="ml-0.5 text-[10px] text-muted-foreground">({detail.risk_classification})</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setDeleteToolTarget({ partner, toolName: tool }); }} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                {editingId === partner.id && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Tool name" value={newToolName} onChange={(e) => setNewToolName(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="https://tool-website.com" value={newToolUrl} onChange={(e) => { setNewToolUrl(e.target.value); setUrlError(""); }} className={`h-8 text-sm ${urlError ? "border-destructive" : ""}`} onKeyDown={(e) => e.key === "Enter" && handleAddTool(partner)} />
                      <Button size="sm" className="h-8" onClick={() => handleAddTool(partner)}>Add</Button>
                    </div>
                    {urlError && <p className="text-xs text-destructive">{urlError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ToolDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toolName={modalTool.name}
        partnerId={modalTool.partnerId}
        existingDetailId={modalTool.detailId}
        onSaved={() => fetchToolDetails()}
        isAdminOrAbove={isAdminOrAbove}
      />

      <ConfirmDeleteDialog
        open={!!deleteToolTarget}
        onClose={() => setDeleteToolTarget(null)}
        onConfirm={async () => {
          if (deleteToolTarget) await handleRemoveTool(deleteToolTarget.partner, deleteToolTarget.toolName);
        }}
        itemName={deleteToolTarget?.toolName || ""}
        itemType="Tool"
      />
    </div>
  );
};

export default ExistingPartnerTools;
