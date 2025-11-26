-- ============================================
-- ИМПОРТ ПОЛЬЗОВАТЕЛЕЙ (auth.users)
-- ============================================
-- КРИТИЧЕСКИ ВАЖНО: Импортировать ПЕРВЫМ перед всеми другими данными
-- UUID пользователей ДОЛЖНЫ СОХРАНИТЬСЯ для работы foreign keys
-- ============================================

-- ============================================
-- МЕТОД 1: Импорт с паролями (РЕКОМЕНДУЕТСЯ)
-- ============================================
-- Используется если при экспорте были сохранены encrypted_password
-- Пользователи смогут войти со старыми паролями

-- Шаг 1: Создать временную таблицу для загрузки данных
CREATE TEMP TABLE temp_users (
  id UUID,
  instance_id UUID,
  aud TEXT,
  role TEXT,
  email TEXT,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token TEXT,
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new TEXT,
  email_change TEXT,
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  phone TEXT,
  phone_confirmed_at TIMESTAMPTZ,
  phone_change TEXT,
  phone_change_token TEXT,
  phone_change_sent_at TIMESTAMPTZ,
  email_change_token_current TEXT,
  email_change_confirm_status SMALLINT,
  banned_until TIMESTAMPTZ,
  reauthentication_token TEXT,
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN,
  deleted_at TIMESTAMPTZ,
  is_anonymous BOOLEAN
);

-- Шаг 2: Загрузить CSV в временную таблицу
-- ЗАМЕНИТЕ '/path/to/users_export.csv' на реальный путь к файлу
COPY temp_users FROM '/path/to/users_export.csv' WITH CSV HEADER;

-- Шаг 3: Вставить пользователей в auth.users
-- ВАЖНО: Используем ON CONFLICT DO NOTHING для безопасности
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
)
SELECT 
  id,
  COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(aud, 'authenticated'),
  COALESCE(role, 'authenticated'),
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  COALESCE(is_super_admin, false),
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  COALESCE(is_sso_user, false),
  deleted_at,
  COALESCE(is_anonymous, false)
FROM temp_users
ON CONFLICT (id) DO NOTHING;

-- Шаг 4: Проверить импорт
SELECT 
  COUNT(*) as imported_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users
FROM auth.users;

-- Шаг 5: Удалить временную таблицу
DROP TABLE temp_users;

-- ============================================
-- МЕТОД 2: Импорт без паролей (УПРОЩЕННЫЙ)
-- ============================================
-- Используется если пароли НЕ были экспортированы
-- Пользователям придется сбросить пароли

-- Шаг 1: Создать временную таблицу
CREATE TEMP TABLE temp_users_simple (
  id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  raw_app_meta_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
);

-- Шаг 2: Загрузить CSV
COPY temp_users_simple FROM '/path/to/users_export_simple.csv' WITH CSV HEADER;

-- Шаг 3: Вставить пользователей (без паролей)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  last_sign_in_at
)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  email,
  '$2a$10$PLACEHOLDER_INVALID_PASSWORD_HASH', -- Невалидный хеш, требует сброса
  COALESCE(email_confirmed_at, NOW()), -- Подтверждаем email автоматически
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  false,
  created_at,
  updated_at,
  last_sign_in_at
FROM temp_users_simple
ON CONFLICT (id) DO NOTHING;

-- Шаг 4: Удалить временную таблицу
DROP TABLE temp_users_simple;

-- ============================================
-- ПОСТ-ИМПОРТ ДЕЙСТВИЯ
-- ============================================

-- 1. Подтвердить email для всех пользователей (если нужно)
-- ОСТОРОЖНО: Это подтверждает email для ВСЕХ пользователей
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Убедиться что admin пользователь есть
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  CASE 
    WHEN ur.role = 'admin' THEN 'YES - Admin role found'
    ELSE 'NO - Missing admin role!'
  END as admin_status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.role = 'admin'
WHERE u.email = 'qwe@qwe.qwe';
-- Если admin role отсутствует - добавить вручную после импорта user_roles

-- 3. Проверка дубликатов (не должно быть)
SELECT 
  email,
  COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- 4. Проверка UUID conflicts
SELECT COUNT(*) as uuid_conflicts
FROM auth.users u1
JOIN auth.users u2 ON u1.id = u2.id AND u1.email != u2.email;
-- Должно быть 0!

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Если импорт не работает, проверить:

-- 1. Права доступа
-- Убедиться что выполняете запросы с правами SUPERUSER или postgres role

-- 2. Instance ID
-- Если ошибки с instance_id, использовать:
SELECT current_setting('app.settings.instance_id', true);
-- И заменить '00000000-0000-0000-0000-000000000000' на полученное значение

-- 3. Existing users
-- Если пользователи уже существуют, сначала удалить (ОСТОРОЖНО!)
-- DELETE FROM auth.users WHERE id IN (SELECT id FROM temp_users);

-- 4. Проверка импортированных данных
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at
LIMIT 10;

-- ============================================
-- ВАЖНЫЕ ЗАМЕЧАНИЯ
-- ============================================

/*
1. UUID КРИТИЧНЫ
   - UUID пользователей ДОЛЖНЫ СОХРАНИТЬСЯ
   - Иначе все foreign keys сломаются (profiles, places, user_roles и т.д.)

2. ПАРОЛИ
   - Метод 1: С паролями - пользователи могут войти сразу
   - Метод 2: Без паролей - пользователям нужно сбросить пароли

3. EMAIL CONFIRMATION
   - Если email_confirmed_at = NULL, пользователь не сможет войти
   - Можно принудительно подтвердить через UPDATE (см. выше)

4. ADMIN ПОЛЬЗОВАТЕЛЬ
   - Email: qwe@qwe.qwe
   - ОБЯЗАТЕЛЬНО проверить что импортирован
   - ОБЯЗАТЕЛЬНО проверить что в user_roles есть запись с role='admin'

5. METADATA
   - raw_user_meta_data содержит: full_name, user_type, country_id, city_id
   - Эти данные нужны для триггера handle_new_user()
   - При импорте НЕ ЗАПУСКАЮТСЯ триггеры на auth.users
   - Поэтому profiles нужно импортировать отдельно

6. СЛЕДУЮЩИЙ ШАГ
   - После импорта auth.users
   - Импортировать profiles
   - Затем user_roles
   - Затем остальные данные
*/
