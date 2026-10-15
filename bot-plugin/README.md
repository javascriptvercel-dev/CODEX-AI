# Account creator bot plugin

`createaccount.js` is a standalone CODEX AI bot command that can be installed with the bot's existing `.install` command. It contains no website integration token or admin credentials.

## Install

The bot installer downloads JavaScript from a raw URL. To create an unlisted install link, add `createaccount.js` to a **secret (unlisted) GitHub Gist** and use its raw-file URL:

```text
.install <raw-gist-url>
```

The URL is unlisted, not access-controlled. Do not put secrets in the plugin source. The command's own admin login is required before it can create accounts.

## Use

Send these commands in a private chat with the bot:

```text
.createaccount login <admin-email> | <admin-password>
.createaccount create <full name> | <email> | <free|premium>
.createaccount logout
```

Login is verified by the CODEX AI website's existing `/api/auth/login` endpoint, and the plugin only accepts a successful login whose returned user role is `admin`. The session stays in memory for 15 minutes and is cleared when the bot restarts. Five failed attempts lock that sender for 10 minutes. Account creation uses the authenticated admin-only website endpoint; no integration token is needed in the plugin.

Treat the login command as sensitive: send it only in a private bot chat, never in a group. The website password is sent to the website over HTTPS for verification and is not saved by the plugin. Newly generated account credentials are returned only in the private chat. Premium grants work only when Premium is enabled on the website.
