-- Create countries table
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_sr TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cities table
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name_sr TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  zoom_level INTEGER NOT NULL DEFAULT 13,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user type enum
CREATE TYPE public.user_type AS ENUM ('individual', 'business');

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_type public.user_type,
ADD COLUMN country_id UUID REFERENCES public.countries(id),
ADD COLUMN city_id UUID REFERENCES public.cities(id),
ADD COLUMN language TEXT DEFAULT 'sr' CHECK (language IN ('sr', 'ru', 'en'));

-- Update places table to link with cities
ALTER TABLE public.places 
ADD COLUMN city_id UUID REFERENCES public.cities(id),
ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Update tours table to link with cities
ALTER TABLE public.tours 
ADD COLUMN city_id UUID REFERENCES public.cities(id),
ADD COLUMN price NUMERIC(10,2) DEFAULT 0;

-- Create purchased_tours table
CREATE TABLE public.purchased_tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tour_id)
);

-- Update categories to support multiple languages
ALTER TABLE public.categories 
ADD COLUMN name_sr TEXT,
ADD COLUMN name_ru TEXT;

-- Copy existing names to new language columns
UPDATE public.categories SET name_sr = name, name_ru = name_en WHERE name_en IS NOT NULL;
UPDATE public.categories SET name_sr = name WHERE name_sr IS NULL;

-- Enable RLS on new tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_tours ENABLE ROW LEVEL SECURITY;

-- RLS policies for countries (public read)
CREATE POLICY "Anyone can view countries"
ON public.countries FOR SELECT
USING (true);

-- RLS policies for cities (public read)
CREATE POLICY "Anyone can view cities"
ON public.cities FOR SELECT
USING (true);

-- RLS policies for purchased_tours
CREATE POLICY "Users can view their own purchases"
ON public.purchased_tours FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.purchased_tours FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update places RLS to allow business owners to manage their places
CREATE POLICY "Business owners can insert their places"
ON public.places FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'business'
  )
);

CREATE POLICY "Business owners can update their places"
ON public.places FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can delete their places"
ON public.places FOR DELETE
USING (auth.uid() = owner_id);

-- Insert initial data for Serbia
INSERT INTO public.countries (name_sr, name_ru, name_en, code) VALUES
('Србија', 'Сербия', 'Serbia', 'RS');

-- Insert cities for Serbia
INSERT INTO public.cities (country_id, name_sr, name_ru, name_en, latitude, longitude, zoom_level)
SELECT 
  id,
  'Београд',
  'Белград',
  'Belgrade',
  44.8176,
  20.4569,
  13
FROM public.countries WHERE code = 'RS'
UNION ALL
SELECT 
  id,
  'Нови Сад',
  'Нови-Сад',
  'Novi Sad',
  45.2671,
  19.8335,
  13
FROM public.countries WHERE code = 'RS'
UNION ALL
SELECT 
  id,
  'Ниш',
  'Ниш',
  'Niš',
  43.3209,
  21.8958,
  13
FROM public.countries WHERE code = 'RS';