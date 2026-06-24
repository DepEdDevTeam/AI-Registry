import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPartnerKeyFromProvider } from "@/data/aiRegistry";
import ToolDetailModal from "@/components/collaboration/ToolDetailModal";
import { generateToolLogoSvg } from "@/lib/toolLogo";
import { Loader2 } from "lucide-react";
import { useRole } from "@/hooks/use-role";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

const DEFAULT_THEME: ThemeConfig = { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" };

interface ToolRow {
  id: string;
  name: string;
  subtitle: string;
  logoSvg: string;
  href: string;
  external: boolean;
}

const extractTheme = (value: unknown): ThemeConfig | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const t = value as Partial<ThemeConfig>;
  if (!t.primary || !t.accent) return undefined;
  return { primary: t.primary, secondary: t.secondary ?? t.primary, accent: t.accent };
};

const AITechnology = () => {
  const { isAdminOrAbove } = useRole();
  const [user, setUser] = useState<any>(null);
  const [editTool, setEditTool] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["all-ai-tools"],
    queryFn: async () => {
      const [toolsRes, partnersRes] = await Promise.all([
        supabase.from("partner_tool_details").select("*").eq("risk_approved", true),
        supabase.from("partners").select("*").in("status", ["approved", "active"]),
      ]);
      return { toolDetails: toolsRes.data || [], partners: partnersRes.data || [] };
    },
  });

  const tools: ToolRow[] = (data?.toolDetails ?? []).map((t: any) => {
    const partner = (data?.partners ?? []).find((p: any) => p.id === t.partner_id);
    const theme = extractTheme(partner?.theme_config) ?? DEFAULT_THEME;
    const partnerKey = partner?.key || getPartnerKeyFromProvider(partner?.name || "");
    const logoSvg = t.tool_logo_svg || generateToolLogoSvg(t.tool_name || "AI", theme);
    const subtitle =
      t.tool_objective?.split(/[.\n]/)[0]?.trim() ||
      t.description?.split(/[.\n]/)[0]?.trim() ||
      partner?.name ||
      "AI tool";
    const href = t.tool_url || (partnerKey ? `/partners/${partnerKey}#${t.id}` : `/ai-technology/${t.id}`);
    return {
      id: t.id,
      name: t.tool_name,
      subtitle,
      logoSvg,
      href,
      external: !!t.tool_url,
    };
  });

  const canEdit = !!user && isAdminOrAbove;

  const handleEditClick = (tool: ToolRow, e: React.MouseEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setEditTool({ id: tool.id, name: tool.name });
  };

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["all-ai-tools"] });

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <section className="container mx-auto max-w-[1600px] px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-foreground">AI Tools Catalogue</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          All AI tools registered with the Department of Education. Each tool is assessed for risk, privacy impact, and compliance.
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool, i) => {
          const CardInner = (
            <div className="group flex items-center gap-4 py-5">
              <div
                className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border/40 shadow-sm transition-transform group-hover:scale-[1.03]"
                dangerouslySetInnerHTML={{ __html: tool.logoSvg }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-base font-bold text-foreground">
                  {tool.name}
                </h3>
                <p className="truncate text-sm text-muted-foreground">{tool.subtitle}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-full bg-muted px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    Visit
                  </span>
                  {canEdit && (
                    <button
                      onClick={(e) => handleEditClick(tool, e)}
                      className="rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );

          const wrapperClass = "animate-card-in border-b border-border/40";

          return (
            <div
              key={tool.id}
              className={wrapperClass}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {tool.external ? (
                <a href={tool.href} target="_blank" rel="noopener noreferrer" className="block">
                  {CardInner}
                </a>
              ) : (
                <Link to={tool.href} className="block">
                  {CardInner}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {tools.length === 0 && (
        <p className="py-20 text-center text-muted-foreground">No AI tools registered yet.</p>
      )}

      {editTool && (
        <ToolDetailModal
          open={!!editTool}
          onClose={() => setEditTool(null)}
          toolName={editTool.name}
          existingDetailId={editTool.id}
          isAdminOrAbove={isAdminOrAbove}
          onSaved={handleRefresh}
          onDeleted={handleRefresh}
        />
      )}
    </section>
  );
};

export default AITechnology;
