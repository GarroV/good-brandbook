# Phase 0: Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Working Next.js 15 app with Supabase auth (email OTP login + invite acceptance), complete DB schema with RLS, role-based route protection, and Railway-ready Dockerfile.

**Architecture:** Next.js 15 App Router with route groups `(auth)` / `(app)`. Supabase Auth via `@supabase/ssr` for session management. Middleware reads JWT custom claims (workspace_id, role, is_superadmin) for route protection. Auth trigger auto-creates `public.users` row on invite acceptance. All 9 DB tables have `workspace_id` + RLS from day one.

**Tech Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, shadcn/ui, @supabase/ssr, @supabase/supabase-js, next-intl 4, Vitest, Railway (Docker with Chromium)

---

## File Map

| Path | Purpose |
|------|---------|
| `package.json` | All dependencies |
| `next.config.ts` | next-intl plugin |
| `tsconfig.json` | Strict TypeScript |
| `vitest.config.ts` | Test runner config |
| `middleware.ts` | Auth + role protection |
| `i18n/request.ts` | next-intl server config |
| `messages/en.json` | English strings |
| `messages/ru.json` | Russian strings |
| `lib/supabase/server.ts` | SSR Supabase client (server components + API routes) |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/types.ts` | TypeScript DB types (hand-written from schema) |
| `lib/formats/index.ts` | Output format constants |
| `app/layout.tsx` | Root HTML layout |
| `app/(auth)/login/page.tsx` | Email OTP login page |
| `app/(auth)/login/actions.ts` | Server actions: send OTP, verify OTP |
| `app/(auth)/invite/[token]/page.tsx` | Invite acceptance page |
| `app/(auth)/invite/[token]/actions.ts` | Server action: accept invite |
| `app/api/invites/[token]/route.ts` | GET — validate invite token (public) |
| `app/(app)/layout.tsx` | Protected layout with top nav |
| `app/(app)/page.tsx` | Gallery placeholder |
| `supabase/migrations/001_initial.sql` | Complete schema + RLS + functions |
| `__tests__/formats.test.ts` | Formats unit test |
| `Dockerfile` | Railway deploy with Chromium/Puppeteer |
| `.env.local.example` | Required env vars documentation |

---

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Init project in repo root**

Run from `/Users/garva/good-brandbook/`:
```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --no-import-alias \
  --eslint \
  --turbopack \
  --yes
```
Expected: project files created (package.json, app/, etc.). The existing `true_brandbook/` dir is untouched.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr next-intl
npm install -D vitest @vitest/ui
```

- [ ] **Step 3: Init shadcn/ui**

```bash
npx shadcn@latest init --defaults
```
When prompted: style=default, base color=slate, CSS variables=yes.

- [ ] **Step 4: Add shadcn components needed for Phase 0**

```bash
npx shadcn@latest add button input label card form badge separator
```

- [ ] **Step 5: Update package.json scripts**

Open `package.json`, replace the `"scripts"` section with:
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 6: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    environment: 'node'
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') }
  }
})
```

- [ ] **Step 7: Verify TypeScript strict mode**

Open `tsconfig.json`, confirm `"strict": true` is present. If not, add it under `"compilerOptions"`.

- [ ] **Step 8: Run type-check (expect zero errors)**

```bash
npm run type-check
```
Expected: exits 0 with no output (or minor shadcn warnings — ignore).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 15 + shadcn + Supabase + next-intl + Vitest"
```

---

## Task 2: Configure next-intl

**Files:**
- Create: `i18n/request.ts`
- Modify: `next.config.ts`
- Create: `messages/en.json`
- Create: `messages/ru.json`

- [ ] **Step 1: Create i18n/request.ts**

```typescript
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'
  const validLocales = ['en', 'ru']
  const resolvedLocale = validLocales.includes(locale) ? locale : 'en'

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  }
})
```

- [ ] **Step 2: Update next.config.ts**

