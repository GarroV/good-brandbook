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
    /generate
      route.ts          -- POST: генерация + persist, возвращает id (nodejs, maxDuration 300)
    /export/[id]
      route.ts          -- GET: финальный PNG/PDF по сохранённому макету (re-stamp legal)
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
    layout.tsx          -- шапка (sticky), роли, getUser(); рендерит MainNav + LangToggle
    MainNav.tsx         -- клиентская навигация: активный пункт (usePathname), мобильный скролл
    LangToggle.tsx      -- переключатель локали EN/RU (cookie + router.refresh)
    page.tsx            -- галерея: сохранённые генерации воркспейса (сетка + скачать)
    /my
      page.tsx          -- «мои макеты»: генерации текущего пользователя
    /new
      page.tsx          -- форма генерации (client): формат + промпт → превью
    /admin/brandbook    -- редактор брендбука (admin-only): page + actions + BrandbookForm
    /admin/materials    -- библиотека референс-материалов (admin-only): page + actions + MaterialsManager
  layout.tsx            -- root layout, NextIntlClientProvider
  globals.css

/lib
  /claude
    prompt.ts           -- buildPrompt (system + design_system + house_rules + format_brief + render_constraint), buildMockHtml
    patterns.ts         -- HOUSE_RULES + FORMAT_BRIEFS (из анализа реальных макетов; см. DODO_LAYOUT_PATTERNS.md)
    client.ts           -- generateHtml (Anthropic, vision-референсы)
  /openai
    client.ts           -- generateHtmlOpenAI (OpenAI, vision-референсы через image_url)
  /puppeteer
    render.ts           -- renderPreview → JPEG (JS off + перехват сети: только data:/about:)
  /validation
    html.ts             -- extractHtml, validateHtml (быстрый пре-фильтр)
  /materials
    repository.ts       -- brand_materials + Storage: getExemplars, loadReferenceImages, upload/list/delete, signed URL
  /generations
    repository.ts       -- сохранённые генерации: save/list + HTML для экспорта (batches/items/assets + бакет 'generated')
  /library
    local.ts            -- локальная папка-зеркало скачанных макетов (dev; no-op в prod)
  /fonts
    embed.ts            -- бренд-шрифты (Rooftop, Noto Sans) → @font-face data-URI, инъекция в рендер
  /supabase
    server.ts           -- createClient() async SSR, createAdminClient() service role
    client.ts           -- createClient() browser ('use client')
    types.ts            -- Database interface (11 таблиц, explicit Update types)
  /formats
    index.ts            -- FORMATS константа, FormatKey, FORMAT_KEYS
  workspace.ts          -- getActiveWorkspaceId / getAdminWorkspaceId (admin-гейт по БД)
  dev-auth.ts           -- isAuthDisabled() (dev-only, gated by NODE_ENV)
  utils.ts              -- cn и пр.

/components
  /ui                   -- shadcn/base-nova компоненты
  generation-grid.tsx   -- сетка карточек сгенерированных макетов (превью + скачать)

/messages
  en.json               -- English (auth, nav, common, gallery)
  ru.json               -- Russian (те же ключи)

/i18n
  request.ts            -- next-intl server config, cookie-based locale

/supabase
  /migrations
    001_initial.sql     -- полная схема БД
    002_brand_materials.sql -- brand_materials + приватный бакет brand-materials
    003_generated_bucket.sql -- приватный бакет generated (HTML + превью сохранённых генераций)

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

## Флоу генерации (прототип — реализован)

Один формат, синхронный ответ. Батчи/очередь/публикация — Phase 2+.

```
POST /api/generate   (runtime: nodejs, maxDuration: 300)
  → auth (getUser) или DISABLE_AUTH (dev) → workspace_id
  → brandbook воркспейса (tokens + context)
  → getExemplars(workspace, format) + loadReferenceImages()
       — до 3 референс-макетов из brand_materials (best-effort; ошибки → пропуск, генерация не падает)
  → buildPrompt() — SYSTEM_PROMPT + design_system (приоритетный блок) + формат + запрос
  → провайдер (GENERATION_PROVIDER):
       openai    → generateHtmlOpenAI(assembled, references)  (референсы = image_url)
       anthropic → generateHtml(assembled, references)        (референсы = image blocks)
       MOCK_GENERATION=1 → buildMockHtml() (без API, dev)
  → extractHtml() + validateHtml() (пре-фильтр; настоящая граница SSRF — слой рендера)
  → подстановка legal вместо {{LEGAL}} (в возвращаемом/хранимом HTML плейсхолдер остаётся — макеты чистые)
  → Puppeteer renderPreview() → JPEG data-URI
  → saveGeneration(): batch (draft) + batch_item (preview_ready) + HTML/превью в бакет 'generated' + asset (best-effort)
  → { preview, html, id }
```

Экспорт (кнопка «Скачать» в /new и галерее):

```
GET /api/export/[id]
  → getGenerationForExport(): чистый HTML из бакета 'generated' (scoped по workspace)
  → re-stamp legal вместо {{LEGAL}}
  → Puppeteer renderFinal() → PNG (digital) / PDF (print)
  → attachment (Content-Disposition)
```

Публикация в галерею (draft→published), батч из нескольких форматов, Realtime, лимиты (`check_and_increment_limit`) — Phase 2+.

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
LOCAL_LIBRARY_DIR               — локальная папка-зеркало скачанных макетов (dev, необязательно)
```

---

## Деплой

**Phase 0-1:** Vercel free tier  
Автодеплой из `main` ветки `GarroV/good-brandbook`.

**Phase 2+ (когда нужен Puppeteer):** Railway или Google Cloud Run  
Dockerfile готов: multi-stage build, Chromium установлен через apt.  
Next.js `output: 'standalone'` настроен в `next.config.ts`.
