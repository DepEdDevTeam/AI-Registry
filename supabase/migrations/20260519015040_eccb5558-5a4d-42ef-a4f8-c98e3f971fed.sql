-- Add 'partner' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- Function to assign partner role only if user has no existing role
CREATE OR REPLACE FUNCTION public.assign_partner_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'partner');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_partner_role(uuid) TO authenticated;