Replace the entire file content:
```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  }
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 3: Create messages/en.json**

```json
{
  "auth": {
    "login": {
      "title": "Sign in to Design Terminal",
      "email_label": "Email address",
      "email_placeholder": "you@company.com",
      "submit": "Send sign-in link",
      "sending": "Sending...",
      "check_email_title": "Check your email",
      "check_email_desc": "We sent a 6-digit code to {email}",
      "code_label": "Verification code",
      "code_placeholder": "123456",
      "verify": "Sign in",
      "verifying": "Verifying...",
      "back": "Use a different email",
      "invalid_email": "Please enter a valid email",
      "invalid_code": "Invalid or expired code"
    },
    "invite": {
      "title": "You've been invited",
      "subtitle": "Join {workspace} as {role}",
      "name_label": "Your full name",
      "name_placeholder": "Jane Smith",
      "email_label": "Email",
      "submit": "Accept & continue",
      "submitting": "Accepting...",
      "invalid": "This invite is invalid or has expired",
      "already_accepted": "This invite has already been accepted",
      "success_title": "Invite accepted!",
      "success_desc": "Check your email at {email} for a sign-in link."
    }
  },
  "nav": {
    "gallery": "Gallery",
    "new": "New layout",
    "my": "My layouts",
    "admin": "Admin",
    "sign_out": "Sign out"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong. Please try again.",
    "back_to_home": "Back to home"
  },
  "gallery": {
    "title": "Gallery",
    "empty": "No layouts yet. Create your first one.",
    "create_first": "Create layout"
  }
}
```

- [ ] **Step 4: Create messages/ru.json**

```json
{
  "auth": {
    "login": {
      "title": "Войти в Design Terminal",
      "email_label": "Email адрес",
      "email_placeholder": "you@company.com",
      "submit": "Отправить ссылку для входа",
      "sending": "Отправляем...",
      "check_email_title": "Проверьте почту",
      "check_email_desc": "Мы отправили 6-значный код на {email}",
      "code_label": "Код подтверждения",
      "code_placeholder": "123456",
      "verify": "Войти",
      "verifying": "Проверяем...",
      "back": "Использовать другой email",
      "invalid_email": "Введите корректный email",
      "invalid_code": "Неверный или просроченный код"
    },
    "invite": {
      "title": "Вас пригласили",
      "subtitle": "Присоединиться к {workspace} как {role}",
      "name_label": "Ваше полное имя",
      "name_placeholder": "Иван Иванов",
      "email_label": "Email",
      "submit": "Принять и продолжить",
      "submitting": "Принимаем...",
      "invalid": "Это приглашение недействительно или истекло",
      "already_accepted": "Это приглашение уже принято",
      "success_title": "Приглашение принято!",
      "success_desc": "Проверьте почту {email} — там ссылка для входа."
    }
  },
  "nav": {
    "gallery": "Галерея",
    "new": "Новый макет",
    "my": "Мои макеты",
    "admin": "Управление",
    "sign_out": "Выйти"
  },
  "common": {
    "loading": "Загрузка...",
    "error": "Что-то пошло не так. Попробуйте снова.",
    "back_to_home": "На главную"
  },
  "gallery": {
    "title": "Галерея",
    "empty": "Макетов пока нет. Создайте первый.",
    "create_first": "Создать макет"
  }
}
```

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add i18n/ messages/ next.config.ts
git commit -m "feat: configure next-intl with EN/RU messages"
```

---

## Task 3: DB Schema Migration

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create migration directory**

```bash
mkdir -p supabase/migrations
```

- [ ] **Step 2: Write the complete migration**

Create `supabase/migrations/001_initial.sql`:

