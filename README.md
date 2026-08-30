# CODEX AI — v2

A rebuild from scratch (new UI, new architecture, new auth model). Two services:

```
frontend/   Next.js 16 (App Router) — UI only, talks to the backend over HTTP
backend/    Express service — owns auth (email/password + GitHub OAuth), and
           
