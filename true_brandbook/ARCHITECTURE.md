# Design Terminal — Architecture

## Стек (фактический, Phase 0)

| Слой | Технология | Версия |
|------|-----------|--------|
| Фронтенд + API | Next.js App Router | 16.2.7 |
| Язык | TypeScript | strict mode |
| Стили | Tailwind CSS | v4 |
| UI компоненты | shadcn/ui (base-nova) + @base-ui/react | latest |
| i18n | next-intl | 4.13.0 |
| Auth + DB | Supabase (@supabase/ssr) | 0.10.3 |
| Тесты | Vitest | 4.x |
| Деплой | Vercel (Phase 0-1), Railway/Cloud Run (Phase 2+) | — |

---

## Структура проекта

```
/app
  /api
    /invites/[token]
      route.ts          -- GET: валидация invite токена (service role)
  /(auth)               -- публичные страницы
    /login
      page.tsx          -- email OTP login (client component)
      actions.ts        -- server actions: sendOtp, verifyOtp
    /invite/[token]
      page.tsx          -- принятие инвайта (client component)
      actions.ts        -- server action: acceptInvite
  /(app)                -- защищённые страницы (требуют auth)
    layout.tsx          -- навбар с ролями, getUser() проверка
    page.tsx            -- галерея (placeholder)
  layout.tsx            -- root layout, NextIntlClientProvider
  globals.css

/lib
  /supabase
    server.ts           -- createClient() async SSR, createAdminClient() service role
    client.ts           -- createClient() browser ('use client')
    types.ts            -- Database interface (10 таблиц, explicit Update types)
  /formats
    index.ts            -- FORMATS константа, FormatKey, FORMAT_KEYS

/components
  /ui                   -- shadcn/base-nova компоненты

/messages
  en.json               -- English (auth, nav, common, gallery)
  ru.json               -- Russian (те же ключи)

/i18n
  request.ts            -- next-intl server config, cookie-based locale

/supabase
  /migrations
    001_initial.sql     -- полная схема БД

/__tests__
  formats.test.ts       -- 5 unit тестов

/true_brandbook         -- документация проекта
  SETUP.md              -- онбординг с нуля
  ARCHITECTURE.md       -- этот файл
  DATA_MODEL.md         -- схема БД детально
  DECISIONS.md          -- архитектурные решения с обоснованием
  MASTER_PROJECT.md     -- суть проекта, стек, роли
  ROADMAP.md            -- фазы разработки
  BACKLOG.md            -- отложенные задачи
  CHANGELOG.md          -- история изменений
  CLAUDE.md             -- правила для Claude Code

middleware.ts           -- route protection
next.config.ts          -- next-intl plugin, standalone output
Dockerfile              -- multi-stage, Chromium для Puppeteer
```

---

## Auth Flow

### Логин существующего пользователя
```
/login → email input → sendOtp() → Supabase signInWithOtp (shouldCreateUser: false)
       → 6-digit code → verifyOtp() → redirect /
```

### Invite Flow
```
Admin создаёт invite (Phase 5) → строка в таблице invites
User → /invite/[token]
     → GET /api/invites/[token] (service role, проверка токена)
     → форма: ввод имени
     → acceptInvite() server action:
         → auth.admin.createUser({ email, user_metadata: { workspace_id, name, role } })
         → trigger on_auth_user_created → insert into public.users
         → invites.accepted_at = now()
     → redirect /login → OTP вход
```

### JWT Custom Claims
При каждом выпуске токена `custom_access_token_hook` добавляет в JWT:
```json
{
  "workspace_id": "uuid",
  "user_role": "admin" | "member",
  "is_superadmin": false
}
```
Middleware читает эти claims без DB запроса.

---

## Middleware

```typescript
// middleware.ts
// 1. Refresh session cookies (setAll с headers для cache-control)
// 2. getUser() — валидация с Supabase Auth сервером
// 3. Публичные пути: /login, /invite/*, /api/invites/*
// 4. Не авторизован + не публичный → redirect /login
// 5. /superadmin → is_superadmin из JWT claims
// 6. /admin → user_role === 'admin' || is_superadmin
```

**Важно:** используется `getUser()`, не `getSession()`. `getSession()` не валидирует токен на сервере — небезопасно для authorization. Подробнее: [DECISIONS.md](DECISIONS.md).

---

## Supabase Client Pattern

```typescript
// Server Components, API routes — async, cookie-based session
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Admin операции (service role, server only) — sync, stateless
import { createAdminClient } from '@/lib/supabase/server'
const admin = createAdminClient()
// createAdminClient использует createClient из @supabase/supabase-js
// с { auth: { persistSession: false, autoRefreshToken: false } }

// Client Components
'use client'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**Правило:** `SUPABASE_SERVICE_ROLE_KEY` только в серверных роутах (`/app/api/`, server actions). Никогда на клиенте.

---

## TypeScript Types (lib/supabase/types.ts)

Все таблицы имеют явные `Row`, `Insert`, `Update` и обязательное поле `Relationships: []`.  
`Database['public']` содержит `Views: Record<string, never>` и `Enums: Record<string, never>` — без них `GenericSchema` check в supabase-js фейлится.

Причина: `Partial<Database['...']['Insert']>` в `Update` типах создаёт circular reference → `never` в postgrest-js. Поэтому все `Update` типы написаны явно.

---

## Флоу генерации (Phase 2, не реализован)

```
POST /api/generate
  → проверка брендбука (tokens не пустой)
  → check_and_increment_limit() — атомарно в Postgres
  → создать batch + batch_items
  → Promise.allSettled(formats.map(generateFormat))
     → Claude API → HTML
     → validateHtml()
     → uploadHtml() → Supabase Storage
     → Puppeteer → JPEG превью
     → updateItem(status: 'preview_ready')
  → Supabase Realtime уведомляет клиент

POST /api/batches/[id]/publish
  → Puppeteer → PDF/PNG
  → updateItem(status: 'done')
  → activity_feed INSERT → Realtime
```

---

## Форматы (lib/formats/index.ts)

| Ключ | Размер | Файл |
|------|--------|------|
| `a4` | 794×1123px | PDF |
| `a5` | 559×794px | PDF |
| `instagram_post` | 1080×1080px | PNG |
| `instagram_story` | 1080×1920px | PNG |
| `tv_board` | 1920×1080px | PNG |
| `youtube_preview` | 1280×720px | PNG |
| `twitter_post` | 1200×675px | PNG |

Единственный источник правды — не хардкодить размеры нигде кроме этого файла.

---

## i18n

Локаль определяется из cookie `locale` (default: `en`). Смена языка — установить cookie.  
Все UI строки через `useTranslations()` / `getTranslations()`. Никакого хардкода текста в компонентах.  
При добавлении строки — добавлять в оба файла (`en.json` и `ru.json`).

---

## Переменные окружения

```
NEXT_PUBLIC_SUPABASE_URL        — URL проекта Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY   — публичный ключ (в браузер)
SUPABASE_SERVICE_ROLE_KEY       — секретный ключ (только сервер!)
ANTHROPIC_API_KEY               — Claude API (Phase 2)
RESEND_API_KEY                  — email инвайты (Phase 5)
SUPERADMIN_EMAIL                — email суперадмина
```

---

## Деплой

**Phase 0-1:** Vercel free tier  
Автодеплой из `main` ветки `GarroV/good-brandbook`.

**Phase 2+ (когда нужен Puppeteer):** Railway или Google Cloud Run  
Dockerfile готов: multi-stage build, Chromium установлен через apt.  
Next.js `output: 'standalone'` настроен в `next.config.ts`.
