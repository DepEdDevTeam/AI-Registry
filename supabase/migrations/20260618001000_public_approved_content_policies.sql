-- Allow unauthenticated visitors to read approved public content.
-- Existing authenticated policies remain in place for admin and internal workflows.

CREATE POLICY "Public can read approved partners"
  ON public.partners
  FOR SELECT
  TO anon
  USING (status IN ('approved', 'active'));

CREATE POLICY "Public can read approved tools"
  ON public.partner_tool_details
  FOR SELECT
  TO anon
  USING (risk_approved = true);

CREATE POLICY "Public can read approved proposals"
  ON public.proposed_partners
  FOR SELECT
  TO anon
  USING (status = 'approved');
