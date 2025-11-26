# 📡 API Contract - Retro City Map

## Обзор

Документ описывает все взаимодействия между фронтендом и бэкендом (Supabase).

---

## 🔐 Аутентификация

### Методы аутентификации

**1. Email/Password Sign Up**
```typescript
POST /auth/v1/signup
Headers:
  apikey: SUPABASE_ANON_KEY
  Content-Type: application/json

Body:
{
  email: string
  password: string
  options?: {
    data?: {
      full_name?: string
      user_type?: 'individual' | 'business'
      country_id?: string (uuid)
      city_id?: string (uuid)
    }
    emailRedirectTo?: string
  }
}

Response 200:
{
  user: User
  session: Session
}
```

**2. Email/Password Sign In**
```typescript
POST /auth/v1/token?grant_type=password
Headers:
  apikey: SUPABASE_ANON_KEY
  Content-Type: application/json

Body:
{
  email: string
  password: string
}

Response 200:
{
  access_token: string
  refresh_token: string
  user: User
}
```

**3. Sign Out**
```typescript
POST /auth/v1/logout
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}

Response 204: No Content
```

**4. Password Reset Request**
```typescript
POST /auth/v1/recover
Headers:
  apikey: SUPABASE_ANON_KEY
  Content-Type: application/json

Body:
{
  email: string
}

Response 200: OK
```

---

## 📊 Database Operations (via REST API)

### Countries

**GET /rest/v1/countries**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Content-Type: application/json

Response 200:
[
  {
    id: string (uuid)
    code: string
    name_en: string
    name_ru: string
    name_sr: string
    created_at: string (ISO8601)
  }
]
```

### Cities

**GET /rest/v1/cities**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY

Query params:
  select=*,countries(*)
  country_id=eq.{uuid}

Response 200:
[
  {
    id: string (uuid)
    country_id: string (uuid)
    name_en: string
    name_ru: string
    name_sr: string
    latitude: number
    longitude: number
    zoom_level: number
    created_at: string
  }
]
```

### Profiles

**GET /rest/v1/profiles (own profile)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}

Query params:
  select=*
  id=eq.{user_id}

Response 200:
{
  id: string (uuid)
  email: string
  full_name: string | null
  user_type: 'individual' | 'business' | null
  credits: number
  country_id: string | null
  city_id: string | null
  language: string
  created_at: string
  updated_at: string
}
```

**PATCH /rest/v1/profiles (update own profile)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Query params:
  id=eq.{user_id}

Body:
{
  full_name?: string
  language?: string
  country_id?: string
  city_id?: string
}

Response 200: Updated profile
```

### Categories

**GET /rest/v1/categories**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY

Query params:
  select=*
  order=display_order.asc

Response 200:
[
  {
    id: string (uuid)
    name: string
    name_en: string | null
    name_ru: string | null
    name_sr: string | null
    color: string (hex)
    icon: string | null
    display_order: number
    created_at: string
    updated_at: string
  }
]
```

### Places

**GET /rest/v1/places (list all visible places)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY

Query params:
  select=*,categories(*),cities(*)
  city_id=eq.{uuid}
  is_hidden=eq.false
  order=created_at.desc

Response 200:
[
  {
    id: string (uuid)
    owner_id: string | null
    category_id: string | null
    city_id: string | null
    name: string
    name_en: string | null
    name_sr: string | null
    description: string | null
    description_en: string | null
    description_sr: string | null
    address: string | null
    phone: string | null
    website: string | null
    latitude: number
    longitude: number
    is_premium: boolean
    premium_expires_at: string | null
    has_custom_page: boolean
    custom_page_content: object | null
    promotions: object | null
    image_url: string | null
    google_maps_url: string | null
    custom_button_text: string | null
    custom_button_url: string | null
    is_hidden: boolean
    created_at: string
    updated_at: string
    categories: Category | null
    cities: City | null
  }
]
```

**GET /rest/v1/places (single place)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY

Query params:
  select=*,categories(*),cities(*)
  id=eq.{uuid}

Response 200: Single place object
```

**POST /rest/v1/places (create place - via Edge Function)**
- See Edge Functions section below

**PATCH /rest/v1/places (update place)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Query params:
  id=eq.{uuid}

Body:
{
  name?: string
  description?: string
  address?: string
  phone?: string
  website?: string
  ... other updatable fields
}

Response 200: Updated place
```

**DELETE /rest/v1/places (delete place)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}

Query params:
  id=eq.{uuid}

