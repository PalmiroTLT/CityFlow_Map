-- Create table for donation content
CREATE TABLE IF NOT EXISTS public.donation_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welcome_title_sr TEXT NOT NULL DEFAULT 'Добродошли',
  welcome_title_ru TEXT NOT NULL DEFAULT 'Добро пожаловать',
  welcome_title_en TEXT NOT NULL DEFAULT 'Welcome',
  welcome_description_sr TEXT,
  welcome_description_ru TEXT,
  welcome_description_en TEXT,
  donation_title_sr TEXT NOT NULL DEFAULT 'Подржите пројекат',
  donation_title_ru TEXT NOT NULL DEFAULT 'Поддержите проект',
  donation_title_en TEXT NOT NULL DEFAULT 'Support the project',
  donation_description_sr TEXT,
  donation_description_ru TEXT,
  donation_description_en TEXT,
  donation_wallet_address TEXT,
  donation_qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donation_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view donation content
CREATE POLICY "Anyone can view donation content"
  ON public.donation_content
  FOR SELECT
  USING (true);

-- Admins can manage donation content
CREATE POLICY "Admins can manage donation content"
  ON public.donation_content
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default content
INSERT INTO public.donation_content (
  welcome_description_sr,
  welcome_description_ru,
  welcome_description_en,
  donation_description_sr,
  donation_description_ru,
  donation_description_en
) VALUES (
  'Ова апликација вам помаже да откријете најбоље локације у вашем граду. Истражите музеје, кафиће, паркове и још много тога.',
  'Это приложение поможет вам открыть лучшие места в вашем городе. Исследуйте музеи, кафе, парки и многое другое.',
  'This application helps you discover the best places in your city. Explore museums, cafes, parks and much more.',
  'Ваша подршка помаже нам да наставимо да развијамо и побољшавамо апликацију. Свака донација је добродошла!',
  'Ваша поддержка помогает нам продолжать развивать и улучшать приложение. Любое пожертвование приветствуется!',
  'Your support helps us continue to develop and improve the application. Any donation is welcome!'
);