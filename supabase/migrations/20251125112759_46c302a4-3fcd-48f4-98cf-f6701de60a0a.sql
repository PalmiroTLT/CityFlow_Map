-- Create table for email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type text NOT NULL UNIQUE,
  subject_sr text NOT NULL,
  subject_ru text NOT NULL,
  subject_en text NOT NULL,
  body_sr text NOT NULL,
  body_ru text NOT NULL,
  body_en text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage email templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy for anyone to read email templates (needed for edge functions)
CREATE POLICY "Anyone can view email templates"
ON public.email_templates
FOR SELECT
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_type, subject_sr, subject_ru, subject_en, body_sr, body_ru, body_en)
VALUES 
(
  'email_verification',
  'Потврдите имејл адресу',
  'Подтвердите адрес электронной почты',
  'Confirm your email address',
  'Кликните на линк испод да потврдите имејл адресу: {{ .ConfirmationURL }}',
  'Нажмите на ссылку ниже, чтобы подтвердить адрес электронной почты: {{ .ConfirmationURL }}',
  'Click the link below to confirm your email address: {{ .ConfirmationURL }}'
),
(
  'password_recovery',
  'Ресетовање лозинке',
  'Сброс пароля',
  'Password reset',
  'Кликните на линк испод да ресетујете лозинку: {{ .ConfirmationURL }}',
  'Нажмите на ссылку ниже, чтобы сбросить пароль: {{ .ConfirmationURL }}',
  'Click the link below to reset your password: {{ .ConfirmationURL }}'
),
(
  'email_change',
  'Потврдите промену имејл адресе',
  'Подтвердите изменение адреса электронной почты',
  'Confirm email address change',
  'Кликните на линк испод да потврдите промену имејл адресе: {{ .ConfirmationURL }}',
  'Нажмите на ссылку ниже, чтобы подтвердить изменение адреса электронной почты: {{ .ConfirmationURL }}',
  'Click the link below to confirm your email address change: {{ .ConfirmationURL }}'
),
(
  'magic_link',
  'Пријавите се без лозинке',
  'Войдите без пароля',
  'Sign in without password',
  'Кликните на линк испод да се пријавите: {{ .ConfirmationURL }}',
  'Нажмите на ссылку ниже, чтобы войти: {{ .ConfirmationURL }}',
  'Click the link below to sign in: {{ .ConfirmationURL }}'
);