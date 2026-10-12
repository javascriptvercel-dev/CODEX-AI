alter table public.plugin_submissions
  drop column if exists reviewed_by,
  drop column if exists reviewed_at;
