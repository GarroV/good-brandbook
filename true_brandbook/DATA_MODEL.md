# Design Terminal — Data Model

## Схема базы данных

### workspaces
```sql
create table workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz default now()
);
```

### users
```sql
create table users (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  email        text unique not null,
  role         text default 'member' check (role in ('admin','member')),
  is_superadmin boolean default false,
  created_at   timestamptz default now()
);
```

`is_superadmin` проставляется только вручную через Supabase Dashboard. Нет UI, нет API эндпоинта.

### brandbook
```sql
create table brandbook (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid unique references workspaces(id) on delete cascade,
  tokens       jsonb not null default '{}',
  assets       jsonb not null default '{}',
  context      text,
  updated_at   timestamptz default now()
);
```

**Схема `tokens` (фиксированная):**
```json
{
  "colors": {
    "primary": "#E63329",
    "secondary": "#1A1A1A",
    "background": "#FFFFFF",
    "accent": "#F5A623"
  },
  "typography": {
    "heading_font": "Montserrat",
    "body_font": "Inter",
    "base_size": "16px"
  },
  "spacing": {
    "unit": "8px",
    "border_radius": "4px"
  },
  "logo": {
    "light": "https://...",
    "dark": "https://..."
  }
}
```

**`context`** — свободный текст для Claude: tone of voice, типичные фразы, антипаттерны.

**`assets`** — JSON со ссылками на файлы в Supabase Storage (логотипы, иконки, паттерны).

### batches
```sql
create table batches (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid references workspaces(id) on delete cascade,
  user_id           uuid references users(id),
  prompt            text not null,
  reference_batch_id uuid references batches(id),
  status            text default 'draft' check (status in ('draft','published')),
  created_at        timestamptz default now()
);
```

`reference_batch_id` — ссылка на исходный батч если маркетолог нажал "Взять за основу". Создаётся новый батч, старый не меняется.

### batch_items
```sql
create table batch_items (
  id           uuid primary key default gen_random_uuid(),
  batch_id     uuid references batches(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  format       text not null,
  html_url     text,
  status       text default 'pending'
               check (status in ('pending','generating','preview_ready','exporting','done','failed')),
  created_at   timestamptz default now()
);
```

`html_url` — ссылка на HTML файл в Supabase Storage (не хранится в Postgres напрямую).

**Статусы batch_item:**
```
pending → generating → preview_ready → exporting → done
                    ↓
                  failed
```

### assets
```sql
create table assets (
  id            uuid primary key default gen_random_uuid(),
  batch_item_id uuid references batch_items(id) on delete cascade,
  workspace_id  uuid references workspaces(id) on delete cascade,
  type          text check (type in ('jpeg_preview','png_final','pdf')),
  url           text not null,
  created_at    timestamptz default now()
);
```

На каждый `batch_item`:
- `jpeg_preview` — всегда, генерируется первым
- `pdf` — для печатных форматов (A4, A5), после одобрения
- `png_final` — для цифровых форматов (соцсети, TV), после одобрения

### invites
```sql
create table invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  email        text not null,
  role         text default 'member' check (role in ('admin','member')),
  token        text unique not null default gen_random_uuid()::text,
  accepted_at  timestamptz,
  expires_at   timestamptz default now() + interval '7 days',
  created_at   timestamptz default now()
);
```

### workspace_limits
```sql
create table workspace_limits (
  workspace_id    uuid primary key references workspaces(id),
  monthly_batches int default 100,
  daily_per_user  int default 20,
  bonus_batches   int default 0,
  reset_at        timestamptz default date_trunc('month', now()) + interval '1 month'
);
```

`bonus_batches` — ручное начисление суперадмином сверх месячного лимита.

### activity_feed
```sql
create table activity_feed (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references users(id),
  format       text,
  action       text check (action in ('generated','published')),
  created_at   timestamptz default now()
);
```

Показывается в реальном времени через Supabase Realtime. Последние 20 записей. Содержит только имя пользователя, формат и время — никакого контента.

### generation_log
```sql
create table generation_log (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id      uuid not null,
  format       text not null,
  created_at   timestamptz default now()
);
```

Только для аналитики. Не показывается в UI. Используется для проверки лимитов.

---

## RLS политики

```sql
-- включаем на всех таблицах
alter table workspaces     enable row level security;
alter table users          enable row level security;
alter table brandbook      enable row level security;
alter table batches        enable row level security;
alter table batch_items    enable row level security;
alter table assets         enable row level security;
alter table invites        enable row level security;
alter table activity_feed  enable row level security;
alter table workspace_limits enable row level security;

-- helper функция
create or replace function my_workspace_id()
returns uuid as $$
  select workspace_id from users where id = auth.uid()
$$ language sql security definer stable;

-- users
create policy "workspace_isolation" on users
  using (workspace_id = my_workspace_id());

-- brandbook
create policy "workspace_isolation" on brandbook
  using (workspace_id = my_workspace_id());

-- batches: draft видит только автор, published — весь workspace
create policy "batch_access" on batches
  using (
    workspace_id = my_workspace_id()
    and (status = 'published' or user_id = auth.uid())
  );

-- batch_items, assets — прямой workspace_id (без вложенных SELECT)
create policy "workspace_isolation" on batch_items
  using (workspace_id = my_workspace_id());

create policy "workspace_isolation" on assets
  using (workspace_id = my_workspace_id());

-- activity_feed
create policy "workspace_isolation" on activity_feed
  using (workspace_id = my_workspace_id());

-- workspace_limits
create policy "workspace_isolation" on workspace_limits
  using (workspace_id = my_workspace_id());
```

---

## Автоочистка черновиков

```sql
select cron.schedule('cleanup-drafts', '0 3 * * *', $$
  delete from batches
  where status = 'draft'
  and created_at < now() - interval '3 days';
$$);
```

Каскадное удаление через `on delete cascade` подчистит `batch_items` и `assets` автоматически. Файлы из Storage удаляются отдельным шагом в том же cron через Supabase Storage API.

---

## JWT кастомные claims

```sql
create or replace function auth.custom_claims()
returns jsonb as $$
  select jsonb_build_object(
    'workspace_id', u.workspace_id,
    'role', u.role,
    'is_superadmin', u.is_superadmin
  )
  from public.users u
  where u.id = auth.uid();
$$ language sql security definer;
```
