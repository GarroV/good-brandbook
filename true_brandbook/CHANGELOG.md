# Design Terminal — Changelog

## [0.1.0] — 2026-06-04/05 — Phase 0: Infrastructure

### Added
- Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4
- shadcn/ui с стилем `base-nova` (совместим с Tailwind v4)
- next-intl 4 — i18n без locale в URL, переключение через cookie `locale`
- Переводы: `messages/en.json`, `messages/ru.json` (auth, nav, common, gallery)
- Supabase схема: 10 таблиц, RLS на всех, workspace isolation
- JWT custom claims hook (`custom_access_token_hook`) — добавляет `workspace_id`, `user_role`, `is_superadmin` в токен
- Auth trigger `on_auth_user_created` — автосоздаёт `public.users` при invite acceptance
- SQL функция `check_and_increment_limit` — атомарная проверка лимитов (используется в Phase 2)
- SQL функция `my_workspace_id()` — helper для RLS политик
- Storage бакеты: `html-sources` (private), `assets` (public), `brand-assets` (public)
- Supabase client utilities: `lib/supabase/server.ts`, `client.ts`, `types.ts`
- Formats константа: `lib/formats/index.ts` — 7 форматов с размерами
- Middleware: route protection через JWT claims, refresh сессии
- Login page: email OTP, 2-step flow (email → 6-digit code → вход)
- Invite acceptance: `/invite/[token]` page + `/api/invites/[token]` route
- Protected layout: навбар с ролями, sign out
- Gallery placeholder: пустой экран с CTA
- Vitest: 5 unit тестов для форматов
- Dockerfile: multi-stage build с Chromium (для будущего Puppeteer)
- `.env.local.example`

### Infrastructure
- Supabase проект: `kuzxmhthtwzbenrxxuvh` (Good_Branbook), аккаунт handerhaneder's Org
- Деплой: Vercel (free tier, автодеплой из GitHub `GarroV/good-brandbook`)
- Auth hook зарегистрирован в Dashboard

### Known Limitations
- Puppeteer не задействован (Phase 2) — Vercel OK для Phase 0-1
- pg_cron не настроен (нет в Supabase Free) — очистка черновиков вручную или через Edge Function в Phase 6
- Первый workspace/admin создаётся вручную через Supabase SQL Editor