```sql
-- =====================================================
-- Design Terminal — Initial Schema
-- =====================================================

-- Tables

create table workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz default now()
);

create table users (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  name          text not null,
  email         text unique not null,
  role          text default 'member' check (role in ('admin', 'member')),
  is_superadmin boolean default false,
  created_at    timestamptz default now()
);

create table brandbook (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid unique references workspaces(id) on delete cascade,
  tokens       jsonb not null default '{}',
  assets       jsonb not null default '{}',
  context      text,
  updated_at   timestamptz default now()
);

create table batches (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid references workspaces(id) on delete cascade,
  user_id            uuid references users(id),
  prompt             text not null,
  reference_batch_id uuid references batches(id),
  status             text default 'draft' check (status in ('draft', 'published')),
  created_at         timestamptz default now()
);

create table batch_items (
  id           uuid primary key default gen_random_uuid(),
  batch_id     uuid references batches(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  format       text not null,
  html_url     text,
  status       text default 'pending' check (
    status in ('pending', 'generating', 'preview_ready', 'exporting', 'done', 'failed')
  ),
  created_at   timestamptz default now()
);

create table assets (
  id            uuid primary key default gen_random_uuid(),
  batch_item_id uuid references batch_items(id) on delete cascade,
  workspace_id  uuid references workspaces(id) on delete cascade,
  type          text check (type in ('jpeg_preview', 'png_final', 'pdf')),
  url           text not null,
  created_at    timestamptz default now()
);

create table invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  email        text not null,
  role         text default 'member' check (role in ('admin', 'member')),
  token        text unique not null default gen_random_uuid()::text,
  accepted_at  timestamptz,
  expires_at   timestamptz default now() + interval '7 days',
  created_at   timestamptz default now()
);

create table workspace_limits (
  workspace_id    uuid primary key references workspaces(id),
  monthly_batches int default 100,
  daily_per_user  int default 20,
  bonus_batches   int default 0,
  reset_at        timestamptz default date_trunc('month', now()) + interval '1 month'
);

create table activity_feed (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references users(id),
  format       text,
  action       text check (action in ('generated', 'published')),
  created_at   timestamptz default now()
);

create table generation_log (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id      uuid not null,
  format       text not null,
  created_at   timestamptz default now()
);

-- =====================================================
-- Row Level Security
-- =====================================================

alter table workspaces      enable row level security;
alter table users            enable row level security;
alter table brandbook        enable row level security;
alter table batches          enable row level security;
alter table batch_items      enable row level security;
alter table assets           enable row level security;
alter table invites          enable row level security;
alter table workspace_limits enable row level security;
alter table activity_feed    enable row level security;
alter table generation_log   enable row level security;

-- Helper: returns current user's workspace_id without subquery overhead
create or replace function my_workspace_id()
returns uuid
language sql
security definer
stable
as $$
  select workspace_id from public.users where id = auth.uid()
$$;

-- Users: only see own workspace
create policy "workspace_isolation" on users
  using (workspace_id = my_workspace_id());

-- Brandbook: only own workspace
create policy "workspace_isolation" on brandbook
  using (workspace_id = my_workspace_id());

-- Batches: drafts only for author, published visible to whole workspace
create policy "batch_access" on batches
  using (
    workspace_id = my_workspace_id()
    and (status = 'published' or user_id = auth.uid())
  );

-- Batch items, assets, activity — workspace isolation
create policy "workspace_isolation" on batch_items
  using (workspace_id = my_workspace_id());

create policy "workspace_isolation" on assets
  using (workspace_id = my_workspace_id());

create policy "workspace_isolation" on activity_feed
  using (workspace_id = my_workspace_id());

create policy "workspace_isolation" on workspace_limits
  using (workspace_id = my_workspace_id());

create policy "workspace_isolation" on generation_log
  using (workspace_id = my_workspace_id());

-- Invites: members can see their workspace invites;
-- token lookup is done server-side with service role key (bypasses RLS)
create policy "workspace_members_read" on invites
  using (workspace_id = my_workspace_id());

-- =====================================================
-- Custom Access Token Hook
-- Adds workspace_id, user_role, is_superadmin to JWT
-- MANUAL STEP REQUIRED: register in Supabase Dashboard
--   Authentication → Hooks → Custom Access Token Hook
--   → select function: public.custom_access_token_hook
-- =====================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  claims         jsonb;
  v_workspace_id uuid;
  v_role         text;
  v_is_superadmin boolean;
begin
  select workspace_id, role, is_superadmin
  into v_workspace_id, v_role, v_is_superadmin
  from public.users
  where id = (event->>'user_id')::uuid;

  claims := event -> 'claims';

  if found then
    claims := jsonb_set(claims, '{workspace_id}', to_jsonb(v_workspace_id::text));
    claims := jsonb_set(claims, '{user_role}',    to_jsonb(v_role));
    claims := jsonb_set(claims, '{is_superadmin}', to_jsonb(v_is_superadmin));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- =====================================================
-- Trigger: auto-create public.users on invite acceptance
-- When createUser() is called with user_metadata containing
-- workspace_id, name, role — this trigger fires.
-- =====================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.raw_user_meta_data ->> 'workspace_id' is not null then
    insert into public.users (id, workspace_id, name, email, role)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'workspace_id')::uuid,
      coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
      new.email,
      coalesce(new.raw_user_meta_data ->> 'role', 'member')
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- =====================================================
-- check_and_increment_limit (used in Phase 2 generate API)
-- =====================================================

create or replace function check_and_increment_limit(
  p_workspace_id uuid,
  p_user_id      uuid
) returns void
language plpgsql
as $$
declare
  v_limits       workspace_limits;
  v_monthly_used int;
  v_daily_used   int;
begin
  select * into v_limits
  from workspace_limits
  where workspace_id = p_workspace_id
  for update;

  select count(*) into v_monthly_used
  from generation_log
  where workspace_id = p_workspace_id
    and created_at > date_trunc('month', now());

  select count(*) into v_daily_used
  from generation_log
  where user_id = p_user_id
    and created_at > date_trunc('day', now());

  if v_monthly_used >= (v_limits.monthly_batches + v_limits.bonus_batches) then
    raise exception 'monthly_limit_exceeded';
  end if;

  if v_daily_used >= v_limits.daily_per_user then
    raise exception 'daily_limit_exceeded';
  end if;

  insert into generation_log (workspace_id, user_id, format)
  values (p_workspace_id, p_user_id, 'batch');
end;
$$;

-- =====================================================
-- Draft cleanup cron (runs at 3am daily, requires pg_cron)
-- pg_cron is enabled by default on Supabase projects
-- =====================================================

select cron.schedule('cleanup-drafts', '0 3 * * *', $$
  delete from batches
  where status = 'draft'
    and created_at < now() - interval '3 days';
$$);
```

