-- CODEX AI — schema v2
-- Run once in the Supabase SQL editor. Supabase here is a plain Postgres +
-- storage backend: the backend service is the only thing that ever talks to
-- it, using the service-role key. RLS stays ON with no public policies, so
-- even if a key ever leaked to the browser, anon/authenticated roles could
-- not read or write anything — only the service role (backend) can.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text,                  -- null for GitHub-only accounts
  github_id text unique,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  email_notifications_enabled boolean not null default false,
  reset_token_hash text,               -- sha256 hex of the current password-reset token, null when unused
  reset_token_expires_at timestamptz,  -- null when unused; token is invalid once past this time
  created_at timestamptz not null default now()
);

create table if not exists public.plugin_submissions (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,      -- short id, e.g. "WhjwrJJbz1xXZ9Z3bod7" — set by the backend at submit time
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  code text not null,
  file_path text,                      -- storage object path in plugin-files bucket
  category text not null default 'Utility',
  install_command text,                -- set by an admin while reviewing, not auto-generated
  reference_url text,                  -- set by an admin while reviewing, not auto-generated
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plugins (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,      -- carried over from the submission's public_id — one id, start to finish
  submission_id uuid references public.plugin_submissions(id) on delete set null,
  name text not null,
  author_id uuid references public.users(id) on delete set null,
  author_name text not null,
  description text not null,
  code text not null,
  category text not null default 'Utility',
  install_command text,                -- carried over from the submission, admin-entered
  reference_url text,                  -- carried over from the submission, admin-entered
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  idea text not null,
  created_at timestamptz not null default now()
);

create index if not exists plugin_submissions_status_idx on public.plugin_submissions (status);
create index if not exists plugins_name_idx on public.plugins using gin (to_tsvector('english', name || ' ' || author_name));

alter table public.users enable row level security;
alter table public.plugin_submissions enable row level security;
alter table public.plugins enable row level security;
alter table public.suggestions enable row level security;

-- No policies are created on purpose: default-deny for anon/authenticated
-- Supabase roles. Only the service-role key (used exclusively by the
-- backend) bypasses RLS.

insert into storage.buckets (id, name, public)
values ('plugin-files', 'plugin-files', false)
on conflict (id) do nothing;

-- Public on purpose: avatars are just profile pictures, served directly as
-- <img src> without needing signed URLs.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
