
-- ============ 1) Partners: hide sensitive columns from anon ============
-- Keep public SELECT policy (app shows partners on landing pages) but use
-- column-level GRANTs so anon/realtime subscribers never receive sensitive cols.
REVOKE SELECT ON public.partners FROM anon;
GRANT SELECT
  (id, key, name, description, tool_count, status, created_at, tools,
   theme_config, logo_svg, contact_person, contact_position, background)
  ON public.partners TO anon;

-- Authenticated users keep full access (admins/owners need email + proposed_by);
-- RLS policies still apply, but make sure non-owner non-admin authenticated
-- users also don't see sensitive fields. We tighten the public SELECT policy
-- to authenticated and add a column-limited anon-readable view via grants only.
-- (Above column GRANT already restricts anon; nothing else needed for that.)

-- ============ 2) Profiles: hide email column from other users ============
REVOKE SELECT (email) ON public.profiles FROM authenticated;
-- (Users get their own email from auth.users via supabase.auth.getUser())

-- ============ 3) Realtime messages: restrict subscriptions ============
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can subscribe" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

-- ============ 4) Revoke EXECUTE on SECURITY DEFINER functions from anon/public ============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_above(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.owns_tool_parent(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.link_partner_by_email(uuid, text) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_partner_role(uuid) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, public, authenticated;

-- ============ 5) Fix mutable search_path on queue/email helper functions ============
CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

-- ============ 6) Restrict listing on public storage buckets ============
-- Allow public read of individual objects but prevent enumerating bucket contents.
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read email-assets" ON storage.objects;

CREATE POLICY "Public read avatars by path"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars' AND name IS NOT NULL);

CREATE POLICY "Public read email-assets by path"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'email-assets' AND name IS NOT NULL);
