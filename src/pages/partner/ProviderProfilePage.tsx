import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Palette, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PartnerFlowStepper from "@/components/partner/PartnerFlowStepper";
import LogoGenerator from "@/components/collaboration/LogoGenerator";
import ThemeCustomizer from "@/components/collaboration/ThemeCustomizer";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";

interface ProposedPartner {
  id: string;
  key: string;
  name: string;
  description: string;
  logo_svg: string | null;
  theme_config: { primary: string; secondary: string; accent: string } | null;
  status: string;
}

const DEFAULT_THEME = { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" };

const ProviderProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  // 1. Fetch the Partner Profile
  const { data: partner, isLoading } = useQuery({
    queryKey: ["my-proposed-partner"],
    queryFn: async (): Promise<ProposedPartner | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const { data, error } = await supabase
        .from("partners")
        .select("id,key,name,description,logo_svg,theme_config,status")
        .eq("proposed_by", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProposedPartner | null;
    },
  });

  // 2. Fetch the tools ONLY if the partner is approved
  const { data: tools, refetch: refetchTools } = useQuery({
    queryKey: ["provider-tools", partner?.id],
    queryFn: async () => {
      if (!partner) return [];
      const { data, error } = await supabase
        .from("partner_tool_details")
        .select("*")
        .eq("partner_id", partner.id);
      if (error) throw error;
      return data;
    },
    enabled: !!partner && (partner.status === "approved" || partner.status === "active"),
  });

  const logoMutation = useMutation({
    mutationFn: async (svg: string) => {
      if (!partner) throw new Error("No partner profile");
      const before = { logo_svg: partner.logo_svg };
      const { data, error } = await supabase.from("partners").update({ logo_svg: svg }).eq("id", partner.id).select().single();
      if (error) throw error;
      await logAudit("update", "partners", partner.id, before, { logo_svg: svg });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-proposed-partner"] }); toast({ title: "Logo updated" }); },
  });

  const themeMutation = useMutation({
    mutationFn: async (theme: typeof DEFAULT_THEME) => {
      if (!partner) throw new Error("No partner profile");
      const before = { theme_config: partner.theme_config };
      const { data, error } = await supabase.from("partners").update({ theme_config: theme }).eq("id", partner.id).select().single();
      if (error) throw error;
      await logAudit("update", "partners", partner.id, before, { theme_config: theme });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-proposed-partner"] }); },
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading provider profile...</div>;
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-background bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <PartnerFlowStepper currentStep="profile" />
          <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-sm text-muted-foreground">No provider profile found for your account. Please complete the partner onboarding first.</p>
              <Button onClick={() => navigate("/partner/onboarding")}>Go to onboarding</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const theme = partner.theme_config ?? DEFAULT_THEME;
  const isApproved = partner.status === "approved";

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <PartnerFlowStepper currentStep="profile" />

        {/* Provider header */}
        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-background/60 ring-1 ring-border/40 backdrop-blur-sm overflow-hidden">
                  {partner.logo_svg ? (
                    <div className="h-14 w-14" dangerouslySetInnerHTML={{ __html: partner.logo_svg }} />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{partner.name}</h1>
                    <Badge variant="outline" className={`border-border/40 bg-background/40 backdrop-blur-md ${isApproved ? "text-green-600" : "text-amber-600"}`}>
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      {isApproved ? "Approved Partner" : "Pending DepEd Review"}
                    </Badge>
                  </div>
                  <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">{partner.description}</p>
                </div>
              </div>
              <div className="md:w-[220px]">
                <Card className="bg-background/40 backdrop-blur-md border-border/40 rounded-xl">
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <span className="text-xs font-medium text-muted-foreground">Registered tools</span>
                    <span className="text-lg font-semibold text-foreground">{tools?.length || 0}</span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand identity */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Brand Logo</CardTitle></CardHeader>
            <CardContent>
              <LogoGenerator logoSvg={partner.logo_svg ?? ""} onLogoChange={(svg) => logoMutation.mutate(svg)} partnerName={partner.name} description={partner.description} />
            </CardContent>
          </Card>
          <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4 text-primary" /> Color Theme</CardTitle></CardHeader>
            <CardContent>
              <ThemeCustomizer theme={theme} onChange={(t) => themeMutation.mutate(t)} partnerName={partner.name} description={partner.description} />
            </CardContent>
          </Card>
        </div>

        {isApproved && (
          <div className="mt-8">
            <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
              <CardContent className="py-8 flex flex-col items-center text-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Wrench className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium">Manage your AI tools on your public provider profile</p>
                <p className="text-xs text-muted-foreground max-w-md">Your provider profile is now live. Add and manage your AI tools directly from your public Providers page.</p>
                <Button asChild className="mt-2">
                  <Link to={`/partners/${partner.key}`}>Go to public profile</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-border/40 bg-background/40 backdrop-blur-md">
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Home</Link>
          </Button>
        </div>
      </div>

    </div>
  );
};

export default ProviderProfilePage;