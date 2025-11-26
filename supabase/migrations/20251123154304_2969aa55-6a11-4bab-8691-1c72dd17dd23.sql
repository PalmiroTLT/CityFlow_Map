-- Create table for tracking page views
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Place owners can view their place statistics"
ON public.page_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.places
    WHERE places.id = page_views.place_id
    AND places.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all page views"
ON public.page_views
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_page_views_place_id ON public.page_views(place_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON public.page_views(viewed_at);