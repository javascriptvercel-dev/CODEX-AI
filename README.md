<div align="center">

# 🤖 CODEX AI

### Generate, pair, and extend WhatsApp bots — from your browser.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Storage-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Baileys](https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)]()

**[Live Demo](#) · [Report a Bug](#) · [Suggest a Feature](#)**

</div>

---

## ✨ What is CODEX AI?

CODEX AI is a full-stack platform for spinning up **WhatsApp bot sessions** in seconds, pairing devices via QR or pairing code, and growing your bot with a **community-driven plugin marketplace** — all from a clean web console. No terminal required.

```
  ┌──────────────┐        ┌───────────────┐        ┌──────────────────┐
  │   Next.js    │  HTTP  │    Express    │        │     WhatsApp     │
  │  Frontend    │◄──────►│    Backend    │◄──────►│  (via Baileys)   │
  └──────────────┘  cookie└───────────────┘        └──────────────────┘
        │                        │
        │                        ├── Supabase (Postgres + Storage)
        │                        ├── MinIO (session/plugin files)
        │                        └── Resend (transactional email)
        └── Tailwind + lucide-react UI
```

---

## 🚀 Features

| | |
|---|---|
| 🔌 **Session Generator** | Spin up a bot session with a custom name, prefix, and bot name — get a ready-to-scan QR in seconds |
| 📱 **Pairing Code Flow** | Prefer typing a code on your phone instead of scanning? Pair by WhatsApp number directly |
| 🧩 **Plugin Marketplace** | Browse, search, and `.install <url>` community plugins across Utility, Fun, Moderation, AI, and more |
| ✍️ **Plugin Submissions** | Ship your own plugin — paste code or upload a file, and it lands straight in the admin review queue |
| 👑 **Premium expiry reminders** | Premium members are emailed 7 and 1 UTC calendar days before their access expires |
| 🤖 **Site Assistant FAQs** | Assistant conversations can create summarized FAQ drafts for admin review; approved answers appear on Support |
| 💡 **Suggestion Box** | Users can pitch new features directly to the team |
| 🌓 **Light/Dark UI** | Because good tools should look good at 2am too |

---

## 🏗️ Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [lucide-react](https://lucide.dev/) / [react-icons](https://react-icons.github.io/react-icons/) for iconography

**Backend**
- [Express](https://expressjs.com/) (ESM) REST API
- [Baileys](https://github.com/WhiskeySockets/Baileys) for the WhatsApp Web protocol
- [Supabase](https://supabase.com/) for Postgres + object storage
- JWT session cookies (`jsonwebtoken`, `cookie-parser`, `bcryptjs`)
- [Resend](https://resend.com/) for transactional email (admin notifications, password resets, and Premium expiry reminders)
- [qrcode](https://www.npmjs.com/package/qrcode) for QR pairing, [nanoid](https://github.com/ai/nanoid) for public IDs

---

## 📂 Project Structure

```
Frontend/
├── app/
│   ├── create/          # Plugin submission (role + freshness gated)
│   ├── console/         # Session generation & pairing
│   ├── suggest/         # Feature suggestion form
│   ├── reset-password/
│   └── private/           # Admin-only submission review
├── components/
│   ├── auth/            # AuthModal — login / signup / forgot password
│   ├── session/         # GenerateConsole, PairConsole
│   ├── plugins/         # SearchBar, PluginSubmitForm
│   └── private/           # SubmissionCard, SettingsTab
├── context/
│   └── AuthContext.jsx  # Session state, derived from /api/auth/me
└── lib/api.js           # Typed fetch client

Backend/
├── src/
│   ├── controllers/     # auth, plugin, admin
│   ├── middleware/      # auth guards
│   ├── routes/
│   ├── utils/           # jwt (session cookies), mailer, id
│   └── config/          # env, supabase client
```

---

## 🔐 Security Notes

- Session cookies are `httpOnly`, `secure` in production, and `SameSite=None` for cross-origin auth — clearing options must always mirror the setting options exactly, or logout silently fails to revoke the cookie.
- Sensitive routes (like publishing) require a session **freshly re-authenticated within the last 45 minutes**, independent of the 30-day general login.
---

## 🔑 Google sign-in setup

Google sign-in uses the backend OAuth callback and requires a Google OAuth
client:

1. In [Google Cloud Console](https://console.cloud.google.com/), create or
   select a project, configure the OAuth consent screen, and create an OAuth
   client ID with application type **Web application**.
2. Add the backend callback URL to **Authorized redirect URIs**. Locally, use
   `http://localhost:4000/api/auth/google/callback`. In production, use
   `https://<your-backend-domain>/api/auth/google/callback`.
3. Set these environment variables on the backend:

   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
   ```

   Set `GOOGLE_CALLBACK_URL` to the exact production callback URL when deployed;
   it must match the URI registered in Google Cloud Console. Keep the client
   secret server-side and never add it to the frontend.
4. While the consent screen is in **Testing**, add the Google accounts that
   need to sign in as test users.
5. Run
   [`Backend/src/db/migration_018_google_oauth.sql`](./Backend/src/db/migration_018_google_oauth.sql)
   in the Supabase SQL editor before deploying the backend. The frontend must
   also have `NEXT_PUBLIC_API_URL` set to the backend API URL.

Google sign-in requires a verified Google email. It links to an existing CODEX
AI account with the same email, preserving that account's role and profile; it
does not create a duplicate account.

## 🧩 Plugin System

Plugins are reviewed before publishing:

1. A user submits code (pasted or uploaded) via **Suggest → Submit a Plugin**
2. It lands in the **admin queue** with status `pending`
3. An admin approves ✅ or rejects ❌ (with an optional note) from the dashboard
4. Approved plugins get a public raw URL: `.install <rawUrl>`

> ℹ️ Submissions currently support a single code blob or file per plugin — multi-file plugins (e.g. one that ships its own data file) aren't supported by the review pipeline yet.

## 🤖 Assistant FAQ Review

Assistant questions and replies may be summarized into private FAQ drafts. The
original conversation is not stored in the FAQ queue. Administrators can edit,
approve, or reject drafts from the **FAQ drafts** tab in the console. Only
approved FAQs are shown publicly on the Support page.

Before deploying this feature, run
[`Backend/src/db/migration_008_assistant_faqs.sql`](./Backend/src/db/migration_008_assistant_faqs.sql)
in the Supabase SQL editor. Configure `NEXT_PUBLIC_API_URL` to point to the
backend API; server-side route handlers can use `API_URL` as an override.

## 🧰 Tools and usage limits

Before deploying the URL Shortener or tool rate limits, run
[`Backend/src/db/migration_012_tools_and_short_links.sql`](./Backend/src/db/migration_012_tools_and_short_links.sql)
in the Supabase SQL editor. Deploy the backend after the migration, then deploy
the frontend. Set `NEXT_PUBLIC_API_URL` (or the frontend server's `API_URL`) to
the backend API and set the backend's `PUBLIC_FRONTEND_URL` to the public
frontend domain so generated short links resolve on the site.

All tools require a signed-in CODEX AI account. Regular users can create up to
10 short links per hour and keep up to 100 links, and generate up to 10 bot
bases or obfuscate JavaScript up to 10 times per hour. The WhatsApp Ban Checker
uses its configured per-minute limit. The obfuscator accepts up to 50,000
characters per request and offers Easy, Medium, and Hard presets. Obfuscation
is not encryption and does not protect secrets. Usage limits are stored in
Supabase and shared across backend instances.

## ⭐ Premium and member dashboard

The signed-in `/dashboard` page includes Premium status, tool activity, saved
obfuscator settings, short-link analytics, plugin submissions, and admin account
management. Premium adds higher tool/link limits and JavaScript/ZIP uploads to
the obfuscator. The feature is disabled by default.

Follow [the Premium deployment and rollback guide](./Backend/PREMIUM_DEPLOYMENT.md)
before enabling it. The deployment requires
[`migration_013_premium_dashboard.sql`](./Backend/src/db/migration_013_premium_dashboard.sql)
followed by
[`migration_014_premium_grants.sql`](./Backend/src/db/migration_014_premium_grants.sql),
and `PREMIUM_FEATURES_ENABLED=true`. Migration 014 retires the integration-token
table; back up its records first if they are still needed. There are no payment
or subscription integrations; administrators grant access when creating
accounts, or by updating the user's `premium_until` value in Supabase.

---

## 🤝 Contributing

Got an idea? Head to **[/suggest](#)** and tell us — every submission goes straight to the team.

Found a bug? Open an issue with steps to reproduce, or use the in-app feedback if you're a signed-in user.

---

<div align="center">

**© 2026 CODEX** · Built with ❤️ for the WhatsApp bot community

</div>