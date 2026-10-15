alter table public.users
  add column if not exists premium_until timestamptz;

create table if not exists public.account_integration_tokens (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  token_hash text not null unique,
  token_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_tool_settings (
  user_id uuid not null references public.users(id) on delete cascade,
  tool_slug text not null check (char_length(tool_slug) between 1 and 80),
  settings jsonb not null default '{}'::jsonb
    check (pg_column_size(settings) <= 16384),
  updated_at timestamptz not null default now(),
  primary key (user_id, tool_slug)
);

create table if not exists public.tool_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  tool_slug text not null check (char_length(tool_slug) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.short_link_click_events (
  id bigint generated always as identity primary key,
  short_link_id uuid not null references public.short_links(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists account_integration_tokens_owner_created_idx
  on public.account_integration_tokens (created_by, created_at desc);
create index if not exists tool_usage_events_user_created_idx
  on public.tool_usage_events (user_id, created_at desc);
create index if not exists tool_usage_events_tool_created_idx
  on public.tool_usage_events (tool_slug, created_at desc);
create index if not exists short_link_click_events_link_created_idx
  on public.short_link_click_events (short_link_id, created_at desc);

alter table public.account_integration_tokens enable row level security;
alter table public.user_tool_settings enable row level security;
alter table public.tool_usage_events enable row level security;
alter table public.short_link_click_events enable row level security;

drop policy if exists account_integration_tokens_backend_only
  on public.account_integration_tokens;
create policy account_integration_tokens_backend_only
  on public.account_integration_tokens
  for all to anon, authenticated using (false) with check (false);

drop policy if exists user_tool_settings_backend_only
  on public.user_tool_settings;
create policy user_tool_settings_backend_only
  on public.user_tool_settings
  for all to anon, authenticated using (false) with check (false);

drop policy if exists tool_usage_events_backend_only
  on public.tool_usage_events;
create policy tool_usage_events_backend_only
  on public.tool_usage_events
  for all to anon, authenticated using (false) with check (false);

drop policy if exists short_link_click_events_backend_only
  on public.short_link_click_events;
create policy short_link_click_events_backend_only
  on public.short_link_click_events
  for all to anon, authenticated using (false) with check (false);

create or replace function public.record_short_link_click()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.click_count > old.click_count then
    insert into public.short_link_click_events (short_link_id)
    values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists short_links_record_click on public.short_links;
create trigger short_links_record_click
after update of click_count on public.short_links
for each row execute function public.record_short_link_click();

create or replace function public.get_short_link_clicks_by_day(
  p_user_id uuid,
  p_days integer default 30
)
returns table (day date, clicks bigint)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_user_id is null or p_days is null or p_days < 1 or p_days > 90 then
    raise exception 'Invalid short-link analytics arguments';
  end if;

  return query
  select (events.created_at at time zone 'UTC')::date, count(*)::bigint
  from public.short_link_click_events as events
  join public.short_links as links on links.id = events.short_link_id
  where links.user_id = p_user_id
    and events.created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 1;
end;
$$;

revoke all on function public.record_short_link_click() from public, anon, authenticated;
grant execute on function public.record_short_link_click() to service_role;
revoke all on function public.get_short_link_clicks_by_day(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.get_short_link_clicks_by_day(uuid, integer)
  to service_role;
