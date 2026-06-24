CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.is_admin_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION private.owns_tool_parent(_user_id uuid, _partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _partner_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.partners p
    WHERE p.id = _partner_id
      AND p.proposed_by = _user_id
  )
$$;

GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin_or_above(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.owns_tool_parent(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (private.is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Super admin can delete any partner" ON public.partners;
CREATE POLICY "Super admin can delete any partner"
ON public.partners
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Owner or super admin can update partners" ON public.partners;
CREATE POLICY "Owner or super admin can update partners"
ON public.partners
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role) OR ((proposed_by IS NOT NULL) AND (proposed_by = auth.uid())))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role) OR ((proposed_by IS NOT NULL) AND (proposed_by = auth.uid())));

DROP POLICY IF EXISTS "Super admin can insert partners" ON public.partners;
CREATE POLICY "Super admin can insert partners"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Admin can update partner status" ON public.partners;
CREATE POLICY "Admin can update partner status"
ON public.partners
FOR UPDATE
TO authenticated
USING (private.is_admin_or_above(auth.uid()))
WITH CHECK (private.is_admin_or_above(auth.uid()));

DROP POLICY IF EXISTS "Super admin can delete tool details" ON public.partner_tool_details;
CREATE POLICY "Super admin can delete tool details"
ON public.partner_tool_details
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Owner or super admin can insert tool details" ON public.partner_tool_details;
CREATE POLICY "Owner or super admin can insert tool details"
ON public.partner_tool_details
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role) OR private.owns_tool_parent(auth.uid(), partner_id));

DROP POLICY IF EXISTS "Owner or super admin can update tool details" ON public.partner_tool_details;
CREATE POLICY "Owner or super admin can update tool details"
ON public.partner_tool_details
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role) OR private.owns_tool_parent(auth.uid(), partner_id))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role) OR private.owns_tool_parent(auth.uid(), partner_id));

DROP POLICY IF EXISTS "Owner or super admin can delete tool details" ON public.partner_tool_details;
CREATE POLICY "Owner or super admin can delete tool details"
ON public.partner_tool_details
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role) OR private.owns_tool_parent(auth.uid(), partner_id));

DROP POLICY IF EXISTS "Super admin can read all roles" ON public.user_roles;
CREATE POLICY "Super admin can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Super admin can insert roles" ON public.user_roles;
CREATE POLICY "Super admin can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Super admin can update roles" ON public.user_roles;
CREATE POLICY "Super admin can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

DROP POLICY IF EXISTS "Super admin can delete roles" ON public.user_roles;
CREATE POLICY "Super admin can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_above(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_tool_parent(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_above(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.owns_tool_parent(uuid, uuid) TO service_role;