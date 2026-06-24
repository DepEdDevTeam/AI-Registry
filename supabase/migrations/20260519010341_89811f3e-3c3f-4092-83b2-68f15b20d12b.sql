CREATE POLICY "Anyone can read approved proposals"
ON public.proposed_partners FOR SELECT
TO anon, authenticated
USING (status = 'approved');

CREATE POLICY "Anyone can read tools of approved providers"
ON public.partner_tool_details FOR SELECT
TO anon, authenticated
USING (
  (proposal_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.proposed_partners pp
    WHERE pp.id = partner_tool_details.proposal_id AND pp.status = 'approved'
  ))
  OR
  (partner_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_tool_details.partner_id
  ))
);