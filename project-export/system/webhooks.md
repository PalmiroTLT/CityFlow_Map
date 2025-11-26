# Webhooks and External Integrations

## Overview
This document describes webhooks and external integrations used in the Retro City Map project.

---

## Internal Webhooks

### 1. New Place Notification Webhook

**Trigger**: Database trigger on `places` table INSERT

**Function**: `notify_new_place_webhook` Edge Function

**Purpose**: Send push notifications to all subscribed users when a new place is added to the map

**Flow**:
1. User creates a new place → INSERT into `places` table
2. Database trigger `notify_new_place` fires
3. Trigger calls `notify_new_place_webhook` Edge Function via HTTP POST
4. Edge Function sends push notifications to all users

**Trigger SQL**:
```sql
CREATE TRIGGER notify_new_place_trigger
  AFTER INSERT ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_place();
```

**Security**:
- Uses `WEBHOOK_SECRET` for authentication
- Secret verified via `X-Webhook-Secret` header
- Only internal triggers can call this webhook

**Configuration**:
- **URL**: `https://YOUR_PROJECT_URL/functions/v1/notify-new-place-webhook`
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `X-Webhook-Secret: ${WEBHOOK_SECRET}`
- **Payload**:
```json
{
  "title": "Novo mesto / Новое место / New place",
  "body": "Place Name (Category Name)",
  "data": {
    "place_id": "uuid",
    "place_name": "string",
    "category_id": "uuid",
    "type": "new_place"
  }
}
```

**Setup**:
1. Generate webhook secret: `openssl rand -hex 32`
2. Add to Supabase secrets: `WEBHOOK_SECRET`
3. Ensure trigger function references correct project URL
4. Deploy `notify-new-place-webhook` Edge Function

---

## External Service Integrations

### 1. Brevo (Email Service)

**Purpose**: Send transactional emails (verification, password reset, etc.)

**Integration Method**: REST API via Edge Functions

**API Endpoint**: `https://api.brevo.com/v3/smtp/email`

**Authentication**: API Key in header
```
api-key: YOUR_BREVO_API_KEY
```

**Used By**:
- `send-custom-email` Edge Function

**Configuration**:
1. Sign up at https://brevo.com
2. Get API key from Settings → API Keys
3. Add to Supabase secrets: `BREVO_API_KEY`
4. Configure sender email and name

**Rate Limits**:
- Free tier: 300 emails/day
- Upgrade available if needed

---

### 2. OpenStreetMap Nominatim API

**Purpose**: Geocoding (address → coordinates) and reverse geocoding (coordinates → address)

**Integration Method**: REST API (public, no auth required)

**Endpoints**:
- Geocoding: `https://nominatim.openstreetmap.org/search`
- Reverse: `https://nominatim.openstreetmap.org/reverse`

**Used By**:
- Frontend: `src/lib/geocoding.ts`

**Rate Limits**:
- 1 request per second
- User-Agent header required

**Usage**:
```typescript
// Geocoding
const url = `https://nominatim.openstreetmap.org/search?format=json&q=${address}&limit=1`;

// Reverse geocoding
const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
```

**Best Practices**:
- Always include User-Agent header
- Respect rate limits (1 req/sec)
- Cache results when possible
- Handle errors gracefully

---

### 3. Web Push Notifications (VAPID)

**Purpose**: Send push notifications to web browsers

**Standard**: VAPID (Voluntary Application Server Identification)

**Integration Method**: Web Push Protocol

**Used By**:
- `send-push-notification` Edge Function
- `get-vapid-key` Edge Function
- Frontend: `src/hooks/usePushNotifications.ts`

**Setup**:
1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Add to Supabase secrets:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`

3. Configure service worker: `public/sw.js`

**Push Subscription Flow**:
1. User grants notification permission
2. Frontend fetches VAPID public key from `get-vapid-key`
3. Browser creates push subscription
4. Subscription saved to `push_subscriptions` table
5. Edge Functions can send notifications via subscription

**Push Notification Format**:
```json
{
  "title": "Notification Title",
  "body": "Notification Body",
  "icon": "/icon.png",
  "badge": "/badge.png",
  "data": {
    "url": "https://...",
    "custom_field": "value"
  }
}
```

---

### 4. Lovable AI (Translation Service)

**Purpose**: Automatic translation of place names/descriptions between Serbian, Russian, and English

**Integration Method**: REST API via Edge Functions

**Used By**:
- `translate-text` Edge Function

**Authentication**: API Key
```
Authorization: Bearer YOUR_LOVABLE_API_KEY
```

**Setup**:
1. Get API key from Lovable Dashboard
2. Add to Supabase secrets: `LOVABLE_API_KEY`

**Usage**:
```typescript
// Translate text
const response = await fetch('https://api.lovable.dev/v1/translate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Hello world',
    source_lang: 'en',
    target_lang: 'sr'
  })
});
```

**Supported Languages**:
- `sr` - Serbian (Cyrillic)
- `ru` - Russian
- `en` - English

---

## CRON Jobs (Scheduled Tasks)

### 1. Process Subscriptions

**Schedule**: Every 6 hours
**CRON Expression**: `0 */6 * * *`

**Function**: `process-subscriptions` Edge Function

**Purpose**: 
- Check for expired subscriptions
- Hide places when subscriptions end
- Send renewal reminders (optional)

**Setup**: See `system/cron-setup.sql`

---

### 2. Process Scheduled Notifications

**Schedule**: Every 5 minutes
**CRON Expression**: `*/5 * * * *`

**Function**: `process-scheduled-notifications` Edge Function

**Purpose**:
- Check for notifications scheduled to be sent
- Send push notifications at scheduled time
- Mark notifications as sent

**Setup**: See `system/cron-setup.sql`

---

## Webhook Security Best Practices

### 1. Authenticate Webhooks
- Use secret tokens in headers
- Verify signatures when possible
- Use HTTPS only

### 2. Validate Payloads
- Check content-type
- Validate JSON structure
- Sanitize input data

### 3. Handle Errors
- Return proper HTTP status codes
- Log errors for debugging
- Implement retry logic when needed

### 4. Rate Limiting
- Implement rate limiting on webhook endpoints
- Prevent abuse and DoS attacks

---

## Testing Webhooks

### Local Testing
1. Use ngrok to expose local server:
```bash
ngrok http 5173
```

2. Update webhook URLs to ngrok URL

3. Test webhook triggers

### Production Testing
1. Use webhook testing tools (Postman, curl)
2. Check Edge Function logs
3. Verify database changes
4. Monitor error rates

---

## Monitoring and Logging

### Edge Function Logs
View logs for each Edge Function in Supabase Dashboard:
- Functions → Select function → Logs

### Database Trigger Logs
Check PostgreSQL logs for trigger executions:
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### External Service Logs
- **Brevo**: Check email delivery logs in Brevo dashboard
- **Push Notifications**: Monitor browser console for errors

---

## Troubleshooting

### Webhooks not firing
1. Check database trigger exists and is enabled
2. Verify Edge Function is deployed
3. Check Edge Function logs for errors
4. Verify webhook secret matches

### External API errors
1. Check API credentials are correct
2. Verify rate limits not exceeded
3. Check API status pages
4. Review Edge Function logs

### CRON jobs not running
1. Verify pg_cron extension is enabled
2. Check CRON job is scheduled: `SELECT * FROM cron.job;`
3. Check execution logs: `SELECT * FROM cron.job_run_details;`
4. Verify Edge Function URLs and keys are correct
