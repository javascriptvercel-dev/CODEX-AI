-- CODEX AI — migration 004
-- Run this once if your database already exists (i.e. you already ran
-- schema.sql before this file existed). Safe to re-run: every statement is
-- idempotent (IF NOT EXISTS). A brand-new database created from the current
-- schema.sql already has all of this — you can skip this file entirely.

-- Admin-entered install command / reference URL for a plugin. These are
-- filled in by an admin while reviewing a submission (see the "Edit &
-- approve" flow in /console) — they are not auto-generated from the
-- plugin's id anymore.
alter table public.plugin_submissions add column if not exists install_command text;
alter table public.plugin_submissions add column if not exists reference_url text;
alter table public.plugins add column if not exists install_command text;
alter table public.plugins add column if not exists reference_url text;

-- Forgot-password / reset-link support. Only a hash of the reset token is
-- ever stored (never the raw token — that only ever lives in the emailed
-- link), alongside its expiry.
alter table public.users add column if not exists reset_token_hash text;
alter table public.users add column if not exists reset_token_expires_at timestamptz;
