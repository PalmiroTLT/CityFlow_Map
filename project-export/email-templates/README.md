# Email Templates

## Overview
This project uses custom email templates for all authentication-related emails. Templates are stored in the `email_templates` database table and are multilingual (Serbian, Russian, English).

---

## Template Types

### 1. Signup (Email Verification)
**Template Type**: `signup`

**Purpose**: Sent when a user registers to verify their email address

**Variables Available**:
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Token hash for verification
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - URL to redirect after confirmation
- `{{ .Email }}` - User's email address

**Example Flow**:
1. User fills registration form
2. System sends verification email
3. User clicks verification link
4. Email is confirmed, user is logged in

---

### 2. Recovery (Password Reset)
**Template Type**: `recovery`

**Purpose**: Sent when a user requests password reset

**Variables Available**:
- `{{ .Token }}` - Reset token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Password reset page URL
- `{{ .Email }}` - User's email address

**Example Flow**:
1. User clicks "Forgot password?" on login page
2. User enters email address
3. System sends recovery email
4. User clicks reset link
5. User enters new password

---

### 3. Magic Link (Optional)
**Template Type**: `magic_link`

**Purpose**: Sent for passwordless authentication (if enabled)

**Variables Available**:
- `{{ .Token }}` - Magic link token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Post-login redirect URL
- `{{ .Email }}` - User's email address

**Note**: Currently not used in this project (password authentication only)

---

### 4. Email Change (Optional)
**Template Type**: `email_change`

**Purpose**: Sent when user changes email address

**Variables Available**:
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Confirmation page URL
- `{{ .Email }}` - New email address

**Note**: Currently not supported in this project

---

## Template Structure

Each template has:
- **Subject** (3 languages: SR, RU, EN)
- **Body** (3 languages: SR, RU, EN)

### Language Selection
The correct language is automatically selected based on:
1. User's `language` field in `profiles` table
2. Fallback to Serbian (SR) if not set

---

## Template Format

Templates use Go template syntax for variable interpolation:

**Example Subject**:
```
Потврдите своју email адресу / Confirm your email
```

**Example Body**:
```html
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .button { background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; }
  </style>
</head>
<body>
  <h1>Добродошли!</h1>
  <p>Кликните на дугме испод да потврдите своју email адресу:</p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}" class="button">
    Потврди email
  </a>
  <p>Ако нисте направили налог, игноришите ову поруку.</p>
</body>
</html>
```

---

## Admin Management

### Viewing Templates
Admins can view all email templates in:
**Admin Panel → Email Templates Tab**

### Editing Templates
Admins can edit:
- Subject (all 3 languages)
- Body (all 3 languages)

### Testing Templates
Recommended to test templates before deploying:
1. Create a test user account
2. Trigger email (signup, password reset)
3. Check email received and formatting
4. Verify all links work correctly

---

## How Templates Work

### Email Sending Flow
1. User triggers action (signup, password reset)
2. Supabase Auth generates token
3. **Auth Hook** calls `send-custom-email` Edge Function
4. Edge Function:
   - Loads template from `email_templates` table
   - Gets user language from `profiles` table
   - Selects correct language version
   - Replaces template variables with actual values
   - Sends email via Brevo API
5. User receives email

### Database Schema
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL UNIQUE, -- 'signup', 'recovery', etc.
  subject_sr TEXT NOT NULL,
  subject_ru TEXT NOT NULL,
  subject_en TEXT NOT NULL,
  body_sr TEXT NOT NULL,
  body_ru TEXT NOT NULL,
  body_en TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Initial Templates Setup

After migration, you need to populate the `email_templates` table with initial templates:

