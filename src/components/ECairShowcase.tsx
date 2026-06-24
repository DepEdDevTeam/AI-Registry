import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import ecairLogo from "@/assets/ecair-logo.png";
import { LogoCloudCarousel } from "@/components/ui/logo-cloud-carousel";

const ECAIR_KEY = "ecair";

const ECairShowcase = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsSignedIn(!!data.session?.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setIsSignedIn(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: ecair, isLoading } = useQuery({
    queryKey: ["ecair-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("key", ECAIR_KEY)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id,
        key: data.key,
        name: data.name,
        description: data.description,
        logo_svg: data.logo_svg || null,
        theme_config: (data.theme_config as any) || { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" },
      };
    },
  });

  const { data: tools } = useQuery({
    queryKey: ["ecair-tools", ecair?.id],
    queryFn: async () => {
      if (!ecair) return [];
      const { data, error } = await supabase
        .from("partner_tool_details")
        .select("*")
        .eq("partner_id", ecair.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!ecair,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ecair) return null;
  const theme = ecair.theme_config;
  const visibleTools = isSignedIn ? (tools || []) : (tools || []).filter((t: any) => t.risk_approved);


  return (
    <section className="relative bg-transparent py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-2xl p-8 sm:p-12"
          style={{ background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}10, ${theme.secondary || theme.primary}08)` }}
        >
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: `radial-gradient(circle at 20% 50%, ${theme.primary}, transparent 50%), radial-gradient(circle at 80% 50%, ${theme.accent}, transparent 50%)` }}
          />
          <div className="relative flex flex-col items-center text-center gap-3">
            <img src={ecairLogo} alt="E-CAIR Logo" className="h-16 w-auto sm:h-24 md:h-32 object-contain" fetchPriority="high" />
            <div className="max-w-3xl -mt-2">
              <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">{ecair.description}</p>
              <Link to={`/partners/${ecair.key}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: theme.primary }}>
                View Full Profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {visibleTools && visibleTools.length > 0 && (
              <div className="w-full mt-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Explore the Library</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xl mx-auto">
                  A collection of AI-powered tools — each crafted to support Philippine basic education.
                </p>
                <LogoCloudCarousel
                  logos={visibleTools.map((tool: any) => ({
                    _id: tool.id,
                    tool_name: tool.tool_name,
                    description: tool.description || "AI-powered tool for Philippine basic education.",
                    link: `/partners/${ecair.key}#${tool.id}`,
                    theme,
                    badge: isSignedIn ? (tool.risk_approved ? "Approved" : "Pending Review") : undefined,
                  }))}
                  theme={theme}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ECairShowcase;
