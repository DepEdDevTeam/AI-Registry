DROP POLICY IF EXISTS "Users can update own proposal details" ON public.proposed_partners;

CREATE POLICY "Users can update own proposal details"
ON public.proposed_partners
FOR UPDATE
TO authenticated
USING (auth.uid() = proposed_by)
WITH CHECK (auth.uid() = proposed_by);