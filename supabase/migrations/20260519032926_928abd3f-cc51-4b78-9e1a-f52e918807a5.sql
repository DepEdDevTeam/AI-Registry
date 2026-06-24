
-- 1) Schema additions to partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS proposed_by uuid,
  ADD COLUMN IF NOT EXISTS owner_email text;

CREATE INDEX IF NOT EXISTS idx_partners_proposed_by ON public.partners(proposed_by);
CREATE INDEX IF NOT EXISTS idx_partners_owner_email_lower ON public.partners(lower(owner_email));

-- 2) Helper: does this user own the parent (partner_id or proposal_id) of a tool row?
CREATE OR REPLACE FUNCTION public.owns_tool_parent(_user_id uuid, _partner_id uuid, _proposal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (_partner_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = _partner_id AND p.proposed_by = _user_id
    ))
    OR
    (_proposal_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.proposed_partners pp
      WHERE pp.id = _proposal_id AND pp.proposed_by = _user_id
    ));
$$;

-- 3) Auto-link function: assign new (or existing) user to any partners/proposed_partners
--    whose owner_email matches their auth email.
CREATE OR REPLACE FUNCTION public.link_partner_by_email(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _email IS NULL OR _user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.partners
     SET proposed_by = _user_id
   WHERE proposed_by IS NULL
     AND lower(owner_email) = lower(_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_partner_by_email(uuid, text) TO authenticated;

-- 4) Tighten RLS on partners
DROP POLICY IF EXISTS "Authenticated users can update partners" ON public.partners;

CREATE POLICY "Owner or super admin can update partners"
ON public.partners
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR (proposed_by IS NOT NULL AND proposed_by = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR (proposed_by IS NOT NULL AND proposed_by = auth.uid())
);

-- Allow super admin to insert official partners (currently no INSERT policy)
DROP POLICY IF EXISTS "Super admin can insert partners" ON public.partners;
CREATE POLICY "Super admin can insert partners"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 5) Tighten RLS on partner_tool_details
DROP POLICY IF EXISTS "Authenticated users can insert tool details" ON public.partner_tool_details;
DROP POLICY IF EXISTS "Authenticated users can update tool details" ON public.partner_tool_details;
DROP POLICY IF EXISTS "Authenticated users can delete tool details" ON public.partner_tool_details;

CREATE POLICY "Owner or super admin can insert tool details"
ON public.partner_tool_details
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR public.owns_tool_parent(auth.uid(), partner_id, proposal_id)
);

CREATE POLICY "Owner or super admin can update tool details"
ON public.partner_tool_details
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.owns_tool_parent(auth.uid(), partner_id, proposal_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR public.owns_tool_parent(auth.uid(), partner_id, proposal_id)
);

CREATE POLICY "Owner or super admin can delete tool details"
ON public.partner_tool_details
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.owns_tool_parent(auth.uid(), partner_id, proposal_id)
);
