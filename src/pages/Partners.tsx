import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client"; // 1. Swapped MongoDB for Supabase
import { RiskBadge, StatusBadge } from "@/components/Badges";
import { getToolsByProvider } from "@/data/aiRegistry";
import { AlertTriangle, Eye, ExternalLink, FileCheck, Loader2, Pencil, Plus, Shield, User } from "lucide-react";
import PartnerLogo from "@/components/PartnerLogo";
import AddAIToolModal from "@/components/partner/AddAIToolModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import BrandGenerator from "@/components/collaboration/BrandGenerator";
import ConfirmDeleteDialog from "@/components/collaboration/ConfirmDeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { generateToolLogoSvg } from "@/lib/toolLogo";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

interface PartnerInfo {
  id: string;
  key: string;
  name: string;
  description: string;
  tools: string | null;
  tool_count: number;
  theme_config: ThemeConfig;
  logo_svg: string | null;
  source: "partner" | "proposal";
  proposed_by?: string | null;
  status?: string | null;
}

const StatPill = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div
    className={[
      "flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3",
      "ring-1 ring-black/5 backdrop-blur-sm",
      className,
    ].join(" ")}
  >
    <div className="text-xs font-medium text-slate-500">{label}</div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

const EmptyState = ({ partner }: { partner: string }) => (
  <div className="mt-6 rounded-2xl bg-white/70 p-8 text-center ring-1 ring-black/5 backdrop-blur-sm">
    <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-slate-900/5">
      <span className="text-lg">🧩</span>
    </div>
    <h3 className="text-sm font-semibold text-slate-900">No tools found</h3>
    <p className="mt-1 text-sm text-slate-600">
      No AI technologies from <span className="font-medium">{partner}</span> are currently registered.
    </p>
  </div>
);