- [ ] **Step 3: Apply migration via Supabase MCP**

Use the `mcp__plugin_supabase_supabase__apply_migration` tool with:
- `name`: `001_initial`
- `query`: (contents of the SQL file above)

If MCP is unavailable, use CLI:
```bash
supabase db push
```

- [ ] **Step 4: Create Storage buckets**

Use `mcp__plugin_supabase_supabase__execute_sql` to run:
```sql
insert into storage.buckets (id, name, public) values
  ('html-sources', 'html-sources', false),
  ('assets',       'assets',       true),
  ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

-- Assets bucket: workspace members can read/write their own files
create policy "workspace_read" on storage.objects
  for select using (
    bucket_id in ('assets', 'brand-assets')
    and (storage.foldername(name))[1] = (my_workspace_id())::text
  );

create policy "workspace_write" on storage.objects
  for insert with check (
    bucket_id in ('assets', 'brand-assets', 'html-sources')
    and (storage.foldername(name))[1] = (my_workspace_id())::text
  );
```

- [ ] **Step 5: Verify tables exist**

Use `mcp__plugin_supabase_supabase__list_tables` tool and confirm these tables are listed:
`workspaces, users, brandbook, batches, batch_items, assets, invites, workspace_limits, activity_feed, generation_log`

- [ ] **Step 6: Register custom access token hook (MANUAL)**

In Supabase Dashboard:
1. Go to **Authentication → Hooks**
2. Find **Custom Access Token Hook**
3. Set to Postgres Function: `public.custom_access_token_hook`
4. Save

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add complete DB schema, RLS policies, auth hooks"
```

---

## Task 4: Supabase Client Utilities + TypeScript Types

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/types.ts`

