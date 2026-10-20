-- CODEX AI — migration 016
-- Run once on an existing database. Safe to re-run (IF NOT EXISTS).
-- Email-change confirmation: the requested new address is parked here with a
-- hash of the emailed token and an expiry. users.email only changes after the
-- link sent to the NEW address is opened.
alter table public.users add column if not exists pending_email text;
alter table public.users add column if not exists pending_email_token_hash text;
alter table public.users add column if not exists pending_email_expires_at timestamptz;
