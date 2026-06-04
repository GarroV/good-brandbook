# Design Terminal — CLAUDE.md

Инструкции для Claude Code. Читать перед любой задачей.

## Стек

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + Puppeteer + Claude API + next-intl

## Абсолютные правила

**База данных:**
- Все таблицы имеют `workspace_id` — всегда фильтровать по нему
- RLS включён на всех таблицах — никогда не использовать service role key на фронте
- Миграции только через Supabase CLI, никогда не менять схему вручную в Dashboard
- Перед любой миграцией — локальное тестирование через `supabase db diff`

**Генерация:**
- Брендбук всегда проверять перед запуском (`tokens` не пустой)
- Лимиты проверять через SQL функцию `check_and_increment_limit` — не в JS коде
- HTML от Claude валидировать через `validateHtml()` перед рендером
- Шрифты только из `/public/fonts/` — никаких запросов к Google Fonts при рендере

**Архитектура:**
- Бизнес-логика живёт в `/lib` — API routes только оркестрируют
- Форматы определены в `/lib/formats/index.ts` — не хардкодить размеры в других местах
- `is_superadmin` проставляется только через Supabase Dashboard — нет UI, нет API

**i18n:**
- Все строки интерфейса через next-intl — никакого хардкода текста в компонентах
- Файлы: `/messages/en.json` и `/messages/ru.json`
- При добавлении новой строки — добавлять в оба файла одновременно

**Безопасность:**
- `SUPABASE_SERVICE_ROLE_KEY` только в серверных роутах (`/app/api/`)
- Никогда не передавать на фронт

## Структура проекта

```
/app/api/          -- API routes
/app/(auth)/       -- страницы логина и инвайта
/app/(app)/        -- защищённые страницы приложения
/app/(superadmin)/ -- только is_superadmin = true
/lib/claude/       -- интеграция с Claude API
/lib/puppeteer/    -- рендер файлов
/lib/supabase/     -- клиент и типы
/lib/formats/      -- константа форматов
/lib/limits/       -- проверка лимитов
/components/       -- React компоненты
/messages/         -- переводы
```

## Команды

```bash
npm run dev          # локальная разработка
npm run build        # сборка
npm run type-check   # проверка TypeScript
supabase start       # локальный Supabase
supabase db diff     # diff миграций
supabase db push     # применить миграции
```

## Переменные окружения

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
SUPERADMIN_EMAIL
```

## Документация проекта

- `MASTER_PROJECT.md` — суть, стек, роли, форматы
- `DATA_MODEL.md` — схема БД, RLS, миграции
- `ARCHITECTURE.md` — структура кода, флоу генерации, промпты
- `ROADMAP.md` — фазы разработки, бэклог
- `BACKLOG.md` — все отложенные задачи и идеи

## При завершении любой задачи

1. Обновить актуальные документы если изменилась архитектура или схема
2. Добавить в `BACKLOG.md` всё что отложили в процессе
3. Коммитить в порядке риска: новый код → миграции → продакшн конфиг последним
