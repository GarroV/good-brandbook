# Design Terminal — Changelog

## [Unreleased] — 2026-07-09 — Reference-exemplar library (знание бренда)

### Added
- Таблица `brand_materials` (миграция `002`) + приватный Storage-бакет `brand-materials` — воркспейс-скоуп библиотека референс-макетов/фото продукта; RLS по `workspace_id`
- Админка `/admin/materials` — загрузка/удаление материалов (PNG/JPEG/WebP ≤10 МБ), превью по signed-URL (`page.tsx` + `actions.ts` + `MaterialsManager.tsx`)
- Vision-референсы в генерации: `lib/materials/repository.ts` (`getExemplars`, `loadReferenceImages`) подмешивает до 3 подходящих формату макетов в запрос — OpenAI через `image_url`, Claude через image blocks. Best-effort: пустая/битая библиотека → text-only, генерация не падает
- `REFERENCE_DIRECTIVE` в `lib/claude/prompt.ts` — единая директива для обоих провайдеров
- `lib/workspace.ts` — `getActiveWorkspaceId()` и `getAdminWorkspaceId()`
- i18n: namespace `admin_materials`, nav-ключ `materials` (en + ru)

### Security
- Admin-only server actions авторизуют роль **по БД внутри самого экшена** (не только middleware) для `/admin/materials` и `/admin/brandbook` — закрывает обход через action-ID, вытащенный из `_next/static` и отправленный с разрешённого роута (нашли адверсариал-ревью + внешний security-скан, HIGH)

### Fixed
- Миграция `002` идемпотентна: `drop policy if exists` перед `create policy`

### UI / UX
- Продукт переименован в интерфейсе: «Design Terminal» → **Good Brandbook** (навбар + `<title>`)
- Липкая шапка (`sticky` + blur); навбар/подписи жирнее, `muted-foreground` затемнён для читаемости
- Материалы: размеры формата в селекте (1080×1080…), превью открываются в полный размер по клику, убран неинформативный выбор «тип» (product_photo вернём с hero-слотом)
- Новый роут `/my` (раньше навбар вёл в никуда → падение); галерея и «мои макеты» — честные пустые стейты с пояснением (Материалы = референсы, Галерея = сгенерированное)
- Айдентика: UI-шрифт **Nunito** (скруглённый, с кириллицей; self-hosted через next/font) + оранжевый Dodo `#FF4E00` на primary-кнопках
- Навигация: активный пункт (`aria-current`, клиентский `MainNav`), мобильный горизонтальный скролл, переключатель языка EN/RU (`LangToggle`)
- Материалы: фильтр по формату и рынку + счётчик

### Generation — persistence & export
- Генерация сохраняется: `lib/generations/repository.ts` (`saveGeneration`) пишет batch + batch_item + asset и кладёт чистый HTML + JPEG-превью в приватный бакет `generated` (миграция 003)
- Галерея (весь воркспейс) и «Мои макеты» (свои) показывают сохранённые генерации сеткой (`components/generation-grid.tsx`, превью по signed-URL)
- Экспорт: `GET /api/export/[id]` рендерит финальный PNG (digital) / PDF (print) из сохранённого HTML с re-stamp легала; кнопка «Скачать» в `/new` и галерее
- `/new`: таймер прогресса + подсказка «обычно 15–40 с», селект формата заблокирован во время генерации
- Локальная папка-библиотека (dev): при скачивании файл зеркалится в `LOCAL_LIBRARY_DIR/02 Generated/<format>/` (`lib/library/local.ts`); в prod — no-op
- **Реальные бренд-шрифты**: Rooftop (хедлайны) + Noto Sans (body, кириллица) забраны с Drive в `public/fonts/`, встраиваются `@font-face` data-URI в рендер (`lib/fonts/embed.ts`, инъекция в `render.ts`); токены брендбука → Rooftop/Noto Sans; системный промпт обновлён. Настоящая типографика вместо fallback. (Лицензия: Rooftop — коммерческий, только внутреннее использование; репо не открывать)

### Notes
- Библиотека эталонов засеяна 14 реальными макетами Dodo из Google Drive (a5 ×1, instagram_post ×6, instagram_story ×7; рынки TR/UAE/QA/RU/IMF; `source='gdrive'`); коннектор Drive работает — можно долить ещё
- Saved-генерации сейчас `status='draft'`; когда включим draft-cleanup cron, публикация (draft→published) защитит их от очистки

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
