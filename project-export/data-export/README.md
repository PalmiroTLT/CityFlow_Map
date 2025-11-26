# Экспорт и импорт данных

## ⚠️ КРИТИЧЕСКИ ВАЖНО
Эта секция описывает перенос **существующих данных** из текущего Lovable Cloud проекта в новый Supabase проект.

---

## Обзор процесса

Перенос данных состоит из двух частей:

1. **Auth Users** - пользователи из `auth.users` (специальная таблица Supabase Auth)
2. **Application Data** - данные из всех публичных таблиц (profiles, places, tours и т.д.)

---

## Часть 1: Экспорт пользователей (Auth Users)

### Важно понять

**Auth.users - это специальная таблица Supabase**:
- Не доступна через обычный REST API
- Не видна в публичной схеме
- Управляется только через Supabase Auth API
- Требует особого подхода для экспорта/импорта

### Метод экспорта через Supabase Dashboard

#### Шаг 1: Экспорт из текущего проекта

1. Открыть Lovable Cloud Dashboard (кликнуть "View Backend")
2. Перейти в Authentication → Users
3. Внизу страницы кликнуть "Download users" или использовать SQL

**Альтернатива - SQL запрос**:
```sql
-- ВНИМАНИЕ: Этот запрос работает только с правами SUPERUSER
-- Запускать в SQL Editor текущего проекта
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  role,
  last_sign_in_at
FROM auth.users
ORDER BY created_at;
```

Сохранить результат в CSV или JSON файл: `users_export.csv`

#### Шаг 2: Подготовка данных

Важные поля для сохранения:
- `id` (UUID) - КРИТИЧНО! Используется как foreign key в profiles и других таблицах
- `email` - email пользователя
- `encrypted_password` - хешированный пароль
- `email_confirmed_at` - дата подтверждения email
- `raw_user_meta_data` - метаданные (имя, тип пользователя и т.д.)
- `created_at` - дата регистрации
- `updated_at` - дата последнего обновления

#### Шаг 3: Импорт в новый проект

**Метод 1: Через Supabase Dashboard (Рекомендуется)**

1. Открыть новый Supabase проект
2. Authentication → Users → "Add user" → "Bulk import"
3. Загрузить CSV файл

**Метод 2: Через Supabase Management API**

```bash
# Установить Supabase CLI
npm install -g supabase

# Импортировать пользователей
supabase users import users_export.csv --project-ref YOUR_NEW_PROJECT_ID
```

**Метод 3: Через SQL (Сложный, но сохраняет пароли)**

⚠️ **ОСТОРОЖНО**: Этот метод требует прямого доступа к БД и может нарушить безопасность если сделан неправильно.

```sql
-- ТОЛЬКО для продвинутых пользователей!
-- Вставить пользователей напрямую в auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  role
)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000000'::uuid as instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  role
FROM imported_users_temp;
```

### ⚠️ Критические моменты при переносе пользователей

1. **UUID пользователей ДОЛЖНЫ остаться теми же**
   - Иначе сломаются все связи с profiles, places, user_roles и т.д.

2. **Пароли**
   - Если переносить через Supabase Dashboard/API, пользователям нужно будет сбросить пароли
   - Если переносить через SQL, пароли сохранятся (но это сложнее и опаснее)

3. **Email confirmation**
   - Проверить что `email_confirmed_at` перенесен
   - Иначе пользователи не смогут войти

4. **Метаданные**
   - `raw_user_meta_data` содержит user_type, country_id, city_id
   - Эти данные нужны для триггера `handle_new_user()`

---

## Часть 2: Экспорт данных приложения

### Таблицы для экспорта

**Справочники** (экспортировать первыми):
1. `countries`
2. `cities`
3. `categories`
4. `subscription_plans`

**Основные данные**:
5. `profiles`
6. `user_roles`
7. `places`
8. `tours`
9. `tour_places`
10. `purchased_tours`
11. `user_places` (wishlist)
12. `credit_transactions`
13. `user_subscriptions`

**Статистика и уведомления**:
14. `page_views`
15. `share_statistics`
16. `push_subscriptions`
17. `scheduled_notifications`
18. `notification_statistics`

**Контент**:
19. `email_templates`
20. `donation_content`

### Метод экспорта через SQL

Создать файл `export_all_data.sql`:

