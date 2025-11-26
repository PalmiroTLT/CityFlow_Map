# 🗄️ Документация базы данных

## Обзор

База данных использует PostgreSQL через Supabase с полной защитой Row Level Security (RLS).

---

## 📊 Схема базы данных

### ERD (Entity Relationship Diagram)

```
┌─────────────┐         ┌──────────────┐
│  countries  │────1:N──│    cities    │
└─────────────┘         └──────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  profiles   │────1:N──│    places    │────N:1──│  categories  │
└─────────────┘         └──────────────┘         └──────────────┘
      │                       │
      │ 1:N                   │ N:M
      │                       ▼
      │                 ┌──────────────┐
      │                 │ tour_places  │
      │                 └──────────────┘
      │                       │
      │                       │ N:1
      │                       ▼
      │                 ┌──────────────┐
      └────────────────▶│    tours     │◀────┐
                        └──────────────┘     │
                              │              │
                              │ 1:N          │ N:1
                              ▼              │
                        ┌──────────────┐     │
                        │purchased_tours────┘
                        └──────────────┘

┌─────────────┐         ┌──────────────┐
│  profiles   │────1:N──│ user_roles   │
└─────────────┘         └──────────────┘
      │
      │ 1:N
      ▼
┌─────────────────────┐
│ credit_transactions │
└─────────────────────┘
```

---

## 📋 Таблицы

### countries (Страны)

Справочник стран.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| code | text | NO | - | Код страны (ISO 3166-1 alpha-2) |
| name_sr | text | NO | - | Название на сербском |
| name_ru | text | NO | - | Название на русском |
| name_en | text | NO | - | Название на английском |
| created_at | timestamptz | NO | now() | Дата создания |

**Ключи:**
- PRIMARY KEY: id
- UNIQUE: code

**RLS Политики:**
- SELECT: public (все могут читать)

---

### cities (Города)

Справочник городов.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| country_id | uuid | NO | - | Ссылка на страну |
| name_sr | text | NO | - | Название на сербском |
| name_ru | text | NO | - | Название на русском |
| name_en | text | NO | - | Название на английском |
| latitude | float8 | NO | - | Широта центра города |
| longitude | float8 | NO | - | Долгота центра города |
| zoom_level | int4 | NO | 13 | Уровень зума карты по умолчанию |
| created_at | timestamptz | NO | now() | Дата создания |

**Ключи:**
- PRIMARY KEY: id
- FOREIGN KEY: country_id → countries(id)

**RLS Политики:**
- SELECT: public (все могут читать)

---

### profiles (Профили пользователей)

Расширенная информация о пользователях.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | - | ID из auth.users |
| email | text | NO | - | Email пользователя |
| full_name | text | YES | NULL | Полное имя |
| user_type | user_type | YES | NULL | Тип: individual / business |
| credits | int4 | NO | 0 | Количество кредитов |
| country_id | uuid | YES | NULL | Страна пользователя |
| city_id | uuid | YES | NULL | Город пользователя |
| language | text | YES | 'sr' | Язык интерфейса |
| created_at | timestamptz | NO | now() | Дата регистрации |
| updated_at | timestamptz | NO | now() | Дата обновления |

**Ключи:**
- PRIMARY KEY: id
- FOREIGN KEY: id → auth.users(id) ON DELETE CASCADE
- FOREIGN KEY: country_id → countries(id)
- FOREIGN KEY: city_id → cities(id)

**RLS Политики:**
- SELECT: auth.uid() = id OR has_role(auth.uid(), 'admin')
- UPDATE: auth.uid() = id

**Триггеры:**
- update_updated_at_column (BEFORE UPDATE)

**Enum user_type:**
- individual
- business

---

### user_roles (Роли пользователей)

Система ролей для контроля доступа.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| user_id | uuid | NO | - | ID пользователя |
| role | app_role | NO | - | Роль пользователя |
| created_at | timestamptz | NO | now() | Дата назначения роли |

**Ключи:**
- PRIMARY KEY: id
- UNIQUE: (user_id, role)
- FOREIGN KEY: user_id → auth.users(id) ON DELETE CASCADE

**RLS Политики:**
- SELECT: auth.uid() = user_id OR has_role(auth.uid(), 'admin')
- ALL: has_role(auth.uid(), 'admin')

**Enum app_role:**
- admin
- user

---

### categories (Категории мест)

Классификация мест на карте.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| name | text | NO | - | Название по умолчанию |
| name_sr | text | YES | NULL | Название на сербском |
| name_ru | text | YES | NULL | Название на русском |
| name_en | text | YES | NULL | Название на английском |
| color | text | NO | '#3B82F6' | Цвет маркера (HEX) |
| icon | text | YES | NULL | Иконка категории |
| display_order | int4 | YES | 0 | Порядок отображения |
| created_at | timestamptz | NO | now() | Дата создания |
| updated_at | timestamptz | NO | now() | Дата обновления |

