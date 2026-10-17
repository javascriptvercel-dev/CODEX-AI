-- Apply once after migration_014_premium_grants.sql.
create table if not exists public.premium_expiry_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  days_before smallint not null check (days_before in (1, 7)),
  status text not null default 'sending' check (status in ('sending', 'sent')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (user_id, expires_at, days_before)
);

create index if not exists premium_expiry_reminders_status_created_idx
  on public.premium_expiry_reminders (status, created_at);

alter table public.premium_expiry_reminders enable row level security;

drop policy if exists premium_expiry_reminders_backend_only
  on public.premium_expiry_reminders;
create policy premium_expiry_reminders_backend_only
  on public.premium_expiry_reminders
  for all to anon, authenticated using (false) with check (false);

-- Rollback only when removing Premium expiry reminder emails:
-- drop table if exists public.premium_expiry_reminders;
