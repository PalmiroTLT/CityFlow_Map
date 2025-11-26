# 📦 Retro City Map - Export Package

## Структура пакета

```
project-export/
├── README.md                      # Этот файл
├── deployment.md                  # Полная инструкция по развёртыванию
├── schema.sql                     # Полная схема БД (структура + данные)
├── api-contract.md                # API контракт (все эндпоинты)
├── frontend_dependencies.json     # Зависимости и конфигурация фронтенда
├── rls-policies/                  # RLS политики для всех таблиц
│   ├── 01-countries-cities.sql
│   ├── 02-profiles-roles.sql
│   ├── 03-categories.sql
│   ├── 04-places.sql
│   ├── 05-tours.sql
│   ├── 06-wishlist.sql
│   ├── 07-credits-transactions.sql
│   ├── 08-subscriptions.sql
│   ├── 09-statistics.sql
│   ├── 10-notifications.sql
│   ├── 11-email-donation.sql
│   └── 12-storage-policies.sql
├── secrets/                       # Секреты и переменные окружения
│   ├── README.md
│   └── secrets.env.example
└── edge-functions/                # Копия всех edge functions
    └── (см. supabase/functions/)

```

## Быстрый старт

1. **Прочитать deployment.md** - главная инструкция
2. **Создать Supabase проект**
3. **Применить schema.sql** - создаёт все таблицы
4. **Применить RLS политики** - из rls-policies/
5. **Настроить секреты** - см. secrets/README.md
6. **Развернуть edge functions** - из supabase/functions/
7. **Настроить фронтенд** - см. frontend_dependencies.json

## Важные файлы

- **deployment.md** - НАЧАТЬ ОТСЮДА (пошаговая инструкция)
- **api-contract.md** - Полное описание API
- **schema.sql** - База данных
- **secrets/README.md** - Настройка секретов

## Edge Functions (в основном проекте)

Все edge functions находятся в `supabase/functions/`:
- add-place
- add-place-with-subscription  
- purchase-tour
- toggle-premium
- translate-text
- send-custom-email
- send-push-notification
- get-vapid-key
- notify-new-place-webhook
- process-scheduled-notifications
- process-subscriptions

## Поддержка

Документация: docs/swagger.yaml и docs/DATABASE.md