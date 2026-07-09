-- =====================================================
-- Design Terminal — brand_materials (reference exemplars)
-- Workspace-scoped library of real designer layouts (and product photos) that
-- the generator uses as visual references. See true_brandbook/ARCHITECTURE.md.
-- Additive migration: new table + private storage bucket only.
-- =====================================================

create table if not exists brand_materials (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title        text not null,
  kind         text not null default 'exemplar'
                 check (kind in ('exemplar', 'product_photo', 'logo', 'other')),
  format       text,                       -- FormatKey, or null = applies to any format
  market       text,                       -- optional: 'UAE', 'TR', 'QA', 'RU', …
  campaign     text,                       -- optional grouping
  tags         text[] not null default '{}',
  storage_path text not null,              -- path within the 'brand-materials' bucket
  mime_type    text not null,
  width        int,
  height       int,
  source       text not null default 'upload'
                 check (source in ('upload', 'gdrive')),
  created_by   uuid references users(id),
  created_at   timestamptz default now()
);

-- Exemplar lookup is by (workspace, kind, format) on every generation.
create index if not exists brand_materials_workspace_kind_format_idx
  on brand_materials (workspace_id, kind, format);

alter table brand_materials enable row level security;

-- Workspace isolation. The USING clause doubles as the INSERT/UPDATE WITH CHECK
-- (Postgres default), matching every other table. Server code additionally
-- scopes every query by workspace_id and never trusts a client-supplied id.
-- drop-before-create keeps this migration re-runnable (CREATE POLICY has no
-- IF NOT EXISTS), matching the idempotent intent of the rest of the file.
drop policy if exists "workspace_isolation" on brand_materials;
create policy "workspace_isolation" on brand_materials
  using (workspace_id = my_workspace_id());

-- Private bucket for the material files. Read/written server-side with the
-- service-role key (bypasses RLS); never exposed via public URLs — the admin UI
-- renders short-lived signed URLs only.
insert into storage.buckets (id, name, public)
values ('brand-materials', 'brand-materials', false)
on conflict (id) do nothing;
