
-- 1. Add logo_svg column to partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS logo_svg text DEFAULT '';

-- 2. Migrate rows from proposed_partners into partners with slugified unique keys + owner email
WITH numbered AS (
  SELECT
    pp.*,
    lower(regexp_replace(regexp_replace(coalesce(pp.name,''), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) AS base_slug,
    row_number() OVER (PARTITION BY lower(regexp_replace(regexp_replace(coalesce(pp.name,''), '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')) ORDER BY pp.created_at) AS rn,
    (SELECT email FROM auth.users u WHERE u.id = pp.proposed_by) AS owner_email
  FROM public.proposed_partners pp
  WHERE NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.id = pp.id)
)
INSERT INTO public.partners (id, key, name, description, tools, tool_count, status, created_at, theme_config, proposed_by, owner_email, logo_svg)
SELECT
  n.id,
  CASE WHEN n.rn = 1 THEN COALESCE(NULLIF(n.base_slug,''), 'partner-' || substr(n.id::text,1,8))
       ELSE COALESCE(NULLIF(n.base_slug,''), 'partner') || '-' || substr(n.id::text,1,8) END,
  n.name,
  n.description,
  COALESCE(n.tools,''),
  0,
  CASE WHEN n.status = 'proposed' THEN 'pending' ELSE n.status END,
  n.created_at,
  COALESCE(n.theme_config, '{"accent":"#60A5FA","primary":"#3B82F6","secondary":"#1E40AF"}'::jsonb),
  n.proposed_by,
  n.owner_email,
  COALESCE(n.logo_svg, '')
FROM numbered n;

-- 3. Link tool details to partners using the old proposal_id
UPDATE public.partner_tool_details
   SET partner_id = proposal_id
 WHERE partner_id IS NULL AND proposal_id IS NOT NULL;

-- 4. Drop policies on partner_tool_details that reference old signature/table
DROP POLICY IF EXISTS "Owner or super admin can delete tool details" ON public.partner_tool_details;
DROP POLICY IF EXISTS "Owner or super admin can insert tool details" ON public.partner_tool_details;
DROP POLICY IF EXISTS "Owner or super admin can update tool details" ON public.partner_tool_details;
DROP POLICY IF EXISTS "Public can read approved tools of approved providers" ON public.partner_tool_details;

-- 5. Drop proposal_id column
ALTER TABLE public.partner_tool_details DROP COLUMN IF EXISTS proposal_id;

-- 6. Replace owns_tool_parent with single-arg variant
DROP FUNCTION IF EXISTS public.owns_tool_parent(uuid, uuid, uuid);
CREATE OR REPLACE FUNCTION public.owns_tool_parent(_user_id uuid, _partner_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = _partner_id AND p.proposed_by = _user_id
  );
$$;

-- 7. Recreate partner_tool_details policies
CREATE POLICY "Owner or super admin can insert tool details"
ON public.partner_tool_details FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR owns_tool_parent(auth.uid(), partner_id));

CREATE POLICY "Owner or super admin can update tool details"
ON public.partner_tool_details FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR owns_tool_parent(auth.uid(), partner_id))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR owns_tool_parent(auth.uid(), partner_id));

CREATE POLICY "Owner or super admin can delete tool details"
ON public.partner_tool_details FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR owns_tool_parent(auth.uid(), partner_id));

CREATE POLICY "Public can read approved tools of approved partners"
ON public.partner_tool_details FOR SELECT TO anon, authenticated
USING (
  risk_approved = true
  AND partner_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_tool_details.partner_id
      AND p.status IN ('approved','active')
  )
);

-- 8. Add partner self-insert + admin status-update policies
CREATE POLICY "Authenticated user can self-register pending partner"
ON public.partners FOR INSERT TO authenticated
WITH CHECK (proposed_by = auth.uid() AND status = 'pending');

CREATE POLICY "Admin can update partner status"
ON public.partners FOR UPDATE TO authenticated
USING (is_admin_or_above(auth.uid()))
WITH CHECK (is_admin_or_above(auth.uid()));

-- 9. Drop the obsolete table
DROP TABLE IF EXISTS public.proposed_partners CASCADE;
