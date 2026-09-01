-- Run this AFTER the original schema.sql if your project already has the
-- old tables (with `slug` / `install_command`). Safe to run once.
-- If you're setting up a brand-new project, just run schema.sql instead —
-- it already reflects this shape.

alter table public.plugin_submissions add column if not exists public_id text;
alter table public.plugins add column if not exists public_id text;

-- Backfill any existing rows with a random id so the NOT NULL/UNIQUE
-- constraints below can be applied safely.
update public.plugin_submissions set public_id = encode(gen_random_bytes(15), 'base64') where public_id is null;
update public.plugins set public_id = encode(gen_random_bytes(15), 'base64') where public_id is null;

alter table public.plugin_submissions alter column public_id set not null;
alter table public.plugins alter column public_id set not null;

alter table public.plugin_submissions add constraint plugin_submissions_public_id_key unique (public_id);
alter table public.plugins add constraint plugins_public_id_key unique (public_id);

alter table public.plugins drop column if exists slug;
alter table public.plugins drop column if exists install_command;

alter table public.users alter column email_notifications_enabled set default false;
