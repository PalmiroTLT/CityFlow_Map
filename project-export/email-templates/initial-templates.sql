-- ============================================
-- Initial Email Templates for Retro City Map
-- ============================================
-- Run this SQL after creating the email_templates table
-- to populate it with initial templates
-- ============================================

-- Template 1: Signup (Email Verification)
INSERT INTO public.email_templates (
  template_type,
  subject_sr,
  subject_ru,
  subject_en,
  body_sr,
  body_ru,
  body_en
) VALUES (
  'signup',
  'Потврдите своју email адресу - Retro City Map',
  'Подтвердите свой email адрес - Retro City Map',
  'Confirm your email address - Retro City Map',
  -- Serbian Body
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F9FAFB; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #3B82F6; margin: 0 0 20px 0; font-size: 28px;">Добродошли на Retro City Map! 🗺️</h1>
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Хвала што сте се регистровали! Да бисте завршили регистрацију, молимо вас да потврдите своју email адресу.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Кликните на дугме испод да потврдите свој налог:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #3B82F6; border-radius: 6px;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}" 
                       style="display: inline-block; padding: 14px 30px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Потврди email адресу
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                Или копирајте и налепите следећу адресу у ваш претраживач:
              </p>
              <p style="margin: 0 0 30px 0; font-size: 12px; color: #3B82F6; word-break: break-all;">
                {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                Ако нисте направили налог на Retro City Map, можете игнорисати ову поруку.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                © 2024 Retro City Map. Сва права задржана.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  -- Russian Body
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F9FAFB; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #3B82F6; margin: 0 0 20px 0; font-size: 28px;">Добро пожаловать в Retro City Map! 🗺️</h1>
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Спасибо за регистрацию! Чтобы завершить регистрацию, пожалуйста, подтвердите свой email адрес.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Нажмите на кнопку ниже, чтобы подтвердить свой аккаунт:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #3B82F6; border-radius: 6px;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}" 
                       style="display: inline-block; padding: 14px 30px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Подтвердить email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                Или скопируйте и вставьте следующий адрес в ваш браузер:
              </p>
              <p style="margin: 0 0 30px 0; font-size: 12px; color: #3B82F6; word-break: break-all;">
                {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                Если вы не создавали аккаунт на Retro City Map, вы можете проигнорировать это письмо.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                © 2024 Retro City Map. Все права защищены.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  -- English Body
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F9FAFB; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #3B82F6; margin: 0 0 20px 0; font-size: 28px;">Welcome to Retro City Map! 🗺️</h1>
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Thank you for signing up! To complete your registration, please confirm your email address.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Click the button below to confirm your account:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #3B82F6; border-radius: 6px;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}" 
                       style="display: inline-block; padding: 14px 30px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                Or copy and paste the following address into your browser:
              </p>
              <p style="margin: 0 0 30px 0; font-size: 12px; color: #3B82F6; word-break: break-all;">
                {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                If you did not create an account on Retro City Map, you can safely ignore this message.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                © 2024 Retro City Map. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
);

-- Template 2: Recovery (Password Reset)
INSERT INTO public.email_templates (
  template_type,
  subject_sr,
  subject_ru,
  subject_en,
  body_sr,
  body_ru,
  body_en
) VALUES (
  'recovery',
  'Ресетујте своју лозинку - Retro City Map',
  'Сброс пароля - Retro City Map',
  'Reset your password - Retro City Map',
  -- Serbian Body
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F9FAFB; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #EF4444; margin: 0 0 20px 0; font-size: 28px;">Ресетујте лозинку 🔐</h1>
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Примили смо захтев за ресетовање лозинке за ваш Retro City Map налог.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Кликните на дугме испод да креирате нову лозинку:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #EF4444; border-radius: 6px;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}" 
                       style="display: inline-block; padding: 14px 30px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Ресетуј лозинку
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                Или копирајте и налепите следећу адресу у ваш претраживач:
              </p>
              <p style="margin: 0 0 30px 0; font-size: 12px; color: #EF4444; word-break: break-all;">
                {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                <strong>Важно:</strong> Овај линк истиче за 1 сат из безбедносних разлога.
              </p>
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                Ако нисте тражили ресетовање лозинке, можете игнорисати ову поруку. Ваша лозинка неће бити промењена.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                © 2024 Retro City Map. Сва права задржана.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  -- Russian Body
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F9FAFB; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #EF4444; margin: 0 0 20px 0; font-size: 28px;">Сброс пароля 🔐</h1>
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Мы получили запрос на сброс пароля для вашего аккаунта Retro City Map.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Нажмите на кнопку ниже, чтобы создать новый пароль:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #EF4444; border-radius: 6px;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}" 
                       style="display: inline-block; padding: 14px 30px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Сбросить пароль
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                Или скопируйте и вставьте следующий адрес в ваш браузер:
              </p>
              <p style="margin: 0 0 30px 0; font-size: 12px; color: #EF4444; word-break: break-all;">
                {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                <strong>Важно:</strong> Эта ссылка истекает через 1 час из соображений безопасности.
              </p>
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                Если вы не запрашивали сброс пароля, вы можете проигнорировать это письмо. Ваш пароль не будет изменен.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                © 2024 Retro City Map. Все права защищены.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  -- English Body
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; background-color: #F9FAFB; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #EF4444; margin: 0 0 20px 0; font-size: 28px;">Reset Your Password 🔐</h1>
              <p style="margin: 0 0 20px 0; font-size: 16px;">
                We received a request to reset the password for your Retro City Map account.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px;">
                Click the button below to create a new password:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td align="center" style="background-color: #EF4444; border-radius: 6px;">
                    <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}" 
                       style="display: inline-block; padding: 14px 30px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                Or copy and paste the following address into your browser:
              </p>
              <p style="margin: 0 0 30px 0; font-size: 12px; color: #EF4444; word-break: break-all;">
                {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                <strong>Important:</strong> This link expires in 1 hour for security reasons.
              </p>
              <p style="margin: 0; font-size: 14px; color: #6B7280;">
                If you did not request a password reset, you can safely ignore this message. Your password will not be changed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #F9FAFB; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
                © 2024 Retro City Map. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
);

-- Verify templates were inserted
SELECT template_type, 
       CASE 
         WHEN subject_sr IS NOT NULL AND subject_ru IS NOT NULL AND subject_en IS NOT NULL THEN 'All languages'
         ELSE 'Missing languages'
       END as status
FROM email_templates
ORDER BY template_type;
