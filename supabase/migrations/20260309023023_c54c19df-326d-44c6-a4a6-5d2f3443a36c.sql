-- Allow authenticated users to update partners (for adding tools)
CREATE POLICY "Authenticated users can update partners"
ON public.partners
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);