- [ ] **Step 1: Create lib/supabase/types.ts**

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: { id: string; name: string; slug: string; created_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }
      users: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string
          role: 'admin' | 'member'
          is_superadmin: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email: string
          role?: 'admin' | 'member'
          is_superadmin?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      brandbook: {
        Row: {
          id: string
          workspace_id: string
          tokens: Json
          assets: Json
          context: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          tokens?: Json
          assets?: Json
          context?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['brandbook']['Insert']>
      }
      batches: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          prompt: string
          reference_batch_id: string | null
          status: 'draft' | 'published'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          prompt: string
          reference_batch_id?: string | null
          status?: 'draft' | 'published'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['batches']['Insert']>
      }
      batch_items: {
        Row: {
          id: string
          batch_id: string
          workspace_id: string
          format: string
          html_url: string | null
          status: 'pending' | 'generating' | 'preview_ready' | 'exporting' | 'done' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          workspace_id: string
          format: string
          html_url?: string | null
          status?: 'pending' | 'generating' | 'preview_ready' | 'exporting' | 'done' | 'failed'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['batch_items']['Insert']>
      }
      assets: {
        Row: {
          id: string
          batch_item_id: string
          workspace_id: string
          type: 'jpeg_preview' | 'png_final' | 'pdf'
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          batch_item_id: string
          workspace_id: string
          type: 'jpeg_preview' | 'png_final' | 'pdf'
          url: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }
      invites: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: 'admin' | 'member'
          token: string
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role?: 'admin' | 'member'
          token?: string
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invites']['Insert']>
      }
      workspace_limits: {
        Row: {
          workspace_id: string
          monthly_batches: number
          daily_per_user: number
          bonus_batches: number
          reset_at: string
        }
        Insert: {
          workspace_id: string
          monthly_batches?: number
          daily_per_user?: number
          bonus_batches?: number
          reset_at?: string
        }
        Update: Partial<Database['public']['Tables']['workspace_limits']['Insert']>
      }
      activity_feed: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          format: string | null
          action: 'generated' | 'published'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          format?: string | null
          action: 'generated' | 'published'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['activity_feed']['Insert']>
      }
      generation_log: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          format: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          format: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['generation_log']['Insert']>
      }
    }
    Functions: {
      check_and_increment_limit: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: undefined
      }
      my_workspace_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
```

- [ ] **Step 2: Create lib/supabase/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies are read-only.
            // Session refresh happens in middleware.
          }
        }
      }
    }
  )
}

export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

- [ ] **Step 3: Create lib/supabase/client.ts**

```typescript
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Run type-check**

```bash
npm run type-check
```
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase client utilities and TypeScript types"
```

---

## Task 5: Formats Constant + Test

**Files:**
- Create: `__tests__/formats.test.ts`
- Create: `lib/formats/index.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/formats.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { FORMATS, FORMAT_KEYS } from '../lib/formats/index'

