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

-- Workspaces: users can only see their own workspace
create policy "workspace_isolation" on workspaces
  using (id = my_workspace_id());

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
