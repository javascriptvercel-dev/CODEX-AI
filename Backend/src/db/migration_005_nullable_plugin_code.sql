-- Allow plugin submissions and published plugins to be file-only instead of requiring inline code.

alter table public.plugin_submissions
  alter column code drop not null;

alter table public.plugins
  alter column code drop not null;
