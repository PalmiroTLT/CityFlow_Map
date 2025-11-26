-- ============================================
-- ЭКСПОРТ ВСЕХ ТАБЛИЦ ПРИЛОЖЕНИЯ
-- ============================================
-- Запускать в SQL Editor текущего Lovable Cloud проекта
-- Каждый SELECT сохранять в отдельный CSV файл
-- ============================================

-- ============================================
-- СПРАВОЧНИКИ (экспортировать первыми)
-- ============================================

-- 1. Countries
SELECT * FROM public.countries ORDER BY created_at;

-- 2. Cities  
SELECT * FROM public.cities ORDER BY country_id, created_at;

-- 3. Categories
SELECT * FROM public.categories ORDER BY display_order, created_at;

-- 4. Subscription Plans
SELECT * FROM public.subscription_plans ORDER BY type, billing_period;

-- ============================================
-- ПОЛЬЗОВАТЕЛЬСКИЕ ДАННЫЕ
-- ============================================

-- 5. Profiles
-- ВАЖНО: Экспортировать ПОСЛЕ auth.users
SELECT * FROM public.profiles ORDER BY created_at;

-- 6. User Roles
-- ВАЖНО: Проверить что admin пользователь (qwe@qwe.qwe) есть
SELECT * FROM public.user_roles ORDER BY user_id, role;

-- ============================================
-- ОСНОВНЫЕ ДАННЫЕ
-- ============================================

-- 7. Places
SELECT * FROM public.places ORDER BY created_at;

-- 8. Tours
SELECT * FROM public.tours ORDER BY display_order, created_at;

-- 9. Tour Places (связь туров и мест)
SELECT * FROM public.tour_places ORDER BY tour_id, display_order;

-- ============================================
-- ПОЛЬЗОВАТЕЛЬСКИЙ КОНТЕНТ
-- ============================================

-- 10. Purchased Tours
SELECT * FROM public.purchased_tours ORDER BY purchased_at;

-- 11. User Places (Wishlist)
SELECT * FROM public.user_places ORDER BY user_id, created_at;

-- 12. Credit Transactions
SELECT * FROM public.credit_transactions ORDER BY created_at;

-- 13. User Subscriptions
SELECT * FROM public.user_subscriptions ORDER BY started_at;

-- ============================================
-- СТАТИСТИКА
-- ============================================

-- 14. Page Views
SELECT * FROM public.page_views ORDER BY viewed_at;

-- 15. Share Statistics
SELECT * FROM public.share_statistics ORDER BY shared_at;

-- ============================================
-- УВЕДОМЛЕНИЯ
-- ============================================

-- 16. Push Subscriptions
SELECT * FROM public.push_subscriptions ORDER BY created_at;

-- 17. Scheduled Notifications
SELECT * FROM public.scheduled_notifications ORDER BY scheduled_for;

-- 18. Notification Statistics
SELECT * FROM public.notification_statistics ORDER BY sent_at;

-- ============================================
-- КОНТЕНТ И ШАБЛОНЫ
-- ============================================

-- 19. Email Templates
SELECT * FROM public.email_templates ORDER BY template_type;

-- 20. Donation Content
SELECT * FROM public.donation_content ORDER BY created_at;

-- ============================================
-- СТАТИСТИКА ПО ВСЕМ ТАБЛИЦАМ
-- ============================================

SELECT 
  schemaname,
  tablename,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates,
  n_tup_del as total_deletes,
  n_live_tup as current_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- РАЗМЕРЫ ТАБЛИЦ
-- ============================================

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ
-- ============================================

-- Проверка orphaned profiles (profiles без пользователей)
SELECT COUNT(*) as orphaned_profiles
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);
-- Должно быть 0!

-- Проверка orphaned places (места без владельцев)
SELECT COUNT(*) as orphaned_places
FROM public.places p
WHERE owner_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = p.owner_id
  );
-- Должно быть 0!

-- Проверка orphaned tour_places (связи туров без туров или мест)
SELECT COUNT(*) as orphaned_tour_places
FROM public.tour_places tp
WHERE NOT EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tp.tour_id)
   OR NOT EXISTS (SELECT 1 FROM public.places p WHERE p.id = tp.place_id);
-- Должно быть 0!

-- Проверка orphaned user_subscriptions (подписки без пользователей или планов)
SELECT COUNT(*) as orphaned_subscriptions
FROM public.user_subscriptions us
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = us.user_id)
   OR NOT EXISTS (SELECT 1 FROM public.subscription_plans sp WHERE sp.id = us.plan_id);
-- Должно быть 0!

-- ============================================
-- ИНСТРУКЦИИ ПО СОХРАНЕНИЮ
-- ============================================

/*
СОХРАНЕНИЕ РЕЗУЛЬТАТОВ:

Для каждого SELECT:
1. Запустить запрос в SQL Editor
2. Скачать результат как CSV
3. Назвать файл по имени таблицы: table_name.csv

Например:
- countries.csv
- cities.csv
- profiles.csv
- places.csv
и т.д.

ВАЖНО:
- Сохранять с заголовками (column names)
- Кодировка: UTF-8
- Разделитель: запятая (,)
- Кавычки: двойные (") для строк с запятыми
*/
