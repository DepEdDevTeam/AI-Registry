import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "admin" | "partner" | "user";

interface UseRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isAdminOrAbove: boolean;
  userId: string | null;
}

export const useRole = (): UseRoleReturn => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setRole(data?.role ?? "user");
      setLoading(false);
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    loading,
    isSuperAdmin: role === "super_admin",
    isAdmin: role === "admin",
    isPartner: role === "partner",
    isAdminOrAbove: role === "super_admin" || role === "admin",
    userId,
  };
};