**Ключи:**
- PRIMARY KEY: id

**RLS Политики:**
- SELECT: public (все могут читать)
- ALL: has_role(auth.uid(), 'admin')

**Триггеры:**
- update_updated_at_column (BEFORE UPDATE)

---

### places (Места)

Места на карте.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| owner_id | uuid | YES | NULL | Владелец места (для бизнеса) |
| category_id | uuid | YES | NULL | Категория места |
| city_id | uuid | YES | NULL | Город |
| name | text | NO | - | Название места |
| name_en | text | YES | NULL | Название на английском |
| description | text | YES | NULL | Описание |
| description_en | text | YES | NULL | Описание на английском |
| address | text | YES | NULL | Адрес |
| latitude | float8 | NO | - | Широта |
| longitude | float8 | NO | - | Долгота |
| is_premium | bool | YES | false | Премиум статус |
| has_custom_page | bool | YES | false | Есть кастомная страница |
| custom_page_content | jsonb | YES | NULL | Контент кастомной страницы |
| image_url | text | YES | NULL | URL изображения |
| google_maps_url | text | YES | NULL | Ссылка на Google Maps |
| custom_button_text | text | YES | NULL | Текст кастомной кнопки |
| custom_button_url | text | YES | NULL | URL кастомной кнопки |
| created_at | timestamptz | NO | now() | Дата создания |
| updated_at | timestamptz | NO | now() | Дата обновления |

**Ключи:**
- PRIMARY KEY: id
- FOREIGN KEY: owner_id → auth.users(id)
- FOREIGN KEY: category_id → categories(id)
- FOREIGN KEY: city_id → cities(id)

**Индексы:**
- idx_places_category (category_id)
- idx_places_city (city_id)
- idx_places_owner (owner_id)
- idx_places_location (latitude, longitude)

**RLS Политики:**
- SELECT: public (все могут читать)
- INSERT: auth.uid() = owner_id AND user_type = 'business'
- UPDATE: auth.uid() = owner_id OR has_role(auth.uid(), 'admin')
- DELETE: auth.uid() = owner_id OR has_role(auth.uid(), 'admin')

**Триггеры:**
- update_updated_at_column (BEFORE UPDATE)

---

### tours (Туры)

Организованные туры по городу.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| city_id | uuid | YES | NULL | Город тура |
| name | text | NO | - | Название тура |
| name_en | text | YES | NULL | Название на английском |
| description | text | YES | NULL | Описание |
| description_en | text | YES | NULL | Описание на английском |
| price | numeric | YES | 0 | Цена в кредитах |
| is_active | bool | YES | true | Активность тура |
| display_order | int4 | YES | 0 | Порядок отображения |
| created_at | timestamptz | NO | now() | Дата создания |
| updated_at | timestamptz | NO | now() | Дата обновления |

**Ключи:**
- PRIMARY KEY: id
- FOREIGN KEY: city_id → cities(id)

**Индексы:**
- idx_tours_city (city_id)
- idx_tours_active (is_active)

**RLS Политики:**
- SELECT: public (все могут читать)
- ALL: has_role(auth.uid(), 'admin')

**Триггеры:**
- update_updated_at_column (BEFORE UPDATE)

---

### tour_places (Места в туре)

Связь туров и мест.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| tour_id | uuid | NO | - | ID тура |
| place_id | uuid | NO | - | ID места |
| display_order | int4 | YES | 0 | Порядок в туре |
| created_at | timestamptz | NO | now() | Дата добавления |

**Ключи:**
- PRIMARY KEY: id
- UNIQUE: (tour_id, place_id)
- FOREIGN KEY: tour_id → tours(id) ON DELETE CASCADE
- FOREIGN KEY: place_id → places(id) ON DELETE CASCADE

**Индексы:**
- idx_tour_places_tour (tour_id)
- idx_tour_places_place (place_id)

**RLS Политики:**
- SELECT: public (все могут читать)
- ALL: has_role(auth.uid(), 'admin')

---

### purchased_tours (Купленные туры)

История покупок туров пользователями.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| user_id | uuid | NO | - | ID пользователя |
| tour_id | uuid | NO | - | ID тура |
| purchased_at | timestamptz | NO | now() | Дата покупки |

**Ключи:**
- PRIMARY KEY: id
- UNIQUE: (user_id, tour_id)
- FOREIGN KEY: user_id → auth.users(id) ON DELETE CASCADE
- FOREIGN KEY: tour_id → tours(id) ON DELETE CASCADE

**Индексы:**
- idx_purchased_tours_user (user_id)
- idx_purchased_tours_tour (tour_id)

**RLS Политики:**
- SELECT: auth.uid() = user_id
- INSERT: auth.uid() = user_id

