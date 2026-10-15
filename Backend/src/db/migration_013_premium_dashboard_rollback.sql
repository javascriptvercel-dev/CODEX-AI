-- Deploy the pre-Premium application before running this rollback. This
-- permanently deletes integration-token, tool-usage, saved-settings, and
-- link-analytics records.
drop trigger if exists short_links_record_click on public.short_links;
drop function if exists public.record_short_link_click();
drop function if exists public.get_short_link_clicks_by_day(uuid, integer);

drop table if exists public.short_link_click_events;
drop table if exists public.tool_usage_events;
drop table if exists public.user_tool_settings;
drop table if exists public.account_integration_tokens;
drop index if exists public.account_integration_tokens_owner_created_idx;
drop index if exists public.tool_usage_events_user_created_idx;
drop index if exists public.tool_usage_events_tool_created_idx;
drop index if exists public.short_link_click_events_link_created_idx;

-- The pre-Premium application does not use this additive column. Drop it
-- manually only after that application version is deployed.
