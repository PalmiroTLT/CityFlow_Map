-- Create user_places table for "want to visit" functionality
CREATE TABLE public.user_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, place_id)
);

-- Enable RLS
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
ON public.user_places
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add places to their wishlist
CREATE POLICY "Users can add to wishlist"
ON public.user_places
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove places from their wishlist
CREATE POLICY "Users can remove from wishlist"
ON public.user_places
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all wishlists
CREATE POLICY "Admins can view all wishlists"
ON public.user_places
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX idx_user_places_user_id ON public.user_places(user_id);
CREATE INDEX idx_user_places_place_id ON public.user_places(place_id);