```sql
-- ============================================
-- ЭКСПОРТ ВСЕХ ДАННЫХ
-- ============================================
-- Запускать в SQL Editor текущего Lovable Cloud проекта
-- Сохранять каждый результат в отдельный CSV файл
-- ============================================

-- 1. Countries
COPY (SELECT * FROM public.countries ORDER BY created_at) 
TO '/tmp/countries.csv' WITH CSV HEADER;

-- 2. Cities
COPY (SELECT * FROM public.cities ORDER BY created_at) 
TO '/tmp/cities.csv' WITH CSV HEADER;

-- 3. Categories
COPY (SELECT * FROM public.categories ORDER BY display_order, created_at) 
TO '/tmp/categories.csv' WITH CSV HEADER;

-- 4. Subscription Plans
COPY (SELECT * FROM public.subscription_plans ORDER BY created_at) 
TO '/tmp/subscription_plans.csv' WITH CSV HEADER;

-- 5. Profiles
COPY (SELECT * FROM public.profiles ORDER BY created_at) 
TO '/tmp/profiles.csv' WITH CSV HEADER;

-- 6. User Roles
COPY (SELECT * FROM public.user_roles ORDER BY created_at) 
TO '/tmp/user_roles.csv' WITH CSV HEADER;

-- 7. Places
COPY (SELECT * FROM public.places ORDER BY created_at) 
TO '/tmp/places.csv' WITH CSV HEADER;

-- 8. Tours
COPY (SELECT * FROM public.tours ORDER BY display_order, created_at) 
TO '/tmp/tours.csv' WITH CSV HEADER;

-- 9. Tour Places
COPY (SELECT * FROM public.tour_places ORDER BY tour_id, display_order) 
TO '/tmp/tour_places.csv' WITH CSV HEADER;

-- 10. Purchased Tours
COPY (SELECT * FROM public.purchased_tours ORDER BY purchased_at) 
TO '/tmp/purchased_tours.csv' WITH CSV HEADER;

-- 11. User Places (Wishlist)
COPY (SELECT * FROM public.user_places ORDER BY created_at) 
TO '/tmp/user_places.csv' WITH CSV HEADER;

-- 12. Credit Transactions
COPY (SELECT * FROM public.credit_transactions ORDER BY created_at) 
TO '/tmp/credit_transactions.csv' WITH CSV HEADER;

-- 13. User Subscriptions
COPY (SELECT * FROM public.user_subscriptions ORDER BY started_at) 
TO '/tmp/user_subscriptions.csv' WITH CSV HEADER;

-- 14. Page Views
COPY (SELECT * FROM public.page_views ORDER BY viewed_at) 
TO '/tmp/page_views.csv' WITH CSV HEADER;

-- 15. Share Statistics
COPY (SELECT * FROM public.share_statistics ORDER BY shared_at) 
TO '/tmp/share_statistics.csv' WITH CSV HEADER;

-- 16. Push Subscriptions
COPY (SELECT * FROM public.push_subscriptions ORDER BY created_at) 
TO '/tmp/push_subscriptions.csv' WITH CSV HEADER;

-- 17. Scheduled Notifications
COPY (SELECT * FROM public.scheduled_notifications ORDER BY scheduled_for) 
TO '/tmp/scheduled_notifications.csv' WITH CSV HEADER;

-- 18. Notification Statistics
COPY (SELECT * FROM public.notification_statistics ORDER BY sent_at) 
TO '/tmp/notification_statistics.csv' WITH CSV HEADER;

-- 19. Email Templates
COPY (SELECT * FROM public.email_templates ORDER BY template_type) 
TO '/tmp/email_templates.csv' WITH CSV HEADER;

-- 20. Donation Content
COPY (SELECT * FROM public.donation_content ORDER BY created_at) 
TO '/tmp/donation_content.csv' WITH CSV HEADER;
```

### Альтернативный метод: Export через Supabase Dashboard

1. Открыть Table Editor
2. Выбрать таблицу
3. Кликнуть на "..." (три точки)
4. Выбрать "Download as CSV"
5. Повторить для каждой таблицы

---

## Часть 3: Импорт данных в новый проект

### Порядок импорта (СТРОГО СОБЛЮДАТЬ!)

1. **Справочники** (нет foreign keys):
   - countries
   - categories

2. **Зависимые справочники**:
   - cities (зависит от countries)
   - subscription_plans

3. **Пользователи** (ВАЖНО: после импорта auth.users):
   - profiles (зависит от auth.users)
   - user_roles (зависит от auth.users)