Response 204: No Content
```

### Tours

**GET /rest/v1/tours**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY

Query params:
  select=*,cities(*)
  is_active=eq.true
  order=display_order.asc

Response 200:
[
  {
    id: string (uuid)
    city_id: string | null
    name: string
    name_en: string | null
    name_sr: string | null
    description: string | null
    description_en: string | null
    description_sr: string | null
    price: number
    is_active: boolean
    display_order: number
    image_url: string | null
    tour_content: object
    guide_content: object
    created_at: string
    updated_at: string
  }
]
```

**POST /rest/v1/purchased_tours (purchase tour - via Edge Function)**
- See Edge Functions section below

### Wishlist (user_places)

**GET /rest/v1/user_places (get user wishlist)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}

Query params:
  select=*,places(*)
  user_id=eq.{user_id}

Response 200:
[
  {
    id: string (uuid)
    user_id: string (uuid)
    place_id: string (uuid)
    created_at: string
    places: Place
  }
]
```

**POST /rest/v1/user_places (add to wishlist)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  place_id: string (uuid)
}

Response 201:
{
  id: string (uuid)
  user_id: string (uuid)
  place_id: string (uuid)
  created_at: string
}
```

**DELETE /rest/v1/user_places (remove from wishlist)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}

Query params:
  user_id=eq.{user_id}
  place_id=eq.{place_id}

Response 204: No Content
```

### Statistics

**POST /rest/v1/page_views (track page view)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT} (optional)
  Content-Type: application/json

Body:
{
  place_id: string (uuid)
  user_id?: string (uuid) // optional, for authenticated users
}

Response 201: OK
```

**POST /rest/v1/share_statistics (track share)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Content-Type: application/json

Body:
{
  place_id: string (uuid)
  platform: string // 'telegram', 'whatsapp', 'facebook', etc.
  user_id?: string (uuid) // optional
}

Response 201: OK
```

### Push Subscriptions

**POST /rest/v1/push_subscriptions (subscribe to push)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  endpoint: string
  p256dh: string
  auth: string
}

Response 201:
{
  id: string (uuid)
  user_id: string (uuid)
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
  updated_at: string
}
```

**DELETE /rest/v1/push_subscriptions (unsubscribe)**
```typescript
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}

Query params:
  endpoint=eq.{endpoint}

Response 204: No Content
```

---

## ⚡ Edge Functions

### add-place
Создаёт новое место (только для бизнес-аккаунтов).

```typescript
POST /functions/v1/add-place
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  name: string (required)
  name_en?: string
  name_sr?: string
  description?: string
  description_en?: string
  description_sr?: string
  latitude: number (required)
  longitude: number (required)
  category_id?: string (uuid)
  city_id?: string (uuid)
  address?: string
  phone?: string
  website?: string
  google_maps_url?: string
  image_url?: string
  custom_button_text?: string
  custom_button_url?: string
}

Response 200:
{
  id: string (uuid)
  name: string
  ... other place fields
}

Errors:
400 - Validation error
401 - Unauthorized
403 - Not business user / insufficient credits (15 credits required)
500 - Server error

Cost: 15 credits
```

### add-place-with-subscription
Создаёт место с автоматической подпиской.

```typescript
POST /functions/v1/add-place-with-subscription
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  ...same as add-place
  subscription_plan_id: string (uuid, required)
}

Response 200:
{
  place: Place
  subscription: UserSubscription
}

Errors:
400 - Validation error / plan not found
401 - Unauthorized
403 - Insufficient credits
500 - Server error

Cost: Plan price (varies)
```

### purchase-tour
Покупает тур за кредиты.

```typescript
POST /functions/v1/purchase-tour
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  tourId: string (uuid, required)
}

Response 200:
{
  success: true
  remainingCredits: number
}

Errors:
400 - Tour not found / already purchased
401 - Unauthorized
403 - Insufficient credits (10 credits required)
500 - Server error

Cost: 10 credits
```

### toggle-premium
Переключает премиум статус места.

```typescript
POST /functions/v1/toggle-premium
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  placeId: string (uuid, required)
  isPremium: boolean (required)
}

Response 200:
{
  success: true
  isPremium: boolean
  remainingCredits: number
}

Errors:
400 - Place not found
401 - Unauthorized
403 - Not owner / insufficient credits (8 credits required)
500 - Server error

Cost: 8 credits for activation (30 days)
```

### translate-text
Переводит текст с использованием AI.

