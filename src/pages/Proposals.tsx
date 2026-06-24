import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // 1. Swapped MongoDB for Supabase
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { logAudit } from "@/lib/audit";
import {
  MessageSquare, Send, User, Wrench, Trash2, CheckCircle2,
  Shield, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import ToolDetailModal from "@/components/collaboration/ToolDetailModal";
import ConfirmDeleteDialog from "@/components/collaboration/ConfirmDeleteDialog";


interface Proposal {
  id: string;
  name: string;
  description: string;
  tools: string;
  key_provider: string;
  status: string;
  proposed_by: string;
  created_at: string;
  theme_config: { primary: string; secondary: string; accent: string } | null;
  logo_svg: string | null;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface ToolDetail {
  id: string;
  tool_name: string;
  tool_url: string;
  partner_id: string | null;
  proposal_id: string | null;
  risk_classification: string;
  risk_approved: boolean;
}

const defaultTheme = { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" };

const Proposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [commentsByProposal, setCommentsByProposal] = useState<Record<string, Comment[]>>({});
  const [newCommentByProposal, setNewCommentByProposal] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [toolDetails, setToolDetails] = useState<ToolDetail[]>([]);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [toolModalData, setToolModalData] = useState({ name: "", proposalId: "", detailId: "" });
  const [toolsBoxProposal, setToolsBoxProposal] = useState<Proposal | null>(null);

  const { toast } = useToast();
  const { isAdminOrAbove, isSuperAdmin, loading: roleLoading } = useRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchProposals();
    fetchProfiles();
    fetchToolDetails();
  }, []);

  
  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setProposals((data as any) || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, display_name");
    const map: Record<string, string> = {};
    data?.forEach((p) => (map[p.id] = p.display_name));
    setProfiles(map);
  };

  const fetchToolDetails = async () => {
    const { data } = await supabase.from("partner_tool_details").select("*");
    setToolDetails((data as any) || []);
  };

  const fetchComments = async (proposalId: string) => {
    const { data, error } = await supabase
      .from("proposal_comments")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setCommentsByProposal((prev) => ({ ...prev, [proposalId]: data as any }));
    }
  };

  const handleSubmitComment = async (proposalId: string) => {
    const content = newCommentByProposal[proposalId]?.trim();
    if (!user || !content) return;
    
    const { error } = await supabase.from("proposal_comments").insert({
      proposal_id: proposalId,
      user_id: user.id,
      content,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewCommentByProposal((prev) => ({ ...prev, [proposalId]: "" }));
      fetchComments(proposalId);
    }
  };

  const handleApproveProposal = async (proposal: Proposal) => {
    const { error } = await supabase
      .from("partners")
      .update({ status: "approved" } as any)
      .eq("id", proposal.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await logAudit("proposal.approved", "partners", proposal.id, { status: proposal.status }, { status: "approved" });
      toast({ title: "Approved", description: `"${proposal.name}" has been approved.` });
      fetchProposals();
    }
  };

  const handleDeleteProposal = async () => {
    if (!deleteTarget) return;
    try {
      
      await supabase.from("partner_tool_details").delete().eq("partner_id", deleteTarget.id);
      
      const { error } = await supabase.from("partners").delete().eq("id", deleteTarget.id);
      if (error) throw error;

      await logAudit("proposal.deleted", "partners", deleteTarget.id, { name: deleteTarget.name }, null);
      toast({ title: "Deleted", description: `"${deleteTarget.name}" has been removed.` });
      fetchProposals();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const getToolDetail = (proposalId: string, toolName: string) =>
    toolDetails.find((d) => d.partner_id === proposalId && d.tool_name === toolName);

  const openToolModal = (toolName: string, proposalId: string, detailId?: string) => {
    setToolModalData({ name: toolName, proposalId, detailId: detailId || "" });
    setToolModalOpen(true);
  };

  const toggleComments = (proposalId: string) => {
    const isExpanding = !expandedComments[proposalId];
    setExpandedComments((prev) => ({ ...prev, [proposalId]: isExpanding }));
    if (isExpanding && !commentsByProposal[proposalId]) {
      fetchComments(proposalId);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-600 border-green-500/30";
      case "rejected": return "bg-destructive/10 text-destructive border-destructive/30";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const renderProposalCard = (proposal: Proposal) => {
    const theme = proposal.theme_config || defaultTheme;
    const tools = proposal.tools ? proposal.tools.split(",").map((t) => t.trim()).filter(Boolean) : [];
    
    const comments = commentsByProposal[proposal.id] || [];
    const isExpanded = expandedComments[proposal.id];
    const commentText = newCommentByProposal[proposal.id] || "";

    return (
      <Card key={proposal.id} className="overflow-hidden">
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }} />
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start gap-4">
            {proposal.logo_svg ? (
              <div
                className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary/50 p-1"
                dangerouslySetInnerHTML={{ __html: proposal.logo_svg }}
              />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
                <Wrench className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold truncate">{proposal.name}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdminOrAbove && proposal.status !== "approved" && (
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleApproveProposal(proposal)}>
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </Button>
                  )}
                  {user && proposal.proposed_by === user.id && (
                    <button onClick={() => setDeleteTarget(proposal)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Badge variant="outline" className={statusColor(proposal.status)}>{proposal.status}</Badge>
                <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {tools.length > 0 && (
            <button
              type="button"
              onClick={() => setToolsBoxProposal(proposal)}
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Tools</span>
              <Badge variant="outline" className="text-xs">{tools.length}</Badge>
            </button>
          )}

          <div className="border-t border-border pt-3 space-y-2">
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => toggleComments(proposal.id)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Comments {comments.length > 0 && `(${comments.length})`}
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {isExpanded && (
              <div className="space-y-2 pl-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2 rounded-lg bg-secondary/40 p-2.5">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{profiles[comment.user_id] || "User"}</span>
                        <span className="text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>}
              </div>
            )}

            {user ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Add comment..."
                  value={commentText}
                  onChange={(e) => setNewCommentByProposal((prev) => ({ ...prev, [proposal.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitComment(proposal.id)}
                  className="h-8 text-sm"
                />
                <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleSubmitComment(proposal.id)}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                <a href="/auth" className="text-primary hover:underline">Sign in</a> to comment
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Proposed AI Partners & Tools</h1>
            <p className="text-muted-foreground">Browse proposals and share your feedback</p>
          </div>
        </div>
        {!roleLoading && isAdminOrAbove && (
          <Badge variant="outline" className="mt-2 text-xs">{isSuperAdmin ? "Super Admin" : "Admin"}</Badge>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          {proposals.map((proposal) => renderProposalCard(proposal))}
          {proposals.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No proposals yet. Be the first!</p>
          )}
        </div>
      </div>

      <ToolDetailModal
        open={toolModalOpen}
        onClose={() => setToolModalOpen(false)}
        toolName={toolModalData.name}
        proposalId={toolModalData.proposalId}
        existingDetailId={toolModalData.detailId}
        onSaved={() => fetchToolDetails()}
        isAdminOrAbove={isAdminOrAbove}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProposal}
        itemName={deleteTarget?.name || ""}
        itemType="Proposal"
      />

      <Dialog open={!!toolsBoxProposal} onOpenChange={(o) => !o && setToolsBoxProposal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tools — {toolsBoxProposal?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {toolsBoxProposal && (toolsBoxProposal.tools ? toolsBoxProposal.tools.split(",").map((t) => t.trim()).filter(Boolean) : []).map((tool, i) => {
              const detail = getToolDetail(toolsBoxProposal.id, tool);
              const isHigh = detail?.risk_classification === "High" || detail?.risk_classification === "Unacceptable";
              return (
                <button
                  key={i}
                  onClick={() => {
                    openToolModal(tool, toolsBoxProposal.id, detail?.id);
                    setToolsBoxProposal(null);
                  }}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-left hover:bg-secondary/50 transition-colors"
                >
                  <Wrench className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{tool}</div>
                    {detail && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Shield className={`h-3 w-3 ${isHigh ? "text-destructive" : "text-green-600"}`} />
                        {detail.risk_classification}
                      </div>
                    )}
                  </div>
                  {detail?.tool_url && (
                    <a href={detail.tool_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </button>
              );
            })}
            {toolsBoxProposal && !toolsBoxProposal.tools && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">No tools yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proposals;