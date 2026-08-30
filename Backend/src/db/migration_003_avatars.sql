-- Run this if you already set up the project before avatar uploads existed.
-- Safe to run once; a fresh schema.sql already includes this bucket.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
