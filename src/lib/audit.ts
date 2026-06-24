import { supabase } from "@/integrations/supabase/client";

export const logAudit = async (
  action: string,
  entityType: string,
  entityId?: string | null,
  beforeData?: Record<string, any> | null,
  afterData?: Record<string, any> | null
) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  // Direct insert into the Supabase 'audit_logs' table
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: session.user.id,
    action: action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });

  if (error) {
    console.error("Failed to log audit:", error.message);
  }
};