4. **Основные данные**:
   - places (зависит от cities, categories, profiles)
   - tours (зависит от cities)

5. **Связи**:
   - tour_places (зависит от tours, places)

6. **Пользовательские данные**:
   - purchased_tours (зависит от users, tours)
   - user_places (зависит от users, places)
   - credit_transactions (зависит от users)
   - user_subscriptions (зависит от users, subscription_plans, places)

7. **Статистика**:
   - page_views (зависит от places)
   - share_statistics (зависит от places)
   - push_subscriptions (зависит от users)

8. **Уведомления**:
   - scheduled_notifications
   - notification_statistics

9. **Контент**:
   - email_templates
   - donation_content

### Методы импорта

#### Метод 1: SQL COPY (Быстрый)

```sql
-- Импорт Countries
COPY public.countries FROM '/path/to/countries.csv' WITH CSV HEADER;

-- Импорт Cities
COPY public.cities FROM '/path/to/cities.csv' WITH CSV HEADER;

-- И так далее для каждой таблицы...
```

#### Метод 2: SQL INSERT (Универсальный)

```sql
-- Импорт Countries
INSERT INTO public.countries (id, code, name_sr, name_ru, name_en, created_at)
VALUES
  ('uuid-1', 'RS', 'Србија', 'Сербия', 'Serbia', '2024-01-01 00:00:00'),
  ('uuid-2', 'RU', 'Русија', 'Россия', 'Russia', '2024-01-01 00:00:00'),
  -- и т.д.
ON CONFLICT (id) DO NOTHING;
```

#### Метод 3: Через Supabase Dashboard Table Editor

1. Открыть таблицу в Table Editor
2. Кликнуть "Insert" → "Insert row"
3. Заполнить данные вручную (для небольших объемов)

#### Метод 4: Через Supabase CLI

```bash
# Импорт CSV в таблицу
supabase db import countries.csv --table countries
```

---

## Часть 4: Экспорт файлов из Storage

### Storage Buckets

Проект использует 2 публичных bucket:
1. `tour-images` - изображения для туров
2. `tour-guide-images` - изображения для гайдов

### Экспорт файлов

**Метод 1: Через Supabase CLI**

```bash
# Скачать все файлы из bucket
supabase storage download tour-images --recursive --output ./storage-export/tour-images/
supabase storage download tour-guide-images --recursive --output ./storage-export/tour-guide-images/
```

**Метод 2: Через Supabase Dashboard**

1. Storage → выбрать bucket
2. Для каждого файла: кликнуть "..." → Download
3. Повторить для всех файлов

**Метод 3: Через API (скрипт)**

Создать `export_storage.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'YOUR_CURRENT_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY'
);

async function downloadBucket(bucketName, outputDir) {
  const { data: files, error } = await supabase.storage
    .from(bucketName)
    .list();

  if (error) {
    console.error(`Error listing files in ${bucketName}:`, error);
    return;
  }

  for (const file of files) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(file.name);

    if (error) {
      console.error(`Error downloading ${file.name}:`, error);
      continue;
    }

    const filePath = path.join(outputDir, file.name);
    fs.writeFileSync(filePath, Buffer.from(await data.arrayBuffer()));
    console.log(`Downloaded: ${file.name}`);
  }
}

// Создать директории
fs.mkdirSync('./storage-export/tour-images', { recursive: true });
fs.mkdirSync('./storage-export/tour-guide-images', { recursive: true });

// Скачать файлы
downloadBucket('tour-images', './storage-export/tour-images');
downloadBucket('tour-guide-images', './storage-export/tour-guide-images');
```

### Импорт файлов в новый проект

**Метод 1: Через Supabase CLI**

```bash
# Загрузить все файлы в bucket
supabase storage upload tour-images ./storage-export/tour-images/* --recursive
supabase storage upload tour-guide-images ./storage-export/tour-guide-images/* --recursive
```

**Метод 2: Через Dashboard**

1. Storage → выбрать bucket
2. Кликнуть "Upload files"
3. Выбрать файлы для загрузки

**Метод 3: Через API (скрипт)**

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'YOUR_NEW_SUPABASE_URL',
  'YOUR_NEW_SERVICE_ROLE_KEY'
);

async function uploadBucket(bucketName, inputDir) {
  const files = fs.readdirSync(inputDir);

  for (const fileName of files) {
    const filePath = path.join(inputDir, fileName);
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg', // Adjust based on file type
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error);
      continue;
    }

    console.log(`Uploaded: ${fileName}`);
  }
}