---

### credit_transactions (Транзакции кредитов)

История операций с кредитами.

| Колонка | Тип | Nullable | Default | Описание |
|---------|-----|----------|---------|----------|
| id | uuid | NO | gen_random_uuid() | Уникальный идентификатор |
| user_id | uuid | NO | - | ID пользователя |
| amount | int4 | NO | - | Сумма (+ или -) |
| type | text | NO | - | Тип транзакции |
| description | text | YES | NULL | Описание |
| created_at | timestamptz | NO | now() | Дата транзакции |

**Ключи:**
- PRIMARY KEY: id
- FOREIGN KEY: user_id → auth.users(id)

**Индексы:**
- idx_credit_transactions_user (user_id)
- idx_credit_transactions_created (created_at DESC)

**RLS Политики:**
- SELECT: auth.uid() = user_id
- INSERT: false (только через Edge Functions)

**Типы транзакций:**
- `add_place` - Добавление места (-100)
- `toggle_premium` - Активация премиума (-500)
- `purchase_tour` - Покупка тура (-price)
- `admin_credit` - Пополнение админом (+amount)

---

## 🔧 Функции

### has_role(_user_id uuid, _role app_role)

Проверяет наличие роли у пользователя.

```sql
SELECT has_role(auth.uid(), 'admin'::app_role);
```

**Параметры:**
- `_user_id` - ID пользователя
- `_role` - Проверяемая роль

**Возвращает:** boolean

**Security:** DEFINER (выполняется с правами владельца)

---

### handle_new_user()

Триггер для автоматического создания профиля при регистрации.

**Действия:**
1. Создаёт запись в profiles
2. Назначает роль (admin для qwe@qwe.qwe, иначе user)

**Триггер:** ON auth.users AFTER INSERT

---

### update_updated_at_column()

Триггер для автоматического обновления поля updated_at.

**Триггеры на таблицах:**
- profiles
- categories
- places
- tours

---

## 🔒 Политики безопасности

### Уровни доступа

| Таблица | Чтение | Создание | Изменение | Удаление |
|---------|--------|----------|-----------|----------|
| countries | ✅ Все | ❌ | ❌ | ❌ |
| cities | ✅ Все | ❌ | ❌ | ❌ |
| profiles | 👤 Свой / 👑 Админ | ❌ | 👤 Свой | ❌ |
| user_roles | 👤 Свой / 👑 Админ | 👑 Админ | 👑 Админ | 👑 Админ |
| categories | ✅ Все | 👑 Админ | 👑 Админ | 👑 Админ |
| places | ✅ Все | 🏢 Бизнес | 👤 Владелец / 👑 Админ | 👤 Владелец / 👑 Админ |
| tours | ✅ Все | 👑 Админ | 👑 Админ | 👑 Админ |
| tour_places | ✅ Все | 👑 Админ | 👑 Админ | 👑 Админ |
| purchased_tours | 👤 Свои | 👤 Свои | ❌ | ❌ |
| credit_transactions | 👤 Свои | 🔧 Функции | ❌ | ❌ |

**Легенда:**
- ✅ Все - доступно всем
- 👤 Свой - только свои записи
- 👑 Админ - только администраторы
- 🏢 Бизнес - только бизнес-аккаунты
- 🔧 Функции - только через Edge Functions
- ❌ Запрещено

---

## 📊 Индексы производительности

### Критичные индексы

```sql
-- Поиск мест по категории
CREATE INDEX idx_places_category ON places(category_id);

-- Поиск мест по городу
CREATE INDEX idx_places_city ON places(city_id);

-- Поиск мест по владельцу
CREATE INDEX idx_places_owner ON places(owner_id);

-- Геопространственный поиск
CREATE INDEX idx_places_location ON places(latitude, longitude);

-- История транзакций
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- Купленные туры
CREATE INDEX idx_purchased_tours_user ON purchased_tours(user_id);
CREATE INDEX idx_purchased_tours_tour ON purchased_tours(tour_id);

-- Активные туры
CREATE INDEX idx_tours_active ON tours(is_active) WHERE is_active = true;
```

---

## 🔄 Миграции

Все изменения схемы должны выполняться через миграции:

```sql
-- Создайте файл: supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- Пример миграции
ALTER TABLE places ADD COLUMN rating NUMERIC(3,2);
CREATE INDEX idx_places_rating ON places(rating);
```

---

## 📈 Мониторинг

### Размер таблиц

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Неиспользуемые индексы

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 🚨 Частые проблемы

### RLS блокирует доступ

Проверьте политики:
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Проблемы с foreign keys

Проверьте существование связанных записей:
```sql
SELECT * FROM places WHERE city_id NOT IN (SELECT id FROM cities);
```

### Медленные запросы

Включите логирование медленных запросов:
```sql
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- 1 секунда
```