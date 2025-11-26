# 🚀 Инструкция по развёртыванию проекта Retro City Map

## 📋 Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Создание Supabase проекта](#создание-supabase-проекта)
3. [Настройка базы данных](#настройка-базы-данных)
4. [Настройка Storage](#настройка-storage)
5. [Настройка Authentication](#настройка-authentication)
6. [Развёртывание Edge Functions](#развёртывание-edge-functions)
7. [Настройка секретов](#настройка-секретов)
8. [Настройка фронтенда](#настройка-фронтенда)
9. [Финальная проверка](#финальная-проверка)
10. [Troubleshooting](#troubleshooting)

---

## 1. Предварительные требования

### Необходимые инструменты:
- Node.js 18+
- npm или bun
- Git
- Supabase CLI (`npm install -g supabase`)
- Аккаунт Supabase (https://supabase.com)

### Необходимые API ключи (получить заранее):
- **Brevo API Key** (https://app.brevo.com/settings/keys/api)
  - Для отправки email-уведомлений
  - Нужно подтвердить домен отправителя
- **VAPID Keys** (Web Push)
  - Будут сгенерированы автоматически при настройке
- **Lovable API Key** (для AI переводов)
  - Опционально, если используете AI-функции

---

## 2. Создание Supabase проекта

### 2.1 Создать новый проект
```bash
# Войти в Supabase
supabase login

# Создать проект через Dashboard
# https://supabase.com/dashboard
# - Название: retro-city-map
# - Регион: выбрать ближайший к пользователям
# - Database Password: сохранить надёжно!
```

### 2.2 Получить учётные данные
В Dashboard → Settings → API получить:
- `PROJECT_URL` (например: https://xxx.supabase.co)
- `ANON_KEY` (публичный ключ)
- `SERVICE_ROLE_KEY` (секретный ключ)

### 2.3 Инициализировать локальный проект
```bash
supabase init
supabase link --project-ref YOUR_PROJECT_ID
```

---

## 3. Настройка базы данных

### ⚠️ ВАЖНО: Порядок применения миграций критичен!

### 3.1 Применить структуру базы данных

**Вариант A: Через SQL Editor в Dashboard**
```bash
# Открыть Dashboard → SQL Editor
# Скопировать и выполнить файлы в указанном порядке:

1. schema.sql (полная структура)
```

**Вариант B: Через CLI (предпочтительно)**
```bash
# Применить все миграции по порядку
supabase db push

# Если используете файлы миграций:
for file in migrations/*.sql; do
  supabase db execute --file "$file"
done
```

### 3.2 Проверить применение миграций
```bash
# Проверить список таблиц
supabase db list

# Или через psql
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres" \
  -c "\dt public.*"
```

### 3.3 Применить RLS политики
```bash
# Применить все политики из rls-policies/
cd rls-policies
for file in *.sql; do
  supabase db execute --file "$file"
done
```

### 3.4 Создать первого администратора
```sql
-- В SQL Editor выполнить:
-- Заменить 'admin@example.com' на реальный email админа
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('qwe@qwe.qwe', crypt('your-password', gen_salt('bf')), now());

-- Получить ID созданного пользователя
SELECT id FROM auth.users WHERE email = 'qwe@qwe.qwe';

-- Назначить роль админа (заменить USER_ID)
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID', 'admin');
```

---

## 4. Настройка Storage

### 4.1 Создать buckets
```bash
# Через Dashboard → Storage или SQL:
cd storage_export

# Применить конфигурацию
supabase db execute --file storage-setup.sql
```

SQL для создания buckets:
```sql
-- Создать tour-images bucket (публичный)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true);

-- Создать tour-guide-images bucket (публичный)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-guide-images', 'tour-guide-images', true);
```

### 4.2 Применить политики Storage
```bash
supabase db execute --file rls-policies/storage-policies.sql
```

### 4.3 Загрузить существующие файлы (если есть)
```bash
# Использовать Supabase CLI или Dashboard
cd storage_export/tour-images
supabase storage cp ./* tour-images --recursive

cd ../tour-guide-images
supabase storage cp ./* tour-guide-images --recursive
```

---

## 5. Настройка Authentication

### 5.1 Включить провайдеры
Dashboard → Authentication → Providers:
- ✅ Email (включить обязательно)
- ❌ Confirm email (отключить для разработки, включить в продакшене)

### 5.2 Настроить Email Templates
Dashboard → Authentication → Email Templates

**Применить шаблоны из** `auth-config/email-templates/`:
- `confirm-signup.html` → Confirm signup
- `invite-user.html` → Invite user
- `magic-link.html` → Magic Link
- `change-email.html` → Change Email Address
- `reset-password.html` → Reset Password

### 5.3 Настроить SMTP (Brevo)
Dashboard → Settings → Auth → SMTP Settings:
```
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
SMTP Username: [ваш email из Brevo]
SMTP Password: [BREVO_API_KEY]
Sender Email: [подтверждённый email]
Sender Name: Retro City Map
```

### 5.4 Настроить Auth Hooks
Dashboard → Database → Functions

Создать и настроить:
```sql
-- Trigger для отправки кастомных email
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
    url := 'https://YOUR_PROJECT_URL/functions/v1/send-custom-email',
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
        'site_url', 'YOUR_SITE_URL'
      )
    )
  );
END;
$$;
```

### 5.5 Настроить Redirect URLs
Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.com`
- Redirect URLs:
  - `http://localhost:5173/**`
  - `https://your-domain.com/**`

---

## 6. Развёртывание Edge Functions

### 6.1 Настроить конфигурацию
```bash
# Скопировать config.toml
cp edge-functions/config.toml supabase/config.toml

# Обновить project_id на свой
sed -i 's/project_id = ".*"/project_id = "YOUR_PROJECT_ID"/' supabase/config.toml
```

### 6.2 Установить зависимости
```bash
# Если используются npm пакеты в функциях
cd edge-functions
npm install
```

### 6.3 Развернуть все функции
```bash
# Развернуть все функции сразу
supabase functions deploy

# Или по одной:
supabase functions deploy add-place
supabase functions deploy purchase-tour
supabase functions deploy toggle-premium
supabase functions deploy add-place-with-subscription
supabase functions deploy translate-text
supabase functions deploy send-custom-email
supabase functions deploy send-push-notification
supabase functions deploy get-vapid-key
supabase functions deploy notify-new-place-webhook
supabase functions deploy process-scheduled-notifications
supabase functions deploy process-subscriptions
```

### 6.4 Проверить развёртывание
```bash
# Список развёрнутых функций
supabase functions list

# Логи функции
supabase functions logs add-place
```

---

## 7. Настройка секретов

### 7.1 Установить секреты через CLI
```bash
# Все секреты из secrets/secrets.env
supabase secrets set BREVO_API_KEY="your-brevo-key"
supabase secrets set VAPID_PUBLIC_KEY="generated-vapid-public"
supabase secrets set VAPID_PRIVATE_KEY="generated-vapid-private"
supabase secrets set WEBHOOK_SECRET="$(openssl rand -hex 32)"
supabase secrets set LOVABLE_API_KEY="your-lovable-key"
```

### 7.2 Сгенерировать VAPID ключи
```bash
# Установить web-push
npm install -g web-push

# Сгенерировать ключи
web-push generate-vapid-keys

# Скопировать вывод в секреты
supabase secrets set VAPID_PUBLIC_KEY="..."
supabase secrets set VAPID_PRIVATE_KEY="..."
```

### 7.3 Установить системные переменные
```bash
# Эти устанавливаются автоматически Supabase:
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# SUPABASE_DB_URL
# SUPABASE_PUBLISHABLE_KEY

# Проверить все секреты
supabase secrets list
```

---

## 8. Настройка фронтенда

### 8.1 Обновить .env файл
```bash
# Создать .env в корне проекта
cat > .env << EOF
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
EOF
```

### 8.2 Обновить конфигурацию в коде
```typescript
// src/integrations/supabase/client.ts должен использовать:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
```

### 8.3 Установить зависимости
```bash
npm install
# или
bun install
```

### 8.4 Запустить локально
```bash
npm run dev
```

---

## 9. Настройка CRON jobs

### 9.1 Включить pg_cron расширение
```sql
-- В SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 9.2 Настроить CRON для обработки подписок
```sql
-- Каждые 6 часов обрабатывать подписки
SELECT cron.schedule(
  'process-subscriptions',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_URL/functions/v1/process-subscriptions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### 9.3 Настроить CRON для запланированных уведомлений
```sql
-- Каждые 5 минут проверять запланированные уведомления
SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_URL/functions/v1/process-scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### 9.4 Проверить CRON jobs
```sql
-- Список всех CRON jobs
SELECT * FROM cron.job;

-- Логи выполнения
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 10. Финальная проверка

### 10.1 Проверить базу данных
```bash
# Подключиться к БД
psql "postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

# Проверить таблицы
\dt public.*

# Проверить RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

# Проверить функции
\df public.*
```

### 10.2 Проверить Edge Functions
```bash
# Тест каждой функции
curl -X POST https://YOUR_PROJECT_URL/functions/v1/get-vapid-key

# С авторизацией
curl -X POST https://YOUR_PROJECT_URL/functions/v1/translate-text \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","targetLanguage":"ru"}'
```

### 10.3 Проверить Storage
```bash
# Список buckets
supabase storage list

# Проверить доступ
curl https://YOUR_PROJECT_URL/storage/v1/object/public/tour-images/test.jpg
```

### 10.4 Проверить Authentication
```bash
# Тест регистрации
curl -X POST https://YOUR_PROJECT_URL/auth/v1/signup \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}'
```

### 10.5 Чек-лист перед запуском в продакшн
- [ ] Все миграции применены
- [ ] RLS политики установлены на всех таблицах
- [ ] Storage buckets созданы и настроены
- [ ] Edge функции развёрнуты и работают
- [ ] Секреты установлены
- [ ] SMTP настроен и проверен
- [ ] Email шаблоны настроены
- [ ] CRON jobs настроены
- [ ] Администратор создан
- [ ] Фронтенд подключен к новому Supabase
- [ ] VAPID ключи сгенерированы
- [ ] Redirect URLs настроены
- [ ] Webhook secret установлен

---

## 11. Troubleshooting

### Проблема: Миграции не применяются
```bash
# Проверить статус миграций
supabase migration list

# Применить конкретную миграцию
supabase db execute --file migrations/XXXXXX_name.sql

# Откатить последнюю миграцию
supabase db reset
```

### Проблема: Edge функция возвращает ошибку
```bash
# Проверить логи
supabase functions logs FUNCTION_NAME --limit 50

# Проверить секреты
supabase secrets list

# Локальное тестирование
supabase functions serve FUNCTION_NAME
```

### Проблема: RLS блокирует доступ
```sql
-- Проверить политики таблицы
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Временно отключить RLS для теста (НЕ в продакшене!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Включить обратно
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### Проблема: Email не отправляются
- Проверить SMTP настройки в Dashboard
- Проверить что домен подтверждён в Brevo
- Проверить BREVO_API_KEY секрет
- Проверить логи edge функции send-custom-email

### Проблема: Storage файлы недоступны
```sql
-- Проверить что bucket публичный
SELECT * FROM storage.buckets WHERE id = 'tour-images';

-- Проверить политики
SELECT * FROM storage.objects WHERE bucket_id = 'tour-images';
```

### Проблема: CRON jobs не запускаются
```sql
-- Проверить что pg_cron включён
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Проверить расписание
SELECT * FROM cron.job;

-- Проверить логи
SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
```

---

## 📞 Поддержка

При возникновении проблем:
1. Проверить логи в Supabase Dashboard
2. Использовать Supabase Discord: https://discord.supabase.com
3. Документация: https://supabase.com/docs

---

## 📝 Важные замечания

1. **Безопасность:**
   - НИКОГДА не коммитить .env файлы
   - SERVICE_ROLE_KEY держать в секрете
   - Включить RLS на всех таблицах

2. **Производительность:**
   - Настроить connection pooling для высоких нагрузок
   - Использовать индексы на часто запрашиваемые колонки
   - Мониторить размер БД

3. **Бэкапы:**
   - Настроить автоматические бэкапы в Supabase
   - Периодически делать ручные экспорты
   - Хранить бэкапы отдельно от основного проекта

4. **Масштабирование:**
   - Начать с минимального плана
   - Мониторить метрики использования
   - Увеличивать ресурсы по мере роста