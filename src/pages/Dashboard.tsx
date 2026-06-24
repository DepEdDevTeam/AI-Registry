import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { LayoutDashboard, Users, FileText, Wrench, ShieldCheck, CheckCircle2, Clock, XCircle, Building2 } from "lucide-react";
import UserManagement from "@/components/collaboration/UserManagement";
import AuditLog from "@/components/collaboration/AuditLog";
import PartnerManagement from "@/components/collaboration/PartnerManagement";

interface Stats {
  totalPartners: number;
  totalProposals: number;
  pendingProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  totalTools: number;
  pendingRiskReviews: number;
  totalUsers: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalPartners: 0, totalProposals: 0, pendingProposals: 0,
    approvedProposals: 0, rejectedProposals: 0, totalTools: 0,
    pendingRiskReviews: 0, totalUsers: 0,
  });
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, loading: roleLoading } = useRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      navigate("/");
      toast({ title: "Access denied", description: "Super Admin privileges required.", variant: "destructive" });
    }
  }, [roleLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
      fetchProfiles();
    }
  }, [isSuperAdmin]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, display_name");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((p) => (map[p.id] = p.display_name));
      setProfiles(map);
    }
  };

  const fetchStats = async () => {
    const [partners, tools, users] = await Promise.all([
      supabase.from("partners").select("id, status"),
      supabase.from("partner_tool_details").select("id, risk_approved"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const partnerData = partners.data || [];
    const toolData = tools.data || [];

    setStats({
      totalPartners: partnerData.length,
      totalProposals: partnerData.length,
      pendingProposals: partnerData.filter((p) => p.status === "pending").length,
      approvedProposals: partnerData.filter((p) => p.status === "approved" || p.status === "active").length,
      rejectedProposals: partnerData.filter((p) => p.status === "rejected").length,
      totalTools: toolData.length,
      pendingRiskReviews: toolData.filter((t) => !t.risk_approved).length,
      totalUsers: users.count || 0,
    });
  };

  if (roleLoading) return <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading...</div>;
  if (!isSuperAdmin) return null;

  const statCards = [
    { label: "Total Partners", value: stats.totalPartners, icon: ShieldCheck, color: "text-primary" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Proposals", value: stats.totalProposals, icon: FileText, color: "text-primary" },
    { label: "Pending Proposals", value: stats.pendingProposals, icon: Clock, color: "text-yellow-600" },
    { label: "Approved Proposals", value: stats.approvedProposals, icon: CheckCircle2, color: "text-green-600" },
    { label: "Rejected Proposals", value: stats.rejectedProposals, icon: XCircle, color: "text-destructive" },
    { label: "Total Tools", value: stats.totalTools, icon: Wrench, color: "text-primary" },
    { label: "Pending Risk Reviews", value: stats.pendingRiskReviews, icon: Clock, color: "text-yellow-600" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs">{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-1">
            <Users className="h-3.5 w-3.5" /> User Management
          </TabsTrigger>
          <TabsTrigger value="partners" className="gap-1">
            <Building2 className="h-3.5 w-3.5" /> Partner Management
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="partners">
          <PartnerManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLog profiles={profiles} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
