-- Prevent browser/API roles from invoking the SECURITY DEFINER helper.
-- Run this in the Supabase SQL Editor.
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

-- Keep explicit backend access available if the function is needed by maintenance code.
grant execute on function public.rls_auto_enable() to service_role;
