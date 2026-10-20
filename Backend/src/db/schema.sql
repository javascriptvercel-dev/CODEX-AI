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
  pending_email text,                  -- new address awaiting confirmation, null when none
  pending_email_token_hash text,       -- sha256 hex of the confirmation token
  pending_email_expires_at timestamptz, -- confirmation link is invalid once past this time
  created_at timestamptz not null default now()
);

create table if not exists public.plugin_submissions (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,      -- short id, e.g. "WhjwrJJbz1xXZ9Z3bod7" — set by the backend at submit time
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  code text,                           -- nullable when the plugin is submitted as a file upload only
  file_path text,                      -- storage object path in plugin-files bucket
  category text not null default 'Utility',
  install_command text,                -- set by an admin while reviewing, not auto-generated
  reference_url text,                  -- set by an admin while reviewing, not auto-generated
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
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
  code text,                           -- nullable when the plugin is distributed as a file upload only
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

create table if not exists public.assistant_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 10 and 180),
  answer text not null check (char_length(answer) between 10 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null
);

create table if not exists public.tool_rate_limits (
  subject_key text not null,
  tool_slug text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (subject_key, tool_slug, window_started_at)
);

create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{8}$'),
  target_url text not null check (char_length(target_url) between 1 and 2048),
  click_count bigint not null default 0 check (click_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists plugin_submissions_status_idx on public.plugin_submissions (status);
create index if not exists plugins_name_idx on public.plugins using gin (to_tsvector('english', name || ' ' || author_name));
create index if not exists assistant_faqs_status_created_idx on public.assistant_faqs (status, created_at desc);
create index if not exists tool_rate_limits_tool_window_idx
  on public.tool_rate_limits (tool_slug, window_started_at);
create index if not exists short_links_user_created_idx
  on public.short_links (user_id, created_at desc);

alter table public.users enable row level security;
alter table public.plugin_submissions enable row level security;
alter table public.plugins enable row level security;
alter table public.suggestions enable row level security;
alter table public.assistant_faqs enable row level security;
alter table public.tool_rate_limits enable row level security;
alter table public.short_links enable row level security;

-- Explicit deny-all policies make the backend-only access model visible to
-- security scanners. Only the service-role key bypasses RLS.
create policy plugin_submissions_backend_only on public.plugin_submissions
  for all to anon, authenticated using (false) with check (false);

create policy plugins_backend_only on public.plugins
  for all to anon, authenticated using (false) with check (false);

create policy users_backend_only on public.users
  for all to anon, authenticated using (false) with check (false);

create policy suggestions_backend_only on public.suggestions
  for all to anon, authenticated using (false) with check (false);

create policy assistant_faqs_backend_only on public.assistant_faqs
  for all to anon, authenticated using (false) with check (false);

create policy tool_rate_limits_backend_only on public.tool_rate_limits
  for all to anon, authenticated using (false) with check (false);

create policy short_links_backend_only on public.short_links
  for all to anon, authenticated using (false) with check (false);

create or replace function public.consume_tool_rate_limit(
  p_subject_key text,
  p_tool_slug text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer, remaining integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_count integer;
begin
  if p_subject_key is null or length(p_subject_key) > 128
     or p_tool_slug is null or length(p_tool_slug) > 80
     or p_limit is null or p_limit < 1
     or p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'Invalid tool rate limit arguments';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  delete from public.tool_rate_limits
  where tool_slug = p_tool_slug
    and window_started_at < v_window_started_at;

  insert into public.tool_rate_limits as current_limit (
    subject_key, tool_slug, window_started_at, request_count
  )
  values (p_subject_key, p_tool_slug, v_window_started_at, 1)
  on conflict (subject_key, tool_slug, window_started_at)
  do update set request_count = least(current_limit.request_count + 1, 2147483647)
  returning request_count into v_count;

  return query
  select
    v_count <= p_limit,
    greatest(
      1,
      ceil(extract(epoch from (
        v_window_started_at
        + make_interval(secs => p_window_seconds)
        - v_now
      )))::integer
    ),
    greatest(0, p_limit - v_count);
end;
$$;

create or replace function public.create_short_link(
  p_user_id uuid,
  p_code text,
  p_target_url text,
  p_max_links integer
)
returns table (
  id uuid,
  code text,
  target_url text,
  click_count bigint,
  created_at timestamptz,
  limit_reached boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_link public.short_links%rowtype;
  v_count integer;
begin
  if p_user_id is null or p_code is null or p_target_url is null
     or (p_max_links is not null and p_max_links < 1) then
    raise exception 'Invalid short link arguments';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if p_max_links is not null then
    select count(*)::integer into v_count
    from public.short_links
    where user_id = p_user_id;

    if v_count >= p_max_links then
      return query
      select null::uuid, null::text, null::text, null::bigint,
             null::timestamptz, true;
      return;
    end if;
  end if;

  insert into public.short_links (user_id, code, target_url)
  values (p_user_id, p_code, p_target_url)
  returning * into v_link;

  return query
  select v_link.id, v_link.code, v_link.target_url, v_link.click_count,
         v_link.created_at, false;
end;
$$;

create or replace function public.resolve_short_link(p_code text)
returns table (target_url text)
language sql
security definer
set search_path = pg_catalog, public
as $$
  update public.short_links
  set click_count = click_count + 1
  where code = p_code
  returning public.short_links.target_url;
$$;

revoke all on function public.consume_tool_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_tool_rate_limit(text, text, integer, integer)
  to service_role;
revoke all on function public.create_short_link(uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.create_short_link(uuid, text, text, integer)
  to service_role;
revoke all on function public.resolve_short_link(text)
  from public, anon, authenticated;
grant execute on function public.resolve_short_link(text)
  to service_role;

insert into storage.buckets (id, name, public)
values ('plugin-files', 'plugin-files', false)
on conflict (id) do nothing;

-- Public on purpose: avatars are just profile pictures, served directly as
-- <img src> without needing signed URLs.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
