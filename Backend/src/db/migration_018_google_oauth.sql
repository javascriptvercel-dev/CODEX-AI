-- CODEX AI — migration 018
-- Run once on an existing database. Safe to re-run.
alter table public.users add column if not exists google_id text unique;
