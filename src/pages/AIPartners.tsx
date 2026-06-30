import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PartnerUiverseCard from "@/components/PartnerUiverseCard";
import { useRole } from "@/hooks/use-role";
import ConfirmDeleteDialog from "@/components/collaboration/ConfirmDeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

interface PartnerData {
  id: string;
  key: string;
  name: string;
  description: string;
  tool_count: number;
  theme_config: ThemeConfig | null;
  logo_svg: string | null;
}

const AIPartners = () => {
  const { isSuperAdmin } = useRole();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<PartnerData | null>(null);

  const {
    data: partners,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["all-partners"],
    queryFn: async (): Promise<PartnerData[]> => {
      const { data } = await supabase
        .from("partners")
        .select("id,key,name,description,tool_count,theme_config,logo_svg")
        .in("status", ["approved", "active"]);
      return (data || []).map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        description: p.description,
        tool_count: p.tool_count || 0,
        theme_config: p.theme_config as unknown as ThemeConfig,
        logo_svg: p.logo_svg || null,
      }));
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("public-providers-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "partners" }, () => {
        qc.invalidateQueries({ queryKey: ["all-partners"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const before = { name: pendingDelete.name };

    const { data: deleted, error: delErr } = await supabase.rpc("delete_partner_as_super_admin", {
      _partner_id: pendingDelete.id,
    });

    if (delErr) {
      toast({ title: "Failed to delete provider", description: delErr.message, variant: "destructive" });
      return;
    }

    if (!deleted) {
      toast({
        title: "Delete not completed",
        description: "The provider record still exists. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    await logAudit("delete", "partners", pendingDelete.id, before, null);
    qc.setQueryData<PartnerData[]>(["all-partners"], (current) =>
      current?.filter((partner) => partner.id !== pendingDelete.id) ?? current,
    );
    qc.invalidateQueries({ queryKey: ["partner-profile"] });
    qc.invalidateQueries({ queryKey: ["all-ai-tools"] });
    toast({ title: "Provider deleted", description: `${pendingDelete.name} was removed.` });
    qc.invalidateQueries({ queryKey: ["all-partners"] });
  };

  if (isLoading)
    return (
      <section className="container mx-auto flex min-h-[50vh] items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading providers...</p>
        </div>
      </section>
    );
  if (error)
    return (
      <section className="container mx-auto px-4 py-12">
        <p className="text-destructive">Failed to load providers.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "An unexpected error occurred while loading the page."}
        </p>
      </section>
    );

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-10 animate-page-in">
        <h1 className="font-display text-3xl font-bold text-foreground">Providers</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Strategic technology providers offering AI-powered tools registered with the Department of Education.
        </p>
      </div>

      {!partners || partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-15 text-center">
          <p className="text-lg font-medium text-muted-foreground">No providers registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-y-9 gap-x-3 justify-items-center">
          {partners.map((partner, i) => (
            <div key={partner.id} className="animate-card-in" style={{ animationDelay: `${i * 100}ms` }}>
              <PartnerUiverseCard
                primary={partner.theme_config?.primary}
                secondary={partner.theme_config?.secondary}
                accent={partner.theme_config?.accent}
                name={partner.name}
                description={partner.description}
                to={`/partners/${partner.key}`}
                partnerKey={partner.key}
                logoSvg={partner.logo_svg}
                onDelete={isSuperAdmin ? () => setPendingDelete(partner) : undefined}
              />
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        itemName={pendingDelete?.name || ""}
        itemType="Provider"
      />
    </section>
  );
};

export default AIPartners;
