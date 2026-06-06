# Design Terminal — CLAUDE.md

Инструкции для Claude Code. Читать перед любой задачей.

---

## Документация — обязательное правило

**После каждой завершённой задачи:**

1. `CHANGELOG.md` — добавь что сделал в текущую версию
2. `ROADMAP.md` — отметь выполненные пункты (`[ ]` → `[x]`)
3. `ARCHITECTURE.md` — обнови если изменилась структура кода или паттерны
4. `DATA_MODEL.md` — обнови если изменилась схема БД
5. `DECISIONS.md` — добавь если приняли нетривиальное архитектурное решение
6. `BACKLOG.md` — добавь всё отложенное в процессе

**Документация — не опциональная часть задачи, а её завершение.**  
Код без обновлённой документации = незавершённая задача.

---

## Стек (фактический)

Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui (base-nova) + @supabase/ssr + next-intl 4 + Vitest

---

## Абсолютные правила

### База данных
- Все таблицы имеют `workspace_id` — всегда фильтровать по нему
- RLS включён на всех таблицах — никогда не использовать service role key на фронте
- Миграции только через Supabase CLI или Management API, никогда не менять схему вручную в Dashboard Table Editor
- Новую миграцию всегда добавлять в `supabase/migrations/`

### TypeScript типы (lib/supabase/types.ts)
- Все таблицы должны иметь `Relationships: []` — иначе `GenericSchema` check фейлится
- `Database['public']` должен содержать `Views` и `Enums` — иначе supabase-js не типизирует запросы
- `Update` типы писать явно (не через `Partial<Insert>`) — circular reference → `never`

### Supabase клиенты
- `createClient()` из `server.ts` — Server Components, API routes (async)
- `createAdminClient()` из `server.ts` — только в API routes, никогда в клиентском коде
- `createClient()` из `client.ts` — только Client Components (`'use client'`)
- `SUPABASE_SERVICE_ROLE_KEY` — только сервер, никогда в браузер

### Генерация (Phase 2+)
- Брендбук проверять перед запуском (`tokens` не пустой)
- Лимиты проверять через SQL функцию `check_and_increment_limit` — не в JS коде
- HTML от Claude валидировать через `validateHtml()` перед рендером
- Шрифты только из `/public/fonts/` — никаких запросов к Google Fonts при рендере
- Форматы только из `lib/formats/index.ts` — не хардкодить размеры в других местах

### i18n
- Все строки интерфейса через next-intl — никакого хардкода текста в компонентах
- Файлы: `messages/en.json` и `messages/ru.json`
- При добавлении новой строки — добавлять в оба файла одновременно

### Архитектура
- Бизнес-логика живёт в `/lib` — API routes только оркестрируют
- `is_superadmin` проставляется только через Supabase Dashboard SQL — нет UI, нет API

### Middleware
- Использовать `getUser()` для auth check — не `getSession()` (небезопасно для authorization)
- JWT claims (`workspace_id`, `user_role`, `is_superadmin`) читать из `session.access_token`

---

## Структура проекта

```
/app/api/              -- API routes (server only)
/app/(auth)/           -- публичные страницы (login, invite)
/app/(app)/            -- защищённые страницы
/app/(superadmin)/     -- только is_superadmin = true (Phase 5)
/lib/claude/           -- интеграция с Claude API (Phase 2)
/lib/puppeteer/        -- рендер файлов (Phase 2)
/lib/supabase/         -- клиент и типы
/lib/formats/          -- константа форматов
/lib/limits/           -- проверка лимитов (Phase 2)
/components/           -- React компоненты
/messages/             -- переводы
/true_brandbook/       -- документация проекта
```

---

## Команды

```bash
npm run dev          # локальная разработка
npm run build        # сборка
npm run type-check   # проверка TypeScript
npm test             # unit тесты (Vitest)
```

---

## Supabase Management (без CLI)

```bash
# Выполнить SQL через Management API
curl -X POST "https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query" \
  -H "Authorization: Bearer {PAT}" \
  -H "Content-Type: application/json" \
  -d '{"query": "..."}'
```

PAT создаётся на `supabase.com/dashboard/account/tokens`.  
Текущий проект: `kuzxmhthtwzbenrxxuvh` (Good_Branbook).

---

## Документация проекта

| Файл | Содержание |
|------|-----------|
| `SETUP.md` | Онбординг с нуля — для нового человека |
| `MASTER_PROJECT.md` | Суть, стек, роли, форматы |
| `ARCHITECTURE.md` | Структура кода, флоу, паттерны |
| `DATA_MODEL.md` | Схема БД, RLS, миграции |
| `DECISIONS.md` | Архитектурные решения с обоснованием |
| `ROADMAP.md` | Фазы разработки |
| `BACKLOG.md` | Отложенные задачи и идеи |
| `CHANGELOG.md` | История изменений |