```typescript
POST /functions/v1/translate-text
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  text: string (required)
  targetLanguage: 'en' | 'ru' | 'sr' (required)
}

Response 200:
{
  translatedText: string
}

Errors:
400 - Validation error
401 - Unauthorized
500 - Translation failed
```

### send-push-notification
Отправляет push-уведомление (только админ).

```typescript
POST /functions/v1/send-push-notification
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: application/json

Body:
{
  title: string (required)
  body: string (required)
  data?: object
  isTest?: boolean (default: false)
}

Response 200:
{
  success: true
  successfulCount: number
  failedCount: number
}

Errors:
401 - Unauthorized
403 - Not admin
500 - Send failed
```

### get-vapid-key
Получает публичный VAPID ключ для push-подписок.

```typescript
GET /functions/v1/get-vapid-key
Headers:
  apikey: SUPABASE_ANON_KEY

Response 200:
{
  publicKey: string
}

Errors:
500 - Key not configured
```

### send-custom-email
Отправляет кастомные email через Brevo (внутренний вызов).

```typescript
POST /functions/v1/send-custom-email
Headers:
  Content-Type: application/json

Body:
{
  user: {
    email: string
    user_metadata: {
      language: string
    }
  }
  email_data: {
    email_action_type: 'signup_confirmation' | 'password_reset' | 'email_change'
    token: string
    token_hash: string
    redirect_to: string
    site_url: string
  }
}

Response 200: OK
Errors: 500 - Send failed

Note: Вызывается автоматически через auth hooks
```

### notify-new-place-webhook
Webhook для уведомлений о новых местах (внутренний).

```typescript
POST /functions/v1/notify-new-place-webhook
Headers:
  X-Webhook-Secret: string (required)
  Content-Type: application/json

Body:
{
  title: string
  body: string
  data: object
}

Response 200:
{
  success: true
  successfulCount: number
  failedCount: number
}

Note: Вызывается триггером БД при создании места
```

### process-scheduled-notifications
CRON функция для обработки запланированных уведомлений.

```typescript
POST /functions/v1/process-scheduled-notifications
Headers:
  apikey: SUPABASE_ANON_KEY

Response 200:
{
  success: true
  processedCount: number
}

Schedule: Каждые 5 минут
```

### process-subscriptions
CRON функция для обработки платежей по подпискам.

```typescript
POST /functions/v1/process-subscriptions
Headers:
  apikey: SUPABASE_ANON_KEY

Response 200:
{
  success: true
  processedCount: number
  deactivatedCount: number
}

Schedule: Каждые 6 часов
```

---

## 📦 Storage API

### Upload File

```typescript
POST /storage/v1/object/{bucket_name}/{file_path}
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}
  Content-Type: image/jpeg (or file type)

Body: File binary

Response 200:
{
  Key: string (file path)
}

Buckets:
- tour-images (public)
- tour-guide-images (public)
```

### Get File URL

```typescript
GET /storage/v1/object/public/{bucket_name}/{file_path}

Response: File binary
```

### Delete File

```typescript
DELETE /storage/v1/object/{bucket_name}/{file_path}
Headers:
  apikey: SUPABASE_ANON_KEY
  Authorization: Bearer {JWT}

Response 200: OK
```

---

## 🔄 Realtime Subscriptions

### Subscribe to table changes

```typescript
const channel = supabase
  .channel('places-channel')
  .on(
    'postgres_changes',
    {
      event: '*', // or 'INSERT', 'UPDATE', 'DELETE'
      schema: 'public',
      table: 'places'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

**Supported tables for realtime:**
- places
- tours
- user_places
- scheduled_notifications

---

## 📈 Response Formats

### Success Response
```typescript
{
  data: any
  status: number (200-299)
}
```

### Error Response
```typescript
{
  error: {
    message: string
    details?: string
    hint?: string
    code?: string
  }
  status: number (400-599)
}
```

### Common Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid JWT)
- `403` - Forbidden (insufficient permissions/credits)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate entry)
- `500` - Internal Server Error

---

## 🔑 Environment Variables (Frontend)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=xxx
```

---

## 📝 Notes

1. **Rate Limiting**: Supabase применяет rate limiting на все запросы
2. **JWT Expiry**: Access tokens истекают через 1 час, используйте refresh token
3. **RLS**: Все таблицы защищены Row Level Security
4. **CORS**: Настроено для localhost и продакшн домена
5. **Webhook Verification**: Webhooks требуют X-Webhook-Secret header