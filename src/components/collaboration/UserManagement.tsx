import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { logAudit } from "@/lib/audit";
import { Users, Shield, Loader2, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  display_name: string;
  email: string | null;
}

type AppRole = "super_admin" | "admin" | "partner" | "user";

interface UserRole {
  user_id: string;
  role: AppRole;
}

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "super_admin": return "destructive" as const;
    case "admin": return "default" as const;
    case "partner": return "outline" as const;
    default: return "secondary" as const;
  }
};

const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);
  const { toast } = useToast();
  const { isSuperAdmin, userId: currentUserId } = useRole();

  const fetchData = async () => {
    const { data: sbData } = await supabase.from("profiles").select("id, display_name, email");
    const merged = new Map<string, Profile>();
    (sbData || []).forEach((p: any) => merged.set(p.id, { id: p.id, display_name: p.display_name || "Unknown User", email: p.email ?? null }));
    setProfiles(Array.from(merged.values()));

    const rolesRes = await supabase.from("user_roles").select("user_id, role");
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getUserRole = (userId: string): AppRole => {
    const found = roles.find(r => r.user_id === userId);
    return found?.role ?? "user";
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    const oldRole = getUserRole(userId);
    const existing = roles.find(r => r.user_id === userId);

    try {
      if (existing) {
        if (newRole === "user") {
          await supabase.from("user_roles").delete().eq("user_id", userId);
        } else {
          await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
        }
      } else if (newRole !== "user") {
        await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
      }

      await logAudit("role.changed", "user_roles", userId, { role: oldRole }, { role: newRole });
      toast({ title: "Role Updated", description: `Role changed to ${newRole}` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    setDeleting(profile.id);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId: profile.id },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Failed to delete user");
      }
      await logAudit("user.deleted", "auth.users", profile.id, { display_name: profile.display_name }, null);
      toast({ title: "User Deleted", description: `${profile.display_name} has been removed.` });
      setConfirmDelete(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Users className="h-5 w-5" /> User Management
      </h2>
      <div className="space-y-2">
        {profiles.map(profile => {
          const currentRole = getUserRole(profile.id);
          const isSelf = profile.id === currentUserId;
          return (
            <Card key={profile.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{profile.display_name}</span>
                      <Badge variant={roleBadgeVariant(currentRole)} className="text-xs">
                        {currentRole}
                      </Badge>
                    </div>
                    {profile.email && (
                      <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {updating === profile.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Select
                    value={currentRole}
                    onValueChange={(v) => handleRoleChange(profile.id, v)}
                    disabled={updating === profile.id}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSuperAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      disabled={isSelf || deleting === profile.id}
                      onClick={() => setConfirmDelete(profile)}
                      title={isSelf ? "You can't delete your own account" : "Delete user"}
                    >
                      {deleting === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{confirmDelete?.display_name}</span>,
              their profile, and their role. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deleting}
              onClick={(e) => {
                e.preventDefault();
                if (confirmDelete) handleDeleteUser(confirmDelete);
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
