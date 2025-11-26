-- ============================================
-- ЭКСПОРТ ПОЛЬЗОВАТЕЛЕЙ (auth.users)
-- ============================================
-- ВАЖНО: Этот запрос требует SUPERUSER прав
-- Запускать в SQL Editor текущего Lovable Cloud проекта
-- ============================================

-- Вариант 1: Полный экспорт с паролями (РЕКОМЕНДУЕТСЯ)
-- Сохраняет хешированные пароли для безболезненного переноса
SELECT 
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
FROM auth.users
ORDER BY created_at;

-- ============================================
-- Вариант 2: Упрощенный экспорт (без паролей)
-- Пользователям придется сбросить пароли
-- ============================================
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at;

-- ============================================
-- СТАТИСТИКА
-- ============================================

-- Общее количество пользователей
SELECT COUNT(*) as total_users FROM auth.users;

-- Пользователи с подтвержденным email
SELECT COUNT(*) as confirmed_users 
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;

-- Пользователи без подтверждения email
SELECT COUNT(*) as unconfirmed_users 
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- Пользователи по типу (из метаданных)
SELECT 
  raw_user_meta_data->>'user_type' as user_type,
  COUNT(*) as count
FROM auth.users
GROUP BY raw_user_meta_data->>'user_type';

-- Недавняя активность (последний вход)
SELECT 
  COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as active_last_7_days,
  COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '30 days') as active_last_30_days,
  COUNT(*) FILTER (WHERE last_sign_in_at IS NULL OR last_sign_in_at < NOW() - INTERVAL '30 days') as inactive
FROM auth.users;

-- ============================================
-- ПРОВЕРКА ПЕРЕД ЭКСПОРТОМ
-- ============================================

-- Проверка целостности: все ли пользователи имеют profiles
SELECT 
  u.id as user_id,
  u.email,
  CASE 
    WHEN p.id IS NULL THEN 'Missing profile'
    ELSE 'Has profile'
  END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
-- Если есть записи - значит есть пользователи без profiles (нужно исправить)

-- Проверка дубликатов email (не должно быть)
SELECT 
  email,
  COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================
-- ПРИМЕЧАНИЯ
-- ============================================

/*
1. СОХРАНЕНИЕ UUID ОБЯЗАТЕЛЬНО
   - UUID пользователей используются как foreign keys везде
   - Если UUID изменятся при импорте - все сломается

2. ENCRYPTED_PASSWORD
   - Если экспортируете encrypted_password, пароли сохранятся
   - Если НЕ экспортируете, пользователям придется сбросить пароли

3. EMAIL_CONFIRMED_AT
   - Если NULL, пользователь не сможет войти
   - При импорте можно принудительно установить NOW()

4. RAW_USER_META_DATA
   - Содержит: full_name, user_type, country_id, city_id
   - Нужно для триггера handle_new_user() при создании profiles

5. ADMIN ПОЛЬЗОВАТЕЛЬ
   - Email: qwe@qwe.qwe
   - Убедитесь что этот пользователь экспортирован
   - Проверьте что в user_roles есть запись с role='admin' для этого user_id
*/
