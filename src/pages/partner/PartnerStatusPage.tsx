import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Loader2 } from "lucide-react";

interface ToolRow {
  id: string;
  tool_name: string;
  risk_classification: string;
  created_at: string;
  partner_id: string | null;
  partner_status: string;
  partner_name: string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "approved":
    case "active":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "rejected":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "pending":
    default:
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  }
};

const statusLabel = (status: string) =>
  status === "pending" ? "Pending" : status.charAt(0).toUpperCase() + status.slice(1);

const PartnerStatusPage = () => {
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<ToolRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data: partners } = await supabase
        .from("partners")
        .select("id, name, status")
        .eq("proposed_by", session.user.id);

      if (!partners?.length) {
        setLoading(false);
        return;
      }

      const partnerIds = partners.map((p) => p.id);
      const { data: toolRows } = await supabase
        .from("partner_tool_details")
        .select("id, tool_name, risk_classification, created_at, partner_id")
        .in("partner_id", partnerIds)
        .order("created_at", { ascending: false });

      const partnerMap = new Map(partners.map((p) => [p.id, p]));
      const merged: ToolRow[] = (toolRows ?? []).map((t) => {
        const p = t.partner_id ? partnerMap.get(t.partner_id) : undefined;
        return {
          id: t.id,
          tool_name: t.tool_name,
          risk_classification: t.risk_classification,
          created_at: t.created_at,
          partner_id: t.partner_id,
          partner_status: p?.status ?? "pending",
          partner_name: p?.name ?? "—",
        };
      });

      setTools(merged);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </span>
              Status of Submitted Tools
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              Track the review status of AI tools you have submitted for governance approval.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : tools.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                You have not submitted any tools yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm p-4"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{t.tool_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t.partner_name} · Risk: {t.risk_classification} · Submitted{" "}
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className={statusVariant(t.partner_status)}>
                      {statusLabel(t.partner_status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerStatusPage;
