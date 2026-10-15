# Premium deployment and rollback

Premium is disabled unless `PREMIUM_FEATURES_ENABLED=true`. There are no payment
or subscription services. Premium access is granted only when an administrator
creates an account with Premium selected, or when an administrator updates the
user's `premium_until` value in the database. The ordinary dashboard and tools
remain available while Premium is disabled.

## Configure and enable

1. Deploy the backend and frontend with Premium disabled.
2. Apply [`src/db/migration_013_premium_dashboard.sql`](./src/db/migration_013_premium_dashboard.sql)
   in the Supabase SQL editor. Back up the database first.
3. Set `PREMIUM_FEATURES_ENABLED=true` in the backend environment and restart
   the backend. No payment-provider credentials or webhook configuration are
   needed.
4. Deploy the frontend. Users can sign in at `/login`; successful default
   sign-in goes to `/dashboard`, while tool/Create links preserve their return
   destination.

An administrator can grant a new account 30 days of Premium from the dashboard
account-creation form. To grant or change Premium for an existing account,
use the Users tab in `/console` or update `users.premium_until` in Supabase.
The Users tab provides paginated account listing, email search, Premium expiry
editing, and deletion for non-administrator accounts. For example, grant 30
days to one account by email:

```sql
update public.users
set premium_until = now() + interval '30 days'
where email = 'member@example.com';
```

Set `premium_until` to a future timestamp to grant access, or `NULL` to remove
it. The `premium_until` field is the source of truth for Premium status.

The dashboard's integration-token controls and account-integration endpoint
remain unchanged. We can focus on the admin bot account-creation workflow next;
store generated integration secrets securely and revoke exposed tokens.

Premium upload constraints are enforced server-side: the uploaded `.js` or
`.zip` must be at most 100 MB; ZIP expanded size is at most 100 MB and 1,000
entries; each JavaScript file is limited to 2 MB; and generated output is
limited to 200 MB. ZIP paths and symbolic links are validated, JavaScript files
are obfuscated in isolated worker threads, and other files are preserved.
Individual files have a 30-second obfuscation deadline. Hosting proxies must
also allow 100 MB multipart requests and allow enough time for larger projects.

## Roll back

1. Set `PREMIUM_FEATURES_ENABLED=false` and restart the backend. This disables
   Premium-only features, integration-token operations, and uploads while
   leaving normal sign-in and the dashboard available.
2. If fully reverting the application, deploy the previous backend/frontend
   version before running the rollback SQL.
3. Back up any Premium/activity data that should be retained, then run
   [`src/db/migration_013_premium_dashboard_rollback.sql`](./src/db/migration_013_premium_dashboard_rollback.sql).
   The script permanently removes integration, settings, usage, and click-event
   records. It intentionally leaves `users.premium_until` in place so the
   currently deployed feature-disabled application can still authenticate
   users; after deploying the pre-Premium backend, that unused column can be
   dropped separately if desired.

The rollback is destructive to feature data. Do not run it as a routine disable
or before taking a backup.
