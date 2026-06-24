CREATE POLICY "Users can delete own proposals"
ON public.proposed_partners
FOR DELETE
TO authenticated
USING (auth.uid() = proposed_by);