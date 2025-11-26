-- ============================================
-- Retro City Map - Full Database Schema Export
-- ============================================
-- Generated: 2025-01-XX
-- Database: PostgreSQL 15+ (Supabase)
-- Warning: This script contains structure AND data
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);

CREATE TYPE public.user_type AS ENUM (
    'individual',
    'business'
);

CREATE TYPE public.billing_period AS ENUM (
    'daily',
    'weekly',
    'monthly',
    'yearly'
);

CREATE TYPE public.subscription_type AS ENUM (
    'place_listing',
    'premium_status'
);

-- ============================================
-- TABLES
-- ============================================

-- Countries table
CREATE TABLE public.countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name_en text NOT NULL,
    name_ru text NOT NULL,
    name_sr text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Cities table
CREATE TABLE public.cities (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    country_id uuid NOT NULL REFERENCES public.countries(id),
    name_en text NOT NULL,
    name_ru text NOT NULL,
    name_sr text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    zoom_level integer DEFAULT 13 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    user_type public.user_type,
    credits integer DEFAULT 0 NOT NULL,
    country_id uuid REFERENCES public.countries(id),
    city_id uuid REFERENCES public.cities(id),
    language text DEFAULT 'sr'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- User roles table
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Categories table
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    name_en text,
    name_ru text,
    name_sr text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    icon text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Places table
CREATE TABLE public.places (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid REFERENCES auth.users(id),
    category_id uuid REFERENCES public.categories(id),
    city_id uuid REFERENCES public.cities(id),
    name text NOT NULL,
    name_en text,
    name_sr text,
    description text,
    description_en text,
    description_sr text,
    address text,
    phone text,
    website text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    is_premium boolean DEFAULT false,
    premium_expires_at timestamp with time zone,
    has_custom_page boolean DEFAULT false,
    custom_page_content jsonb,
    promotions jsonb,
    image_url text,
    google_maps_url text,
    custom_button_text text,
    custom_button_url text,
    is_hidden boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tours table
CREATE TABLE public.tours (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    city_id uuid REFERENCES public.cities(id),
    name text NOT NULL,
    name_en text,
    name_sr text,
    description text,
    description_en text,
    description_sr text,
    price numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    image_url text,
    tour_content jsonb DEFAULT '{}'::jsonb,
    guide_content jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tour places junction table
CREATE TABLE public.tour_places (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(tour_id, place_id)
);

-- Purchased tours table
CREATE TABLE public.purchased_tours (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, tour_id)
);

-- User places (wishlist) table
CREATE TABLE public.user_places (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, place_id)
);

-- Credit transactions table
CREATE TABLE public.credit_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    amount integer NOT NULL,
    type text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    name_en text,
    name_ru text,
    name_sr text,
    type public.subscription_type NOT NULL,
    billing_period public.billing_period DEFAULT 'monthly'::public.billing_period NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id uuid REFERENCES public.places(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
    is_active boolean DEFAULT true NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    next_billing_date timestamp with time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Page views statistics table
CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Share statistics table
CREATE TABLE public.share_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    platform text NOT NULL,
    shared_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Scheduled notifications table
CREATE TABLE public.scheduled_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    sent boolean DEFAULT false,
    sent_at timestamp with time zone,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Notification statistics table
CREATE TABLE public.notification_statistics (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    total_recipients integer DEFAULT 0 NOT NULL,
    successful_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    is_test boolean DEFAULT false,
    sent_by uuid REFERENCES auth.users(id),
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Email templates table
CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    template_type text NOT NULL UNIQUE,
    subject_en text NOT NULL,
    subject_ru text NOT NULL,
    subject_sr text NOT NULL,
    body_en text NOT NULL,
    body_ru text NOT NULL,
    body_sr text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Donation content table
CREATE TABLE public.donation_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    welcome_title_en text DEFAULT 'Welcome'::text NOT NULL,
    welcome_title_ru text DEFAULT 'Добро пожаловать'::text NOT NULL,
    welcome_title_sr text DEFAULT 'Добродошли'::text NOT NULL,
    welcome_description_en text,
    welcome_description_ru text,
    welcome_description_sr text,
    donation_title_en text DEFAULT 'Support the project'::text NOT NULL,
    donation_title_ru text DEFAULT 'Поддержите проект'::text NOT NULL,
    donation_title_sr text DEFAULT 'Подржите пројекат'::text NOT NULL,
    donation_description_en text,
    donation_description_ru text,
    donation_description_sr text,
    donation_wallet_address text,
    donation_qr_code_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_places_category ON public.places(category_id);
CREATE INDEX idx_places_city ON public.places(city_id);
CREATE INDEX idx_places_owner ON public.places(owner_id);
CREATE INDEX idx_places_location ON public.places(latitude, longitude);
CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_purchased_tours_user ON public.purchased_tours(user_id);
CREATE INDEX idx_purchased_tours_tour ON public.purchased_tours(tour_id);
CREATE INDEX idx_tours_city ON public.tours(city_id);
CREATE INDEX idx_tours_active ON public.tours(is_active) WHERE is_active = true;
CREATE INDEX idx_tour_places_tour ON public.tour_places(tour_id);
CREATE INDEX idx_tour_places_place ON public.tour_places(place_id);
CREATE INDEX idx_page_views_place ON public.page_views(place_id);
CREATE INDEX idx_page_views_date ON public.page_views(viewed_at DESC);
CREATE INDEX idx_share_statistics_place ON public.share_statistics(place_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, country_id, city_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'business' THEN 'business'::user_type
      ELSE 'individual'::user_type
    END,
    (NEW.raw_user_meta_data->>'country_id')::uuid,
    (NEW.raw_user_meta_data->>'city_id')::uuid
  );
  
  IF NEW.email = 'qwe@qwe.qwe' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to trigger custom email sending
CREATE OR REPLACE FUNCTION public.trigger_custom_email(
  user_id uuid,
  email text,
  token text,
  token_hash text,
  redirect_to text,
  email_action_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://vjegrpjzhtyrihhpjpzz.supabase.co/functions/v1/send-custom-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user', jsonb_build_object(
        'id', user_id,
        'email', email,
        'user_metadata', jsonb_build_object(
          'language', (SELECT language FROM public.profiles WHERE id = user_id)
        )
      ),
      'email_data', jsonb_build_object(
        'token', token,
        'token_hash', token_hash,
        'redirect_to', redirect_to,
        'email_action_type', email_action_type,
        'site_url', 'https://vjegrpjzhtyrihhpjpzz.supabase.co'
      )
    )
  );
END;
$$;

-- Function to notify about new places via webhook
CREATE OR REPLACE FUNCTION public.notify_new_place()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  place_category_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
  webhook_secret TEXT;
BEGIN
  SELECT name INTO place_category_name
  FROM public.categories
  WHERE id = NEW.category_id;

  notification_title := 'Novo mesto / Новое место / New place';
  notification_body := NEW.name;
  
  IF place_category_name IS NOT NULL THEN
    notification_body := notification_body || ' (' || place_category_name || ')';
  END IF;

  BEGIN
    SELECT decrypted_secret INTO webhook_secret
    FROM vault.decrypted_secrets
    WHERE name = 'WEBHOOK_SECRET'
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Could not retrieve WEBHOOK_SECRET from vault: %', SQLERRM;
      RETURN NEW;
  END;

  IF webhook_secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://vjegrpjzhtyrihhpjpzz.supabase.co/functions/v1/notify-new-place-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'X-Webhook-Secret', webhook_secret
      ),
      body := jsonb_build_object(
        'title', notification_title,
        'body', notification_body,
        'data', jsonb_build_object(
          'place_id', NEW.id,
          'place_name', NEW.name,
          'category_id', NEW.category_id,
          'type', 'new_place'
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on places
CREATE TRIGGER update_places_updated_at
BEFORE UPDATE ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on tours
CREATE TRIGGER update_tours_updated_at
BEFORE UPDATE ON public.tours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Handle new user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Notify about new place
CREATE TRIGGER on_place_created
AFTER INSERT ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_place();

-- ============================================
-- ROW LEVEL SECURITY
-- Note: RLS policies are in separate files (rls-policies/*.sql)
-- ============================================

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INITIAL DATA (if needed)
-- ============================================

-- Insert default donation content row
INSERT INTO public.donation_content (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF SCHEMA
-- ============================================