const PartnersPage = () => {
  const { partnerKey } = useParams<{ partnerKey: string }>();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; description: string; logo_svg: string; theme: ThemeConfig } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toolEditOpen, setToolEditOpen] = useState(false);
  const [toolEditDraft, setToolEditDraft] = useState<{ id: string; tool_name: string; tool_url: string; tool_logo_svg: string } | null>(null);
  const [toolSaving, setToolSaving] = useState(false);
  const [toolDeleteTarget, setToolDeleteTarget] = useState<{ id: string; tool_name: string } | null>(null);
  const toolLogoInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: currentUserId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.user.id ?? null;
    },
  });

  const isProposalKey = partnerKey?.startsWith("proposal-");
  const proposalId = isProposalKey ? partnerKey!.replace("proposal-", "") : null;

  const { data: partnerInfo, isLoading } = useQuery({
    queryKey: ["partner-profile", partnerKey],
    queryFn: async (): Promise<PartnerInfo> => {
      // Unified `partners` table — `proposal-<id>` keys look up by id for backward compat.
      const query = supabase.from("partners").select("*");
      const { data, error } = proposalId
        ? await query.eq("id", proposalId).single()
        : await query.eq("key", partnerKey!).single();

      if (error || !data) throw new Error("Partner not found");

      const row: any = data;
      return {
        id: row.id,
        key: row.key,
        name: row.name,
        description: row.description,
        tools: row.tools,
        tool_count: row.tool_count || 0,
        theme_config: (row.theme_config as ThemeConfig) || { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" },
        logo_svg: row.logo_svg ?? null,
        source: row.status === "pending" ? "proposal" : "partner",
        proposed_by: row.proposed_by ?? null,
        status: row.status,
      };
    },
    enabled: !!partnerKey,
  });

  const { data: dbToolDetails, refetch: refetchTools } = useQuery({
    queryKey: ["partner-tool-details", partnerInfo?.id],
    queryFn: async () => {
      if (!partnerInfo) return [];
      const { data, error } = await supabase
        .from("partner_tool_details")
        .select("*")
        .eq("partner_id", partnerInfo.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerInfo,
  });

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location.hash]);

  if (isLoading || !partnerInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const theme = partnerInfo.theme_config;
  const registryTools = partnerInfo.source === "partner"
    ? getToolsByProvider(partnerInfo.key === "google" ? "google" : partnerInfo.name)
    : [];
  const isOwnerPartner =
    !!currentUserId &&
    partnerInfo.proposed_by === currentUserId &&
    (partnerInfo.source === "partner" || partnerInfo.status === "approved");
  const canEdit = isOwnerPartner;
  const canAddTools = isOwnerPartner;
  const canDeleteTools = isOwnerPartner;
  // Legacy alias for the AddAIToolModal owner check
  const isOwner = canAddTools;
  const isSignedIn = !!currentUserId;
  // Hide pending (un-approved) tools from public visitors; signed-in users see all with a badge.
  const visibleToolDetails = isSignedIn
    ? dbToolDetails
    : (dbToolDetails || []).filter((t: any) => t.risk_approved);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}10, ${theme.accent}15)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${theme.primary}2E, transparent 35%), radial-gradient(circle at 80% 30%, ${theme.secondary}24, transparent 40%), radial-gradient(circle at 70% 80%, ${theme.accent}24, transparent 40%)`,
        }}
      />
      <div className="relative z-10 container mx-auto px-4 py-12 animate-page-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 ring-1 ring-black/5 backdrop-blur-sm">
              <PartnerLogo partnerKey={partnerInfo.key} className="h-9 w-9" logoSvg={partnerInfo.logo_svg} name={partnerInfo.name} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                {partnerInfo.name} — DepEd AI Solutions
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-700 dark:text-slate-300">
                {partnerInfo.description}
              </p>

            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:w-[200px]">
            <StatPill label="Registered tools" value={registryTools.length || (visibleToolDetails?.length ?? 0)} />
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="bg-white/70 backdrop-blur-sm"
                onClick={() => {
                  setEditForm({
                    name: partnerInfo.name,
                    description: partnerInfo.description,
                    logo_svg: partnerInfo.logo_svg ?? "",
                    theme: partnerInfo.theme_config,
                  });
                  setEditOpen(true);
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Tools grid */}
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-300">
              Tools & Technologies
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing provider: <span className="font-medium text-slate-700 dark:text-slate-300">{partnerInfo.name}</span>
              </div>
              {isOwner && (
                <Button
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  style={{ backgroundColor: theme.primary, color: "#fff" }}
                  className="shadow-sm hover:opacity-90"
                >
                  <Plus className="mr-1 h-4 w-4" /> Add AI Tool
                </Button>
              )}
            </div>
          </div>

          {registryTools.length > 0 ? (
            <div className="space-y-6">
              {registryTools.map((tool, index) => (
                <div
                  key={tool.id ?? tool.name}
                  id={tool.id}
                  className="scroll-mt-24 rounded-2xl bg-white/70 p-6 ring-1 ring-black/5 backdrop-blur-sm animate-card-in transition-all duration-300"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-xl font-bold text-slate-900">{tool.name}</h3>
                      <RiskBadge level={tool.riskLevel} />
                      <StatusBadge status={tool.status} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-600">{tool.provider}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{tool.description}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-white/50 p-4 ring-1 ring-black/5">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <h4 className="text-sm font-semibold text-slate-900">Risk Classification</h4>
                      </div>
                      <p className="text-sm font-medium text-slate-800">{tool.riskClassification}</p>
                    </div>
                    <div className="rounded-lg bg-white/50 p-4 ring-1 ring-black/5">
                      <div className="mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-semibold text-slate-900">Intended Use</h4>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{tool.intendedUse}</p>
                    </div>
                    <div className="rounded-lg bg-white/50 p-4 ring-1 ring-black/5">
                      <div className="mb-2 flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        <h4 className="text-sm font-semibold text-slate-900">Privacy & Compliance</h4>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">PIA</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{tool.piaStatus}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Compliance</p>
                          <p className="mt-1 text-sm text-slate-700">{tool.complianceAssessment}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/50 p-4 ring-1 ring-black/5">
                      <div className="mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <h4 className="text-sm font-semibold text-slate-900">Governance & Oversight</h4>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Responsible Officer</p>
                          <p className="mt-1 text-sm text-slate-700 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-500" /> {tool.responsibleOfficer}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Oversight Mechanism</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-700">{tool.oversightMechanism}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">Date of Entry: {tool.dateOfEntry}</span>
                    {tool.externalUrl && (
                      <a
                        href={tool.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                        style={{ backgroundColor: theme.primary }}
                      >
                        Open {tool.name.split("(")[0].replace("Canva ", "").trim()}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : visibleToolDetails && visibleToolDetails.length > 0 ? (
            <div className="space-y-6">
              {/* 4. Mapped detail._id to detail.id */}
              {visibleToolDetails.map((detail: any, index: number) => (
                <div
                  key={detail.id}
                  className="scroll-mt-24 rounded-2xl bg-white/70 p-6 ring-1 ring-black/5 backdrop-blur-sm animate-card-in transition-all duration-300"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="mb-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 bg-white"
                        dangerouslySetInnerHTML={{
                          __html:
                            detail.tool_logo_svg ||
                            generateToolLogoSvg(detail.tool_name, theme),
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-xl font-bold text-slate-900">{detail.tool_name}</h3>
                          {isSignedIn && (
                            detail.risk_approved ? (
                              <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                Pending Review
                              </span>
                            )
                          )}
                          {isOwner && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="ml-auto h-7 border-slate-300 bg-white/70 text-xs"
                              onClick={() => {
                                setToolEditDraft({
                                  id: detail.id,
                                  tool_name: detail.tool_name,
                                  tool_url: detail.tool_url || "",
                                  tool_logo_svg: detail.tool_logo_svg || "",
                                });
                                setToolEditOpen(true);
                              }}
                              >
                                <Pencil className="mr-1 h-3 w-3" /> Edit
                              </Button>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-600">{partnerInfo.name}</p>
                        {detail.description && (
                          <p className="mt-3 text-sm leading-relaxed text-slate-700">{detail.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {detail.intended_use && (
                      <div className="rounded-lg bg-white/50 p-4 ring-1 ring-black/5">
                        <div className="mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <h4 className="text-sm font-semibold text-slate-900">Intended Use</h4>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700">{detail.intended_use}</p>
                      </div>
                    )}
                    {detail.privacy_impact_assessment && (
                      <div className="rounded-lg bg-white/50 p-4 ring-1 ring-black/5">
                        <div className="mb-2 flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-green-600" />
                          <h4 className="text-sm font-semibold text-slate-900">Privacy & Compliance</h4>
                        </div>
                        <p className="text-sm text-slate-700">{detail.privacy_impact_assessment}</p>
                        {detail.compliance_assessment && (
                          <p className="mt-2 text-sm text-slate-700">{detail.compliance_assessment}</p>
                        )}
                      </div>
                    )}
                    {(detail.responsible_officer || detail.oversight_mechanism) && (
                      <div className="rounded-lg bg-white/50 p-4 ring-1 ring-black/5">
                        <div className="mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <h4 className="text-sm font-semibold text-slate-900">Governance</h4>
                        </div>
                        {detail.responsible_officer && (
                          <p className="text-sm text-slate-700 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-500" /> {detail.responsible_officer}
                          </p>
                        )}
                        {detail.oversight_mechanism && (
                          <p className="mt-2 text-sm text-slate-700">{detail.oversight_mechanism}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {detail.tool_url && (
                    <div className="mt-4 flex justify-end">
                      <a
                        href={detail.tool_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
                        style={{ backgroundColor: theme.primary }}
                      >
                        Open {detail.tool_name}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState partner={partnerInfo.name} />
          )}
        </div>
      </div>
      {canAddTools && (
        <AddAIToolModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          proposalId={partnerInfo.id}
          parentType={partnerInfo.source === "partner" ? "partner" : "proposal"}
          partnerTheme={theme}
          onSaved={() => refetchTools()}
        />
      )}

      {/* Per-tool edit dialog (owner & super admin) — limited to URL + logo for both pending and approved */}
      {isOwner && toolEditDraft && (
        <Dialog
          open={toolEditOpen}
          onOpenChange={(o) => {
            setToolEditOpen(o);
            if (!o) setToolEditDraft(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit tool — {toolEditDraft.tool_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tool-url">Tool URL</Label>
                <Input
                  id="tool-url"
                  type="url"
                  placeholder="https://..."
                  value={toolEditDraft.tool_url}
                  onChange={(e) => setToolEditDraft({ ...toolEditDraft, tool_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Tool logo</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => toolLogoInputRef.current?.click()}
                      className="h-8"
                    >
                      Upload
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() =>
                        setToolEditDraft({
                          ...toolEditDraft,
                          tool_logo_svg: generateToolLogoSvg(toolEditDraft.tool_name, theme),
                        })
                      }
                    >
                      Auto-generate
                    </Button>
                  </div>
                  <input
                    ref={toolLogoInputRef}
                    type="file"
                    accept="image/*,.svg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !toolEditDraft) return;
                      if (file.type === "image/svg+xml") {
                        const reader = new FileReader();
                        reader.onload = (ev) =>
                          setToolEditDraft({ ...toolEditDraft, tool_logo_svg: ev.target?.result as string });
                        reader.readAsText(file);
                        return;
                      }
                      if (file.type.startsWith("image/")) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          setToolEditDraft({
                            ...toolEditDraft,
                            tool_logo_svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><clipPath id="clip"><rect width="64" height="64" rx="12"/></clipPath></defs><image href="${dataUrl}" width="64" height="64" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice"/></svg>`,
                          });
                        };
                        reader.readAsDataURL(file);
                        return;
                      }
                      toast({ title: "Unsupported file type", variant: "destructive" });
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
                  <div
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/40 bg-white"
                    dangerouslySetInnerHTML={{
                      __html:
                        toolEditDraft.tool_logo_svg ||
                        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#e2e8f0"/></svg>`,
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload an SVG/PNG or auto-generate a themed logo.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setToolEditOpen(false)} disabled={toolSaving}>
                Cancel
              </Button>
              {canDeleteTools && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (!toolEditDraft) return;
                    setToolDeleteTarget({ id: toolEditDraft.id, tool_name: toolEditDraft.tool_name });
                  }}
                  disabled={toolSaving}
                >
                  Delete Tool
                </Button>
              )}
              <Button
                disabled={toolSaving}
                onClick={async () => {
                  if (!toolEditDraft) return;
                  setToolSaving(true);
                  try {
                    const before = (dbToolDetails || []).find((t: any) => t.id === toolEditDraft.id);
                    const update = {
                      tool_url: toolEditDraft.tool_url,
                      tool_logo_svg: toolEditDraft.tool_logo_svg,
                    };
                    const { error } = await supabase
                      .from("partner_tool_details")
                      .update(update)
                      .eq("id", toolEditDraft.id);
                    if (error) throw error;
                    await logAudit("update", "partner_tool_details", toolEditDraft.id, before, update);
                    toast({ title: "Tool updated" });
                    setToolEditOpen(false);
                    setToolEditDraft(null);
                    refetchTools();
                  } catch (err: any) {
                    toast({ title: "Failed to update", description: err.message, variant: "destructive" });
                  } finally {
                    setToolSaving(false);
                  }
                }}
              >
                {toolSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDeleteDialog
        open={!!toolDeleteTarget}
        onClose={() => setToolDeleteTarget(null)}
        itemName={toolDeleteTarget?.tool_name || ""}
        itemType="Tool"
        onConfirm={async () => {
          if (!toolDeleteTarget) return;
          setToolSaving(true);
          try {
            const before = (dbToolDetails || []).find((t: any) => t.id === toolDeleteTarget.id);
            const { error: deleteError } = await supabase
              .from("partner_tool_details")
              .delete()
              .eq("id", toolDeleteTarget.id);
            if (deleteError) throw deleteError;

            const currentTools = partnerInfo.tools ? partnerInfo.tools.split(",").map((t) => t.trim()).filter(Boolean) : [];
            const updatedTools = currentTools.filter((name) => name !== toolDeleteTarget.tool_name).join(", ");
            const { error: toolsError } = await supabase
              .from("partners")
              .update({ tools: updatedTools })
              .eq("id", partnerInfo.id);
            if (toolsError) throw toolsError;

            await logAudit("delete", "partner_tool_details", toolDeleteTarget.id, before, null);
            toast({ title: "Tool deleted", description: `"${toolDeleteTarget.tool_name}" was removed.` });
            setToolDeleteTarget(null);
            setToolEditOpen(false);
            setToolEditDraft(null);
            qc.invalidateQueries({ queryKey: ["partner-profile", partnerKey] });
            refetchTools();
          } catch (err: any) {
            toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
          } finally {
            setToolSaving(false);
          }
        }}
      />

      {canEdit && editForm && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Partner Profile — {partnerInfo.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <BrandGenerator
                logoSvg={editForm.logo_svg}
                onLogoChange={(svg) => setEditForm({ ...editForm, logo_svg: svg })}
                theme={editForm.theme}
                onThemeChange={(t) => setEditForm({ ...editForm, theme: t })}
                partnerName={editForm.name}
                description={editForm.description}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    const before = {
                      name: partnerInfo.name,
                      description: partnerInfo.description,
                      logo_svg: partnerInfo.logo_svg,
                      theme_config: partnerInfo.theme_config,
                    };
                    const update: Record<string, any> = {
                      name: editForm.name,
                      description: editForm.description,
                      theme_config: editForm.theme,
                      logo_svg: editForm.logo_svg,
                    };
                    const { error } = await supabase.from("partners").update(update).eq("id", partnerInfo.id);
                    if (error) throw error;
                    await logAudit("update", "partners", partnerInfo.id, before, update);
                    toast({ title: "Profile updated" });
                    setEditOpen(false);
                    qc.invalidateQueries({ queryKey: ["partner-profile", partnerKey] });
                  } catch (err: any) {
                    toast({ title: "Failed to update", description: err.message, variant: "destructive" });
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PartnersPage;
