-- The application accesses these tables only through the backend service role.
-- Explicit deny-all policies preserve that model while satisfying Supabase's
-- RLS policy checks.
create policy plugin_submissions_backend_only on public.plugin_submissions
  for all to anon, authenticated using (false) with check (false);

create policy plugins_backend_only on public.plugins
  for all to anon, authenticated using (false) with check (false);

create policy users_backend_only on public.users
  for all to anon, authenticated using (false) with check (false);

create policy suggestions_backend_only on public.suggestions
  for all to anon, authenticated using (false) with check (false);