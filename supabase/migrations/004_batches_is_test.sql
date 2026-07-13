-- Mark generations produced without a real authenticated user (dev / DISABLE_AUTH)
-- as test runs, so the gallery can badge them. A real user in production → false.
-- Idempotent: safe to re-run.
alter table public.batches
  add column if not exists is_test boolean not null default false;

-- Backfill: every batch that existed before this column was added was a dev/test
-- run (there are no real users yet). WHERE is required by project convention.
update public.batches set is_test = true where is_test = false;