uploadBucket('tour-images', './storage-export/tour-images');
uploadBucket('tour-guide-images', './storage-export/tour-guide-images');
```

---

## Часть 5: Проверка успешности миграции

### Checklist проверки данных

- [ ] Все пользователи из auth.users перенесены (проверить count)
- [ ] UUID пользователей совпадают с оригинальными
- [ ] Все profiles созданы и привязаны к пользователям
- [ ] Все user_roles перенесены (особенно admin)
- [ ] Все places перенесены с корректными owner_id
- [ ] Все tours и tour_places перенесены
- [ ] Все wishlist (user_places) перенесены
- [ ] Все subscriptions перенесены и active
- [ ] Все файлы из storage перенесены
- [ ] Email templates заполнены
- [ ] Donation content заполнен

### SQL запросы для проверки

```sql
-- Проверка количества записей в каждой таблице
SELECT 
  'auth.users' as table_name, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles
UNION ALL
SELECT 'places', COUNT(*) FROM public.places
UNION ALL
SELECT 'tours', COUNT(*) FROM public.tours
UNION ALL
SELECT 'tour_places', COUNT(*) FROM public.tour_places
UNION ALL
SELECT 'purchased_tours', COUNT(*) FROM public.purchased_tours
UNION ALL
SELECT 'user_places', COUNT(*) FROM public.user_places
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM public.credit_transactions
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM public.user_subscriptions
ORDER BY table_name;

-- Проверка что у всех profiles есть пользователи в auth.users
SELECT COUNT(*) as orphaned_profiles
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);
-- Должно быть 0!

-- Проверка что у всех places есть владельцы
SELECT COUNT(*) as orphaned_places
FROM public.places p
WHERE owner_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles pr WHERE pr.id = p.owner_id
  );
-- Должно быть 0!

-- Проверка активных подписок
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE is_active = true) as active_subscriptions,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_subscriptions
FROM public.user_subscriptions;

-- Проверка storage files
SELECT 
  bucket_id,
  COUNT(*) as files_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

---

## Troubleshooting

### Проблема: UUID conflicts при импорте

**Причина**: UUID уже существуют в новой БД

**Решение**: Использовать `ON CONFLICT (id) DO NOTHING` в INSERT запросах

### Проблема: Foreign key violations

**Причина**: Неправильный порядок импорта

**Решение**: 
1. Временно отключить foreign key checks:
```sql
ALTER TABLE table_name DISABLE TRIGGER ALL;
-- Импорт данных
ALTER TABLE table_name ENABLE TRIGGER ALL;
```

2. Или соблюдать правильный порядок импорта (см. выше)

### Проблема: Пользователи не могут войти после миграции

**Причина**: Пароли не перенесены или email не подтвержден

**Решение**:
1. Если пароли не перенесены - пользователям нужно сбросить пароли
2. Проверить `email_confirmed_at` не NULL:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

### Проблема: Триггеры не работают после импорта

**Причина**: Триггеры срабатывают на INSERT и могут конфликтовать

**Решение**: Временно отключить триггеры при импорте:
```sql
ALTER TABLE profiles DISABLE TRIGGER ALL;
-- Импорт
ALTER TABLE profiles ENABLE TRIGGER ALL;
```

### Проблема: Storage files не загружаются

**Причина**: Bucket политики не настроены или bucket не создан

**Решение**:
1. Создать buckets (см. `system/storage-buckets.sql`)
2. Применить RLS policies (см. `rls-policies/12-storage-policies.sql`)
3. Проверить что bucket публичный (если нужно)

---

## Итоговый чеклист переноса данных

- [ ] Экспортировать auth.users из текущего проекта
- [ ] Экспортировать все таблицы в CSV
- [ ] Экспортировать файлы из storage
- [ ] Создать новый Supabase проект
- [ ] Применить schema.sql
- [ ] Применить RLS policies
- [ ] Создать storage buckets
- [ ] Импортировать auth.users (ВАЖНО: сохранить UUID!)
- [ ] Импортировать таблицы в правильном порядке
- [ ] Импортировать файлы в storage
- [ ] Проверить целостность данных (запросы выше)
- [ ] Проверить что пользователи могут войти
- [ ] Проверить что данные отображаются корректно
- [ ] Проверить что файлы загружаются из storage
