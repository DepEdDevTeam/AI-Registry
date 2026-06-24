CREATE POLICY "Super admin can delete any proposal"
ON public.proposed_partners FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can delete any partner"
ON public.partners FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can delete tool details"
ON public.partner_tool_details FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

ALTER TABLE public.proposed_partners REPLICA IDENTITY FULL;
ALTER TABLE public.partners REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposed_partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;