# 🗺️ Retro City Map - Интерактивная карта города

Веб-приложение для интерактивного исследования города с местами, турами и премиум-контентом в стиле 16-битного ретро-гейминга.

![Retro City Map](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Supabase-blue)

---

## 📋 Содержание

- [О проекте](#о-проекте)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Документация API](#документация-api)
- [Архитектура](#архитектура)

---

## 🎮 О проекте

**Retro City Map** — современное веб-приложение с ностальгическим дизайном в стиле 16-битных консолей.

**Возможности:**
- 🗺️ Интерактивная карта города
- 🏆 Покупка туров за кредиты
- 👑 Премиум места
- 🏢 Добавление бизнес-локаций
- 🌍 3 языка (SR/RU/EN)

---

## 🛠 Технологический стек

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Shadcn/ui

**Backend:** Supabase (PostgreSQL + Deno Edge Functions)

---

## 🚀 Быстрый старт

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ac13d13b-b5a9-4cbf-8251-8c7256555838) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```bash
# Клонировать репозиторий
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

---

## 📚 Документация API

### Swagger UI

Интерактивная документация доступна по адресу:
- **Локально:** `http://localhost:8080/api-docs.html`
- **Продакшн:** `https://your-domain.com/api-docs.html`

### Edge Functions

| Функция | Описание | Стоимость |
|---------|----------|-----------|
| `add-place` | Добавить место на карту | 15 кредитов |
| `add-place-with-subscription` | Добавить место с подпиской | Зависит от плана |
| `purchase-tour` | Купить тур | 10 кредитов |
| `toggle-premium` | Премиум статус на 30 дней | 8 кредитов |
| `translate-text` | Перевести текст (AI) | - |
| `send-push-notification` | Push-уведомление | Только админ |
| `send-custom-email` | Email отправка | Внутренняя |

**Подробная документация:**
- [docs/swagger.yaml](docs/swagger.yaml) - OpenAPI 3.0 спецификация
- [docs/DATABASE.md](docs/DATABASE.md) - Схема базы данных

---

## 🏗 Архитектура

**Разделение Frontend/Backend:**
- `src/` - React приложение (Frontend)
- `supabase/functions/` - Deno Edge Functions (Backend)

**База данных:** PostgreSQL с Row Level Security

Подробнее: [docs/DATABASE.md](docs/DATABASE.md)

---

## 🔒 Безопасность

- ✅ Row Level Security на всех таблицах
- ✅ JWT аутентификация
- ✅ Валидация входных данных
- ✅ Защита от SQL инъекций
- ✅ Система ролей (admin/user)

---

## 📚 Дополнительная документация

- [docs/DATABASE.md](docs/DATABASE.md) - Полная схема базы данных
- [docs/swagger.yaml](docs/swagger.yaml) - OpenAPI спецификация
- [public/api-docs.html](public/api-docs.html) - Swagger UI

---

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ac13d13b-b5a9-4cbf-8251-8c7256555838) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
