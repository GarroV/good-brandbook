# Design Terminal — Architecture Decisions

Здесь фиксируем почему мы выбрали то или иное решение. Помогает не переобсуждать одно и то же.

---

## Деплой: Vercel вместо Railway (Phase 0-1)

**Выбрали:** Vercel free tier  
**Отказались от:** Railway ($5-20/мес)

Puppeteer не нужен до Phase 2. Vercel — нативный Next.js хостинг, бесплатный, деплой за 2 минуты. Когда дойдём до рендера (Phase 2), переедем на Railway или Google Cloud Run.

---

## Supabase вместо Cloudflare D1

**Выбрали:** Supabase  
**Отказались от:** Cloudflare D1, PlanetScale и др.

Supabase даёт пакетом: Postgres + RLS + Auth + Realtime + Storage. Cloudflare D1 — SQLite без RLS, нет Auth, нет Realtime. Для мультитенантного приложения с workspace isolation и realtime-прогрессом генерации Supabase безальтернативен.

---

## Next.js 16 вместо 15

**Выбрали:** 16.2.7 (latest на момент bootstrap)  
**Планировали:** 15

`create-next-app@latest` установил 16. Turbopack теперь дефолтный (флаг `--turbopack` убрали из `dev` скрипта). `allowedDevOrigins` вместо `experimental.serverActions.allowedOrigins`. Совместимость с планом полная.

---

## shadcn base-nova вместо default

**Выбрали:** base-nova (Tailwind v4)  
**Причина:** `create-next-app@latest` ставит Tailwind v4. base-nova — единственный shadcn стиль совместимый с v4. Компоненты используют `@base-ui/react` вместо Radix UI.

**Следствие:** shadcn `form` компонент (react-hook-form) недоступен в base-nova. Используем нативные HTML `<form>` элементы — для Phase 0 достаточно.

---

## Supabase Types: explicit Update + Relationships

**Проблема:** `Update: Partial<Database['...']['Insert']>` создавал circular reference — `postgrest-js@2.107` резолвил его в `never`, ломая `.update()`.

**Решение:** все `Update` типы написаны явно (не через `Partial<Insert>`). Добавили `Relationships: []` на все таблицы и `Views: Record<string, never>` — без этого `GenericSchema` check в supabase-js фейлился, делая `Schema = never`.

---

## Middleware: getUser() вместо getSession()

**Выбрали:** `supabase.auth.getUser()` для auth check  
**Отказались от:** `getSession()` для authorization

`getSession()` читает cookie без валидации на сервере — небезопасно для authorization decisions (можно подделать cookie). `getUser()` делает network call к Supabase Auth, возвращает верифицированного пользователя. JWT claims читаем из `session.access_token` после `getUser()` (кешируется).

---

## createAdminClient: createClient из supabase-js, не createServerClient из ssr

**Проблема:** `createServerClient` добавляет session cookie handling — для service role client это лишнее и семантически неверно.

**Решение:** `createAdminClient()` использует `createClient` из `@supabase/supabase-js` с `{ auth: { persistSession: false, autoRefreshToken: false } }`. Явно stateless.

---

## Supabase Management: PAT вместо CLI

**Выбрали:** Personal Access Token для SQL операций  
**Причина:** несколько аккаунтов Supabase, CLI привязан к одному аккаунту. PAT позволяет работать с любым проектом через Management API без установки CLI.

**Когда нужен CLI:** локальный dev-стек, `supabase db diff`, типогенерация. Добавить при необходимости в Phase 2+.

---

## i18n: cookie-based locale без URL prefix

**Выбрали:** locale через cookie `locale`, дефолт `en`  
**Отказались от:** `/[locale]/...` URL структуры

ARCHITECTURE.md изначально не предполагал locale в URL. Cookie-подход проще, URL остаются чистыми. Смена языка — установить cookie и обновить страницу.
