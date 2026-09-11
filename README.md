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
- [MinIO](https://min.io/) for session/plugin file storage
- JWT session cookies (`jsonwebtoken`, `cookie-parser`, `bcryptjs`)
- [Resend](https://resend.com/) for transactional email (admin notifications, password resets)
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

---

## 🤝 Contributing

Got an idea? Head to **[/suggest](#)** and tell us — every submission goes straight to the team.

Found a bug? Open an issue with steps to reproduce, or use the in-app feedback if you're a signed-in user.

---

<div align="center">

**© 2026 CODEX** · Built with ❤️ for the WhatsApp bot community

</div>