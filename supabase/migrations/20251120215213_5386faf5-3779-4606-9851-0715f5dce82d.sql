-- Allow business place owners to view share statistics for their own places
CREATE POLICY "Business owners can view own place share statistics"
ON public.share_statistics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.places
    WHERE places.id = share_statistics.place_id
      AND places.owner_id = auth.uid()
  )
);
