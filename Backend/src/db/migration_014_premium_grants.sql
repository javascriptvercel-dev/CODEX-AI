-- =============================================================
-- migration_014_premium_grants.sql  —  UP section
-- Run ONCE in the Supabase SQL editor, after migrations 012/013.
-- Safe to re-run (idempotent).
-- =============================================================

-- 1) Retire the account-integration system.
--    No backend code references this table anymore after this deploy.
drop table if exists public.account_integration_tokens cascade;

-- 2) Session versioning: password resets (and future account changes)
--    bump this counter, which instantly invalidates every JWT issued
--    before the change.
alter table public.users
  add column if not exists session_version integer not null default 0;

-- 3) Audit trail for manually granted Premium. Every grant, renewal,
--    extension or revocation made from the console or while creating a
--    member account is recorded here, so "who paid, when, until when"
--    lives in the app instead of WhatsApp history.
create table if not exists public.premium_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  granted_by text not null,
  source text not null check (source in ('admin_console','admin_account_create','database')),
  action text not null check (action in ('granted','renewed','extended','revoked')),
  expires_at timestamptz,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists premium_grants_user_created_idx
  on public.premium_grants (user_id, created_at desc);
create index if not exists premium_grants_created_idx
  on public.premium_grants (created_at desc);

alter table public.premium_grants enable row level security;

drop policy if exists premium_grants_backend_only on public.premium_grants;
create policy premium_grants_backend_only
  on public.premium_grants
  for all to anon, authenticated using (false) with check (false);

-- =============================================================
-- DOWN (undo) — run these statements only if you must roll back.
-- =============================================================
-- drop table if exists public.premium_grants cascade;
-- alter table public.users drop column if exists session_version;
-- If you also want the integration table back, re-run the
-- account_integration_tokens block from migration_013_premium_dashboard.sql.
-- NOTE: dropping session_version does NOT re-enable old tokens that were
-- signed with a ver claim; users simply log in again.
