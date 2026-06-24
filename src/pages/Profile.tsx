import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, User, Building2, Briefcase, Save, MessageSquare, Wrench, Lock } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileData {
  id: string;
  display_name: string;
  office: string;
  position: string;
  avatar_url: string;
}

interface RecentProposal {
  id: string;
  name: string;
  description: string;
  tools: string;
  status: string;
  created_at: string;
  theme_config: { primary: string; secondary: string; accent: string } | null;
  logo_svg: string | null;
  comment_count: number;
}

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [latestPartners, setLatestPartners] = useState<RecentProposal[]>([]);
  const [form, setForm] = useState({ display_name: "", office: "", position: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRecentActivity();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      const p = data as unknown as ProfileData;
      setProfile(p);
      setForm({
        display_name: p.display_name || "",
        office: p.office || "",
        position: p.position || "",
      });
    }
    setLoading(false);
  };

  const fetchRecentActivity = async () => {
    if (!user) return;

    const { data: userComments } = await supabase
      .from("proposal_comments")
      .select("proposal_id")
      .eq("user_id", user.id);

    const proposalIds = new Set<string>();
    userComments?.forEach((c: any) => proposalIds.add(c.proposal_id));

    const { data: ownProposals } = await supabase.from("partners").select("id").eq("proposed_by", user.id);
    ownProposals?.forEach((p: any) => proposalIds.add(p.id));

    const { data: allProposalsData } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: false });

    const allProposals = allProposalsData || [];

    const latest: RecentProposal[] = allProposals.slice(0, 5).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      tools: p.tools || "",
      status: p.status,
      created_at: p.created_at,
      theme_config: p.theme_config || null,
      logo_svg: p.logo_svg || null,
      comment_count: 0,
    }));
    setLatestPartners(latest);

    if (proposalIds.size === 0) {
      setRecentProposals([]);
      return;
    }

    const matchedProposals = allProposals.filter((p: any) => proposalIds.has(p.id)).slice(0, 10);
    const matchedIds = matchedProposals.map((p) => p.id);
    const { data: matchedComments } = await supabase
      .from("proposal_comments")
      .select("proposal_id")
      .in("proposal_id", matchedIds);

    const commentCounts = (matchedComments || []).reduce((acc: any, curr: any) => {
      acc[curr.proposal_id] = (acc[curr.proposal_id] || 0) + 1;
      return acc;
    }, {});

    const enriched: RecentProposal[] = matchedProposals.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      tools: p.tools || "",
      status: p.status,
      created_at: p.created_at,
      theme_config: p.theme_config || null,
      logo_svg: p.logo_svg || null,
      comment_count: commentCounts[p.id] || 0,
    }));

    setRecentProposals(enriched);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name,
        office: form.office,
        position: form.position,
      } as any)
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
      fetchProfile();
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be under 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: avatarUrl } as any).eq("id", user.id);
    toast({ title: "Success", description: "Avatar updated!" });
    fetchProfile();
    setUploading(false);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResettingPassword(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Could not send reset link", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reset link sent", description: "Check your email to set a new password." });
    }
    setResettingPassword(false);
  };

  const avatarSrc = profile?.avatar_url || null;

  if (!user || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_280px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center space-y-4 pt-6 text-center">
              <div className="relative group">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary/20 bg-secondary">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div>
                <h2 className="text-lg font-bold">{profile?.display_name || "Your Profile"}</h2>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>

              <div className="w-full space-y-3 text-left">
                <div className="space-y-1">
                  <Label htmlFor="display_name" className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3" /> Name
                  </Label>
                  <Input
                    id="display_name"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Enter your name"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="office" className="flex items-center gap-1.5 text-xs">
                    <Building2 className="h-3 w-3" /> Office
                  </Label>
                  <Input
                    id="office"
                    value={form.office}
                    onChange={(e) => setForm({ ...form, office: e.target.value })}
                    placeholder="Enter your office name"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="position" className="flex items-center gap-1.5 text-xs">
                    <Briefcase className="h-3 w-3" /> Position
                  </Label>
                  <Input
                    id="position"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    placeholder="e.g. AI Strategy Lead"
                    className="h-8 text-sm"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={resettingPassword}
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {resettingPassword ? "Sending..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquare className="h-5 w-5" /> Recent Activity
          </h2>

          {recentProposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No recent activity. Start by proposing or commenting on AI partners!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentProposals.map((proposal) => {
                const theme = proposal.theme_config || { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" };
                return (
                  <Card
                    key={proposal.id}
                    className="cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    onClick={() => navigate("/proposals")}
                  >
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }} />
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {proposal.logo_svg ? (
                          <div
                            className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary/50 p-0.5"
                            dangerouslySetInnerHTML={{ __html: proposal.logo_svg }}
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Wrench className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">{proposal.name}</h3>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{proposal.description}</p>
                        </div>
                      </div>

                      {proposal.tools && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {proposal.tools
                            .split(",")
                            .slice(0, 3)
                            .map((tool, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                              >
                                <Wrench className="h-3 w-3" /> {tool.trim()}
                              </span>
                            ))}
                          {proposal.tools.split(",").length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{proposal.tools.split(",").length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {proposal.status}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {proposal.comment_count}
                          </span>
                        </div>
                        <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Latest</h2>
          {latestPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">No partners yet.</p>
          ) : (
            <div className="space-y-3">
              {latestPartners.map((partner) => {
                const theme = partner.theme_config || { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" };
                return (
                  <Card
                    key={partner.id}
                    className="cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    onClick={() => navigate("/proposals")}
                  >
                    <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }} />
                    <CardContent className="flex items-center gap-2.5 p-3">
                      {partner.logo_svg ? (
                        <div
                          className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-secondary/50 p-0.5"
                          dangerouslySetInnerHTML={{ __html: partner.logo_svg }}
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{partner.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{partner.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
