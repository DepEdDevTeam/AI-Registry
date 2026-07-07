-- Restore backend surfaces used by the super-admin dashboard.
-- These RPCs keep user management working even if Edge Functions are not deployed.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.current_user_has_role(ARRAY['admin', 'super_admin']));

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can insert roles" ON public.user_roles;
CREATE POLICY "Super admin can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_has_role(ARRAY['super_admin']));

DROP POLICY IF EXISTS "Super admin can update roles" ON public.user_roles;
CREATE POLICY "Super admin can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.current_user_has_role(ARRAY['super_admin']))
  WITH CHECK (public.current_user_has_role(ARRAY['super_admin']));

DROP POLICY IF EXISTS "Super admin can delete roles" ON public.user_roles;
CREATE POLICY "Super admin can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.current_user_has_role(ARRAY['super_admin']));

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.current_user_has_role(ARRAY['super_admin']) THEN
    RAISE EXCEPTION 'Super admin required';
  END IF;

  IF _role = 'user' THEN
    DELETE FROM public.user_roles
    WHERE user_id = _user_id;
    RETURN;
  END IF;

  UPDATE public.user_roles
  SET role = _role
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _role);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
DECLARE
  _deleted_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.current_user_has_role(ARRAY['super_admin']) THEN
    RAISE EXCEPTION 'Super admin required';
  END IF;

  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id;

  DELETE FROM public.profiles
  WHERE id = _user_id;

  DELETE FROM auth.users
  WHERE id = _user_id
  RETURNING id INTO _deleted_id;

  RETURN _deleted_id IS NOT NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
