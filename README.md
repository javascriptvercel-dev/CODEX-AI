<div align="center">

# 🤖 CODEX AI

### Generate, pair, and extend WhatsApp bots — from your browser.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Storage-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Baileys](https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey)]()

**[Live Demo](codex-ai.site) · [Report a Bug](wa.me/blazedev) · [Suggest a Feature](codex-ai.site/suggest)**

</div>

---

## ✨ What is CODEX AI?

CODEX AI is a full-stack platform for creating and managing **WhatsApp bot sessions**, pairing devices by QR code or pairing code, and extending bots with a **community-driven plugin marketplace** — all through a web console.

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
| 🔌 **Session Generator** | Create a bot session with a custom name, prefix, and bot name, then connect by QR code |
| 📱 **Pairing Code Flow** | Connect to WhatsApp with a pairing code instead of scanning a QR code |
| 🧩 **Plugin Marketplace** | Browse and install community plugins across utility, entertainment, moderation, AI, and other categories |
| ✍️ **Plugin Submissions** | Submit plugin code or upload a file for review in the admin queue |
| 👑 **Premium expiry reminders** | Premium members are emailed 7 and 1 UTC calendar days before their access expires |
| 🤖 **Site Assistant FAQs** | Assistant conversations can create summarized FAQ drafts for admin review; approved answers appear on Support |
| 💡 **Suggestion Box** | Submit feature suggestions for review |
| 🌓 **Light/Dark UI** | Choose between light and dark themes |

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

---

## 🤝 Contributing

Submit feature requests through the **[/suggest](#)** form.

To report a bug, open an issue with steps to reproduce it, or use in-app feedback when signed in.

---

<div align="center">

**© 2026 CODEX** · Built for the WhatsApp bot community

</div>