```sql
-- Insert signup template
INSERT INTO email_templates (template_type, subject_sr, subject_ru, subject_en, body_sr, body_ru, body_en)
VALUES (
  'signup',
  'Потврдите своју email адресу',
  'Подтвердите свой email адрес',
  'Confirm your email address',
  '<html>...</html>', -- Serbian HTML
  '<html>...</html>', -- Russian HTML
  '<html>...</html>'  -- English HTML
);

-- Insert recovery template
INSERT INTO email_templates (template_type, subject_sr, subject_ru, subject_en, body_sr, body_ru, body_en)
VALUES (
  'recovery',
  'Ресетујте лозинку',
  'Сброс пароля',
  'Reset your password',
  '<html>...</html>', -- Serbian HTML
  '<html>...</html>', -- Russian HTML
  '<html>...</html>'  -- English HTML
);
```

**Note**: See `initial-templates.sql` for complete template content

---

## Template Variables Reference

### Common Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .Token }}` | Raw token string | `abc123...` |
| `{{ .TokenHash }}` | Hashed token for URL | `xyz789...` |
| `{{ .SiteURL }}` | Your site base URL | `https://example.com` |
| `{{ .RedirectTo }}` | Post-action redirect | `/dashboard` |
| `{{ .Email }}` | User's email | `user@example.com` |

### Building Confirmation URLs

**Signup Confirmation**:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&redirect_to={{ .RedirectTo }}
```

**Password Recovery**:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}
```

**Magic Link**:
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&redirect_to={{ .RedirectTo }}
```

---

## Styling Guidelines

### HTML Email Best Practices
1. **Inline CSS**: Use inline styles, not `<style>` tags (better email client support)
2. **Table layouts**: Use tables for layout (better compatibility)
3. **Simple designs**: Keep designs simple and clean
4. **Test across clients**: Test in Gmail, Outlook, Apple Mail, etc.
5. **Mobile responsive**: Use responsive design patterns

### Template Colors
Use project brand colors:
- Primary: `#3B82F6` (blue)
- Success: `#10B981` (green)
- Danger: `#EF4444` (red)
- Text: `#1F2937` (dark gray)
- Background: `#F9FAFB` (light gray)

---

## Troubleshooting

### Emails not sending
1. Check `send-custom-email` Edge Function logs
2. Verify Brevo API key is correct
3. Check Brevo daily limit (300 emails/day)
4. Verify sender email is verified in Brevo

### Wrong language sent
1. Check user's `language` field in `profiles` table
2. Verify template has all 3 language versions
3. Check Edge Function language selection logic

### Variables not replaced
1. Verify variable syntax: `{{ .VariableName }}`
2. Check Edge Function template rendering
3. Ensure variables are passed to template

### Links broken
1. Verify `{{ .SiteURL }}` is correct
2. Check redirect URLs in Auth settings
3. Test token_hash parameter format

---

## Customization Tips

### Adding Custom Variables
To add custom variables to templates:

1. Modify `send-custom-email` Edge Function
2. Add variable to template context
3. Use in template: `{{ .CustomVariable }}`

### Adding New Template Types
1. Create new template in `email_templates` table
2. Add corresponding auth hook trigger
3. Update Edge Function to handle new type

### Branding
- Add logo: `<img src="https://your-cdn.com/logo.png" />`
- Custom fonts: Use web-safe fonts or web fonts
- Footer: Include company info, unsubscribe link (if applicable)

---

## Security Considerations

### Token Security
- Tokens are single-use
- Tokens expire after short time (typically 1 hour)
- Always use HTTPS for confirmation URLs
- Never log tokens in plaintext

### Template Injection
- Never allow user input directly in templates
- Sanitize any dynamic content
- Templates are admin-managed only

### Email Spoofing
- Configure SPF, DKIM, DMARC in DNS
- Use verified sender domain
- Brevo handles most email authentication

---

## Migration Checklist

- [ ] Create `email_templates` table (via migrations)
- [ ] Populate initial templates (see `initial-templates.sql`)
- [ ] Configure Auth Hook for `send_email`
- [ ] Deploy `send-custom-email` Edge Function
- [ ] Configure Brevo API key in secrets
- [ ] Test signup email
- [ ] Test password recovery email
- [ ] Verify correct language selection
- [ ] Check email formatting in multiple clients
- [ ] Configure SPF/DKIM records (optional but recommended)
