-- Allow users to read their own role so the app can render role-gated navigation.
-- Use a SECURITY DEFINER helper for admin checks to avoid recursive RLS on user_roles.

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_has_role(_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = ANY (_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_has_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(text[]) TO authenticated;

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.current_user_has_role(ARRAY['admin', 'super_admin']));