describe('FORMATS', () => {
  it('contains all 7 formats', () => {
    expect(FORMAT_KEYS).toHaveLength(7)
    expect(FORMAT_KEYS).toContain('a4')
    expect(FORMAT_KEYS).toContain('a5')
    expect(FORMAT_KEYS).toContain('instagram_post')
    expect(FORMAT_KEYS).toContain('instagram_story')
    expect(FORMAT_KEYS).toContain('tv_board')
    expect(FORMAT_KEYS).toContain('youtube_preview')
    expect(FORMAT_KEYS).toContain('twitter_post')
  })

  it('every format has valid dimensions and output type', () => {
    for (const key of FORMAT_KEYS) {
      const fmt = FORMATS[key]
      expect(fmt.width).toBeGreaterThan(0)
      expect(fmt.height).toBeGreaterThan(0)
      expect(['pdf', 'png']).toContain(fmt.output)
      expect(['print', 'digital']).toContain(fmt.category)
      expect(fmt.label).toBeTruthy()
    }
  })

  it('a4 is 794x1123 PDF', () => {
    expect(FORMATS.a4).toMatchObject({ width: 794, height: 1123, output: 'pdf' })
  })

  it('instagram_post is 1080x1080 PNG', () => {
    expect(FORMATS.instagram_post).toMatchObject({ width: 1080, height: 1080, output: 'png' })
  })

  it('tv_board is 1920x1080', () => {
    expect(FORMATS.tv_board).toMatchObject({ width: 1920, height: 1080 })
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```
Expected: FAIL — `Cannot find module '../lib/formats/index'`

- [ ] **Step 3: Create lib/formats/index.ts**

```typescript
export const FORMATS = {
  a4: {
    label: 'A4',
    width: 794,
    height: 1123,
    output: 'pdf' as const,
    category: 'print' as const
  },
  a5: {
    label: 'A5',
    width: 559,
    height: 794,
    output: 'pdf' as const,
    category: 'print' as const
  },
  instagram_post: {
    label: 'Instagram Post',
    width: 1080,
    height: 1080,
    output: 'png' as const,
    category: 'digital' as const
  },
  instagram_story: {
    label: 'Instagram Story',
    width: 1080,
    height: 1920,
    output: 'png' as const,
    category: 'digital' as const
  },
  tv_board: {
    label: 'TV Board',
    width: 1920,
    height: 1080,
    output: 'png' as const,
    category: 'digital' as const
  },
  youtube_preview: {
    label: 'YouTube Preview',
    width: 1280,
    height: 720,
    output: 'png' as const,
    category: 'digital' as const
  },
  twitter_post: {
    label: 'Twitter / X',
    width: 1200,
    height: 675,
    output: 'png' as const,
    category: 'digital' as const
  }
} as const

export type FormatKey = keyof typeof FORMATS
export type Format = (typeof FORMATS)[FormatKey]
export const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[]
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm test
```
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/formats/ __tests__/
git commit -m "feat: add format constants with unit tests"
```

---

## Task 6: Middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

function parseJwtClaims(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/api/invites') ||
    pathname === '/favicon.ico'

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    const claims = parseJwtClaims(session.access_token)
    const role = (claims.user_role as string) ?? 'member'
    const isSuperadmin = Boolean(claims.is_superadmin)

    if (pathname.startsWith('/superadmin') && !isSuperadmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/admin') && role !== 'admin' && !isSuperadmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|fonts|icons|.*\\.png$|.*\\.ico$).*)']
}
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add route protection middleware with JWT claims"
```

---

## Task 7: App Layout + .env.local

**Files:**
- Modify: `app/layout.tsx`
- Create: `.env.local` (from example)
- Create: `.env.local.example`

- [ ] **Step 1: Create .env.local.example**

```bash
cat > .env.local.example << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Email
RESEND_API_KEY=re_...

# Superadmin bootstrap
SUPERADMIN_EMAIL=admin@yourcompany.com
EOF
```

- [ ] **Step 2: Create .env.local with real values**

Copy the example and fill in your Supabase credentials from Dashboard → Settings → API:
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` with actual values. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set before continuing.

- [ ] **Step 3: Add .env.local to .gitignore**

Verify `.gitignore` contains `.env.local`. If not:
```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 4: Update app/layout.tsx**

Replace the file content:
```tsx
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Design Terminal',
  description: 'Generate brand-compliant marketing layouts'
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx .env.local.example .gitignore
git commit -m "feat: root layout with next-intl provider, env setup"
```

---

## Task 8: Login Page (Email OTP Flow)

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/login/actions.ts`

The login is a two-step flow: (1) enter email → receive OTP code, (2) enter code → signed in.

- [ ] **Step 1: Create app/(auth)/login/actions.ts**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendOtp(email: string): Promise<{ error?: string }> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'invalid_email' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  })

  if (error) {
    // "Email not confirmed" means user doesn't exist → not invited
    return { error: 'invalid_email' }
  }

  return {}
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<{ error?: string }> {
  if (!token || token.length !== 6) {
    return { error: 'invalid_code' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  })

  if (error) {
    return { error: 'invalid_code' }
  }

  redirect('/')
}
```

- [ ] **Step 2: Create app/(auth)/login/page.tsx**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendOtp, verifyOtp } from './actions'

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await sendOtp(email)
      if (result.error) {
        setError(t(result.error as 'invalid_email'))
      } else {
        setStep('code')
      }
    })
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await verifyOtp(email, code)
      if (result?.error) {
        setError(t(result.error as 'invalid_code'))
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          {step === 'code' && (
            <CardDescription>
              {t('check_email_desc', { email })}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email_label')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t('sending') : t('submit')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('code_label')}</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('code_placeholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t('verifying') : t('verify')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => { setStep('email'); setCode(''); setError('') }}
              >
                {t('back')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Run type-check**

```bash
npm run type-check
```
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: email OTP login page with two-step flow"
```

---

## Task 9: Invite Acceptance Flow

**Files:**
- Create: `app/api/invites/[token]/route.ts`
- Create: `app/(auth)/invite/[token]/page.tsx`
- Create: `app/(auth)/invite/[token]/actions.ts`

Flow: user lands on `/invite/[token]` → sees workspace info → submits name → server creates their auth account + marks invite accepted → redirects to login with "check your email" message.

- [ ] **Step 1: Create app/api/invites/[token]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, email, role, accepted_at, expires_at, workspace_id, workspaces(name)')
    .eq('token', token)
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'invalid' }, { status: 404 })
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: 'already_accepted' }, { status: 410 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'invalid' }, { status: 410 })
  }

  const workspace = invite.workspaces as { name: string } | null

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    workspace: workspace?.name ?? 'Design Terminal'
  })
}
```

- [ ] **Step 2: Create app/(auth)/invite/[token]/actions.ts**

```typescript
'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function acceptInvite(
  token: string,
  name: string
): Promise<{ error?: string }> {
  if (!name.trim()) return { error: 'Name is required' }

  const admin = createAdminClient()

  // Re-validate invite
  const { data: invite, error: fetchError } = await admin
    .from('invites')
    .select('id, email, role, accepted_at, expires_at, workspace_id')
    .eq('token', token)
    .single()

  if (fetchError || !invite) return { error: 'invalid' }
  if (invite.accepted_at) return { error: 'already_accepted' }
  if (new Date(invite.expires_at) < new Date()) return { error: 'invalid' }

  // Create auth user with metadata — trigger will create public.users row
  const { error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    email_confirm: true,
    user_metadata: {
      workspace_id: invite.workspace_id,
      name: name.trim(),
      role: invite.role
    }
  })

  // If user already exists (re-accepting), that's ok
  if (createError && !createError.message.includes('already been registered')) {
    return { error: 'invite_failed' }
  }

  // Mark invite accepted
  await admin
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  // Send OTP so they can sign in
  await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: invite.email
  })

  return {}
}
```

- [ ] **Step 3: Create app/(auth)/invite/[token]/page.tsx**

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { acceptInvite } from './actions'

interface InviteData {
  email: string
  role: string
  workspace: string
}

export default function InvitePage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const t = useTranslations('auth.invite')
  const [token, setToken] = useState('')
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [name, setName] = useState('')
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t)
      fetch(`/api/invites/${t}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) setFetchError(t_('auth.invite.' + data.error) ?? data.error)
          else setInvite(data)
        })
        .catch(() => setFetchError(t('invalid')))
    })
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    startTransition(async () => {
      const result = await acceptInvite(token, name)
      if (result.error) {
        setSubmitError(t((result.error as 'invalid') ?? 'invalid'))
      } else {
        setDone(true)
      }
    })
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-destructive">{t('invalid')}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (done && invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{t('success_title')}</CardTitle>
            <CardDescription>{t('success_desc', { email: invite.email })}</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/login">
              <Button className="w-full">Sign in</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('loading') ?? 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle', { workspace: invite.workspace, role: invite.role })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('email_label')}</Label>
              <Input value={invite.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('name_label')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t('submitting') : t('submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

Note: the `t_` reference in the `useEffect` is a bug — fix by removing it (just use the literal string for fetch errors). Change the `.then` callback to:
```typescript
.then((data) => {
  if (data.error) setFetchError(data.error === 'already_accepted' ? t('already_accepted') : t('invalid'))
  else setInvite(data)
})
```

- [ ] **Step 4: Run type-check**

```bash
npm run type-check
```
Expected: exits 0. Fix any errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add app/api/ app/\(auth\)/invite/
git commit -m "feat: invite acceptance page and API route"
```

---

## Task 10: Protected Layout + Gallery Placeholder

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/page.tsx`

- [ ] **Step 1: Create app/(app)/layout.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, is_superadmin')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const t = await getTranslations('nav')

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const isAdmin = profile.role === 'admin' || profile.is_superadmin

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <span className="font-semibold text-sm">Design Terminal</span>
            <Separator orientation="vertical" className="h-4" />
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              {t('gallery')}
            </Link>
            <Link href="/new" className="text-sm text-muted-foreground hover:text-foreground">
              {t('new')}
            </Link>
            <Link href="/my" className="text-sm text-muted-foreground hover:text-foreground">
              {t('my')}
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                {t('admin')}
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile.name}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                {t('sign_out')}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create app/(app)/page.tsx**

```tsx
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function GalleryPage() {
  const t = await getTranslations('gallery')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('empty')}</p>
      <Link href="/new">
        <Button>{t('create_first')}</Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Run type-check**

```bash
npm run type-check
```
Expected: exits 0. Fix any errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/
git commit -m "feat: protected app layout with nav, gallery placeholder"
```

---

## Task 11: Dockerfile + Environment Setup

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-slim AS base

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto \
    ca-certificates \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Step 2: Enable Next.js standalone output**

Open `next.config.ts` and add `output: 'standalone'` to the config object:
```typescript
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  }
}
```

- [ ] **Step 3: Create .dockerignore**

```
node_modules
.next
.git
.env*
true_brandbook
docs
__tests__
*.md
Dockerfile
.dockerignore
```

- [ ] **Step 4: Run type-check + build locally**

```bash
npm run type-check && npm run build
```
Expected: both succeed. Fix any build errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore next.config.ts
git commit -m "feat: Dockerfile for Railway with Chromium, standalone output"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: 5/5 tests pass.

- [ ] **Step 2: Run type-check**

```bash
npm run type-check
```
Expected: exits 0.

- [ ] **Step 3: Run dev server and smoke test auth**

```bash
npm run dev
```
Open http://localhost:3000 — expect redirect to `/login`.
Open http://localhost:3000/login — expect login form.

If Supabase env vars are set, test the OTP flow:
1. Enter your email
2. Check email for 6-digit code
3. Enter code → should redirect to `/`

- [ ] **Step 4: Run build (production check)**

```bash
npm run build
```
Expected: exits 0 with no errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: phase 0 complete — infrastructure, auth, DB schema, Dockerfile"
```

---

## Post-Phase 0 Checklist

Before starting Phase 1, confirm:

- [ ] Supabase project created and schema applied
- [ ] Custom access token hook registered in Supabase Dashboard (Authentication → Hooks)
- [ ] Storage buckets created: `html-sources`, `assets`, `brand-assets`
- [ ] `.env.local` filled with real Supabase credentials
- [ ] Login flow tested end-to-end (OTP works)
- [ ] App deployed to Railway (optional at this stage)
- [ ] First workspace + admin user created manually in Supabase Dashboard:
  ```sql
  -- Run in Supabase SQL Editor
  INSERT INTO workspaces (name, slug) VALUES ('My Company', 'my-company');
  -- Then insert user row after they sign up via /invite or set is_superadmin=true on their auth user
  ```

---

## Self-Review

**Spec coverage check:**
- ✅ Supabase schema (all 9 tables + RLS + functions)
- ✅ Next.js project + Tailwind + shadcn/ui
- ✅ next-intl (EN + RU)
- ✅ Supabase Auth + invite acceptance flow
- ✅ Dockerfile with Puppeteer/Chromium
- ✅ Environment variables documented

**What's NOT in this plan (intentional):**
- Invite _creation_ UI — Phase 5 (admin panel)
- Brandbook UI — Phase 1
- Generation — Phase 2
- Gallery with real data — Phase 4
- Rate limiting UI — Phase 6
