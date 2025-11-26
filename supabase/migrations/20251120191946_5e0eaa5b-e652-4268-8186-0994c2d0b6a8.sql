-- Create table for tracking share statistics
CREATE TABLE public.share_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.share_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert share statistics"
ON public.share_statistics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all share statistics"
ON public.share_statistics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_share_statistics_place_id ON public.share_statistics(place_id);
CREATE INDEX idx_share_statistics_shared_at ON public.share_statistics(shared_at DESC);