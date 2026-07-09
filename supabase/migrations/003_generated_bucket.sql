-- =====================================================
-- Design Terminal — 'generated' storage bucket
-- Private bucket holding each saved generation's HTML source + JPEG preview.
-- The DB rows live in the existing batches / batch_items / assets tables (001).
-- Read/written server-side with the service-role key; UI uses signed URLs.
-- =====================================================

insert into storage.buckets (id, name, public)
values ('generated', 'generated', false)
on conflict (id) do nothing;
