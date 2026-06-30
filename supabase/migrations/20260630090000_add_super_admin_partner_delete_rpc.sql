CREATE OR REPLACE FUNCTION public.delete_partner_as_super_admin(_partner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deleted_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
       SELECT 1
       FROM public.user_roles
       WHERE user_id = auth.uid()
         AND role = 'super_admin'::public.app_role
     )
     AND NOT EXISTS (
       SELECT 1
       FROM public.partners
       WHERE id = _partner_id
         AND proposed_by = auth.uid()
     ) THEN
    RAISE EXCEPTION 'You do not have permission to delete this partner';
  END IF;

  DELETE FROM public.partners
  WHERE id = _partner_id
  RETURNING id INTO _deleted_id;

  RETURN _deleted_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_partner_as_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_partner_as_super_admin(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
