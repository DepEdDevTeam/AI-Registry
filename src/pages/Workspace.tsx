import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  Bot,
  Building2,
  ClipboardList,
  ExternalLink,
  FileText,
  LogOut,
  Settings,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";

type ProfileSummary = {
  display_name: string | null;
  office: string | null;
  position: string | null;
  avatar_url: string | null;
};

const roleNames = {
  super_admin: "Super administrator",
  admin: "Administrator",
  partner: "AI provider",
  user: "Registry contributor",
} as const;

const Workspace = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { role, isPartner, isAdminOrAbove, isSuperAdmin, loading: roleLoading } = useRole();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth", { replace: true });
        return;
      }
      if (!active) return;
      setUser(session.user);
      const { data } = await supabase
        .from("profiles")
        .select("display_name, office, position, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();
      if (active) {
        setProfile(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [navigate]);

  const initials = useMemo(() => {
    const source = profile?.display_name || user?.email || "User";
    return source.split(/[\s@]+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  }, [profile?.display_name, user?.email]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const actions = isPartner
    ? [{ to: "/partner/status", icon: ClipboardList, title: "Submission status", description: "Track your provider application and next required steps." }]
    : [
        { to: "/proposals", icon: FileText, title: "Proposals", description: "Review, discuss, and contribute to AI provider proposals." },
        { to: "/profile", icon: Settings, title: "Profile settings", description: "Update your identity, office details, photo, and password." },
      ];

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/workspace" className="flex items-center gap-3 font-semibold text-primary">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></span>
            <span>DepEd AI Workspace</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Public registry <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">{initials}</div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-accent">{role ? roleNames[role] : "Signed-in user"}</p>
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{profile?.display_name || "Your workspace"}</h1>
              <p className="mt-1 truncate text-sm text-muted-foreground">{profile?.position && profile?.office ? `${profile.position} · ${profile.office}` : user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </section>

        <section className="py-8">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Your work</h2>
            <p className="mt-1 text-sm text-muted-foreground">Account tools and responsibilities assigned to your role.</p>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            {actions.map((action, index) => (
              <Link key={action.to} to={action.to} className={`group flex items-center gap-4 p-5 transition-colors hover:bg-secondary/70 ${index ? "border-t" : ""}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><action.icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{action.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{action.description}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
            {isAdminOrAbove && (
              <Link to="/admin" className="group flex items-center gap-4 border-t p-5 transition-colors hover:bg-secondary/70">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><ShieldCheck className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block font-semibold">Admin panel</span><span className="mt-0.5 block text-sm text-muted-foreground">Review registry submissions and manage governance workflows.</span></span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            )}
            {isSuperAdmin && (
              <Link to="/dashboard" className="group flex items-center gap-4 border-t p-5 transition-colors hover:bg-secondary/70">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Building2 className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block font-semibold">System dashboard</span><span className="mt-0.5 block text-sm text-muted-foreground">Manage users, providers, audit records, and registry-wide activity.</span></span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold">Explore the public AI registry</h2><p className="mt-1 max-w-2xl text-sm text-primary-foreground/75">Browse approved tools, providers, and the governance framework without leaving your signed-in account.</p></div>
          <Link to="/ai-technology" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-foreground px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90">Browse AI tools <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>
    </div>
  );
};

export default Workspace;
