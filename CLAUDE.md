# good-brandbook (Design Terminal) — инструкции для Claude Code

Веб-сервис генерации маркетинговых макетов по брендбуку.
Стек: **Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui (base-nova) + @supabase/ssr + next-intl 4 + Vitest**. Деплой — Railway (Docker, Puppeteer+Chromium).

---

## Перед изменением кода

1. **Прочитай `true_brandbook/CLAUDE.md`** — это основной свод правил проекта (БД, типы, Supabase-клиенты, i18n, middleware). За деталями:
   - `true_brandbook/ARCHITECTURE.md` — структура кода, флоу, паттерны
   - `true_brandbook/DATA_MODEL.md` — схема БД, RLS, миграции
   - `true_brandbook/MASTER_PROJECT.md` — суть, роли, форматы
   - `true_brandbook/DECISIONS.md` — почему сделано так
2. Этот проект — **Next.js 16 с breaking changes** (см. `AGENTS.md`). Перед написанием кода сверяйся с `node_modules/next/dist/docs/`, не полагайся на устаревшее знание API.
3. **Type-check перед коммитом:** `npm run type-check` (`tsc --noEmit`). Красный type-check не коммитим и не пушим.
4. Доки в `true_brandbook/` держать актуальными. Если флоу/схема/паттерн изменились, а док нет — задача не завершена (см. правило документации в `true_brandbook/CLAUDE.md`).

---

## Команды

```bash
npm run dev          # локальная разработка
npm run build        # production-сборка (Next standalone)
npm run type-check   # tsc --noEmit
npm run lint         # next lint (ESLint 9)
npm test             # unit-тесты (Vitest, один прогон)
npm run test:watch   # Vitest в watch-режиме
```

---

## Git и коммиты

- **Не коммитить напрямую в `main`.** Любое изменение — фича-ветка → PR в `main`.
- **Conventional commits строго:** `feat/fix/refactor/docs/test/chore/perf/ci` + понятное описание по сути. Commit-сообщения = источник истории и changelog.
- **Коммит = одно логически завершённое изменение.** После завершения — сразу коммит и пуш, не накапливать.
- Перед коммитом: `npm run type-check` (красный — не коммитим).

---

## Безопасность

### Секреты и env
- Секреты **никогда** в коде — только env (`.env.local`, локально) или менеджер секретов Railway. `.env*` в `.gitignore` — не коммитить.
- Шаблон переменных — `.env.local.example`. Ключевые: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPERADMIN_EMAIL`.
- `SUPABASE_SERVICE_ROLE_KEY` — **только серверный код** (API routes через `createAdminClient()`). Никогда в Client Components и браузер. `NEXT_PUBLIC_*` уходит в бандл — туда только публичные значения.
- Валидировать вход на границах (API routes, server actions, формы) перед обработкой.

### База данных (Supabase, RLS включён)
- RLS реально защищает — у всех таблиц есть `workspace_id`, **всегда фильтровать по нему**. Не обходить RLS service-role-ключом на фронте.
- Миграции — только через Supabase CLI / Management API, файлом в `supabase/migrations/`. Схему не править руками в Dashboard Table Editor.
- `ADD COLUMN` безопасно. `DROP/RENAME COLUMN`, `ALTER TYPE` — **в два шага**: убрать из кода → деплой → потом менять схему.
- Никогда `DELETE`/`UPDATE` без `WHERE` — даже в миграциях.
- Авторизация в middleware — через `getUser()` (валидируется сервером), не `getSession()` для решений о доступе.

### Деплой
- Railway собирает Docker-образ (`Dockerfile`, Next `output: 'standalone'`, Chromium для Puppeteer). Сборка должна проходить `npm run build` чисто.

---

## Карта проекта

```
app/(auth)/        — публичные страницы: login (email OTP), invite/[token]
app/(app)/         — защищённые страницы (галерея, генерация)
app/api/           — API routes (server only)
lib/supabase/      — клиенты (client/server/admin) + типы (types.ts)
lib/formats/       — константа выходных форматов (единственный источник размеров)
lib/utils.ts       — общие утилиты (cn и пр.)
components/ui/     — shadcn-компоненты (base-nova)
i18n/, messages/   — next-intl: en.json + ru.json (новую строку — сразу в оба)
middleware.ts      — auth-гейт + проверка ролей по JWT-claims
supabase/migrations/ — SQL-миграции
true_brandbook/    — вся документация проекта (читать перед задачей)
__tests__/         — Vitest
```

> Подробные правила по типам `lib/supabase/types.ts`, клиентам Supabase, генерации и i18n — в `true_brandbook/CLAUDE.md`. Этот файл — точка входа; не дублируй, ссылайся.
