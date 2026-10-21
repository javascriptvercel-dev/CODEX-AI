-- CODEX AI — migration 017
-- Run once on an existing database. Safe to re-run.
alter table public.users add column if not exists pending_deletion_token_hash text;
alter table public.users add column if not exists pending_deletion_expires_at timestamptz;
