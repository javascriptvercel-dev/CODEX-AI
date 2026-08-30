-- Run this once if the backend logs "permission denied for table X" even
-- though it's using the service-role key. service_role is meant to bypass
-- RLS entirely, but it still needs ordinary table-level GRANTs — this makes
-- sure it has them, for both the tables that exist now and any future ones.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
