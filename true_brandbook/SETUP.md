# Design Terminal — Setup Guide

Всё что нужно чтобы поднять проект с нуля на новой машине.

---

## Prerequisities

- Node.js 20+
- Git
- Доступ к GitHub репо: `github.com/GarroV/good-brandbook`
- Доступ к Supabase проекту (ключи ниже или у владельца аккаунта)

---

## 1. Клонировать и установить

```bash
git clone https://github.com/GarroV/good-brandbook
cd good-brandbook
npm install
```

---

## 2. Переменные окружения

Создай `.env.local` в корне (не коммитить!):

```bash
cp .env.local.example .env.local
```

Заполни значения:

| Переменная | Где взять |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → Secret |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `RESEND_API_KEY` | resend.com/api-keys |
| `SUPERADMIN_EMAIL` | email суперадмина |

**Текущий Supabase проект:** `kuzxmhthtwzbenrxxuvh` (Good_Branbook)  
Аккаунт: handerhaneder's Org. Ключи у владельца проекта.

---

## 3. Запуск локально

```bash
npm run dev
```

Открой http://localhost:3000 — редиректнет на `/login`.

---

## 4. Supabase — что уже настроено

Схема применена, всё работает. Если нужно применить миграцию заново (новый проект):

**Через Management API (без CLI):**
```bash
# Нужен Personal Access Token: supabase.com/dashboard/account/tokens
curl -X POST "https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query" \
  -H "Authorization: Bearer {PAT}" \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'  # содержимое supabase/migrations/001_initial.sql
```

**Через SQL Editor в Dashboard:**  
Открой `supabase/migrations/001_initial.sql` → вставь в SQL Editor → Run.

**После миграции вручную:**
1. Storage бакеты (SQL Editor):
```sql
insert into storage.buckets (id, name, public) values
  ('html-sources', 'html-sources', false),
  ('assets', 'assets', true),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;
```

2. Auth Hook: Dashboard → Authentication → Auth Hooks → Add hook → Customize Access Token (JWT) → Postgres → `public.custom_access_token_hook`

---

## 5. Первый пользователь (bootstrap)

Нет UI для создания первого workspace. Делается через SQL Editor:

```sql
-- 1. Создать workspace
insert into public.workspaces (name, slug) values ('My Company', 'my-company');

-- 2. После того как пользователь залогинился через OTP,
--    найти его id в auth.users и создать профиль:
insert into public.users (id, workspace_id, name, email, role, is_superadmin)
select 
  au.id,
  w.id,
  'Admin Name',
  'admin@example.com',
  'admin',
  true
from auth.users au, public.workspaces w
where au.email = 'admin@example.com' and w.slug = 'my-company';
```

---

## 6. Деплой на Vercel

1. vercel.com → Add New Project → Import `GarroV/good-brandbook`
2. Environment Variables — добавить все из `.env.local`
3. Deploy

Автодеплой настроен на `main` ветку.

---

## 7. Команды

```bash
npm run dev          # локальная разработка
npm run build        # production сборка
npm run type-check   # проверка TypeScript
npm test             # unit тесты (Vitest)
```

---

## 8. Структура проекта

```
/app
  /(auth)/login/      — OTP логин
  /(auth)/invite/     — принятие инвайта
  /(app)/             — защищённые страницы (галерея и др.)
  /api/invites/       — API для invite flow
/lib
  /supabase/          — клиенты и TypeScript типы
  /formats/           — константа форматов
/components/ui/       — shadcn компоненты
/messages/            — переводы EN/RU
/supabase/migrations/ — SQL миграции
/true_brandbook/      — документация проекта
```

Полная архитектура: [ARCHITECTURE.md](ARCHITECTURE.md)  
Схема БД: [DATA_MODEL.md](DATA_MODEL.md)  
Архитектурные решения: [DECISIONS.md](DECISIONS.md)
