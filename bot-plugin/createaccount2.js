/**
 * WhatsApp Bot Plugin: Codex AI Member Account Creator
 * Command: .createaccount (Aliases: .ca, .mkacc, .newuser, .adduser)
 */

const axios = require('axios');
const crypto = require('crypto');

// Target deployed backend URL
const BASE_URL = process.env.CODEX_API_URL || 'https://api.codex-ai.site';
const DASHBOARD_URL = 'https://codex-ai.site/dashboard';
const CARD_BORDER = '━━━━━━━━━━━━━━━━━━━━';
const SESSION_TTL_MS = 15 * 60 * 1000;       // 15-minute sliding session
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000;           // 10-minute lockout on repeated fails

// In-memory session and lockout stores
const sessions = new Map();
const loginAttempts = new Map();

function getCleanSender(sender) {
  if (!sender) return '';
  return sender.replace(/:\d+@/, '@');
}

function generateSecurePassword() {
  return crypto.randomBytes(24).toString('base64url');
}

async function tryDeleteMessage(bot, m) {
  if (!m?.key || !m.chat) return false;

  try {
    await bot.sendMessage(m.chat, { delete: m.key });
    return true;
  } catch (error) {
    console.warn('[createaccount] Could not delete the login command:', error?.message || error);
    return false;
  }
}

module.exports = {
  name: 'createaccount',
  aliases: ['ca', 'mkacc', 'newuser', 'adduser'],
  description: 'Manage and create Codex AI accounts via WhatsApp',

  async execute(bot, m, args) {
    const rawSender = m.key?.participant || m.key?.remoteJid || m.sender;
    const sender = getCleanSender(rawSender);
    const sub = (args[0] || '').toLowerCase();

    // Reject usage in public group chats for privacy & security
    if (m.isGroup) {
      return bot.sendMessage(m.chat, {
        text: `🔒 *Security Notice*\n\nThis command manages administrative accounts. Admin only`
      });
    }

    // Rate-limit check
    const attempts = loginAttempts.get(sender);
    if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS && Date.now() < attempts.lockUntil) {
      const waitMin = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
      return bot.sendMessage(m.chat, {
        text: `⛔ *Account Locked*\n\nToo many failed login attempts. Please wait *${waitMin} minute(s)* before trying again.`
      });
    }

    // ----------------------------------------------------
    // SUBCOMMAND: HELP / MENU
    // ----------------------------------------------------
    if (!sub || sub === 'help' || sub === 'menu') {
      const card =
`┏━━━ ⚡ *CODEX AI* ━━━┓

*Available Commands & Aliases:*
👉 \`.ca\` / \`.createaccount\` / \`.mkacc\`

🔹 *1. Login:*
\`.ca in <email> <password>\`
_WhatsApp may not let the bot delete your private message. Delete it manually after logging in._

🔹 *2. Create Account:*
\`.ca <Full Name> | <Email> | [premium: yes/no] | [optional note]\`
_Examples:_
• \`.ca John Doe | john@gmail.com\`
• \`.ca Jane Smith | jane@gmail.com | yes\`
• \`.ca Bob Ray | bob@gmail.com | yes | Paid via WhatsApp transfer\`

🔹 *3. Check Session Status:*
\`.ca info\` or \`.ca status\`

🔹 *4. Logout:*
\`.ca out\` or \`.ca logout\`

┗━━━━━━━━━━━━━━━━━━━━┛`;
      return bot.sendMessage(m.chat, { text: card });
    }

    // ----------------------------------------------------
    // SUBCOMMAND: STATUS / INFO
    // ----------------------------------------------------
    if (sub === 'status' || sub === 'info') {
      const sess = sessions.get(sender);
      if (!sess || Date.now() > sess.expiresAt) {
        sessions.delete(sender);
        return bot.sendMessage(m.chat, {
          text: `⚪ *Session Inactive*\n\nYou are not currently logged in.\nLog in with: \`.ca in <email> <password>\``
        });
      }
      const remainMin = Math.ceil((sess.expiresAt - Date.now()) / 60000);
      return bot.sendMessage(m.chat, {
        text: `🟢 *Session Active*\n\n👤 *Admin:* ${sess.email}\n🌐 *Backend:* \`${BASE_URL}\`\n⏳ *Expires in:* ${remainMin} minute(s)\n\nCreate accounts anytime with:\n\`.ca Name | email@site.com | yes\``
      });
    }

    // ----------------------------------------------------
    // SUBCOMMAND: LOGOUT
    // ----------------------------------------------------
    if (sub === 'logout' || sub === 'out') {
      sessions.delete(sender);
      return bot.sendMessage(m.chat, {
        text: `👋 *Logged Out*\n\nYour session has been terminated.`
      });
    }

    // ----------------------------------------------------
    // SUBCOMMAND: LOGIN (.ca in <email> <password> or .ca login ...)
    // ----------------------------------------------------
    if (sub === 'login' || sub === 'in') {
      let email = '';
      let password = '';

      const rest = args.slice(1).join(' ').trim();
      if (rest.includes('|')) {
        const parts = rest.split('|').map(s => s.trim());
        email = parts[0];
        password = parts[1];
      } else {
        const parts = rest.split(/\s+/);
        email = parts[0];
        password = parts.slice(1).join(' ');
      }

      if (!email || !password) {
        return bot.sendMessage(m.chat, {
          text: `⚠️ *Login Usage:*\n\`.ca in <email> <password>\`\n\n*Example:*\n\`.ca in admin@codex-ai.site mySecret123\``
        });
      }

      const passwordMessageDeleted = await tryDeleteMessage(bot, m);
      if (!passwordMessageDeleted) {
        await bot.sendMessage(m.chat, {
          text: '⚠️ WhatsApp did not let me delete your login message. Please delete it manually using “Delete for everyone” to remove the password from this chat.'
        });
      }

      try {
        const res = await axios.post(
          `${BASE_URL}/api/auth/login`,
          { email, password },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        // 1. Verify credentials and extract session cookie
        const cookie = (res.headers['set-cookie'] || []).find(c => c.startsWith('codex_session='));
        if (!cookie) {
          throw new Error('Authentication failed: Missing session cookie from server.');
        }

        // 2. VERIFY ADMIN ROLE (prevents non-admin accounts from gaining a session)
        const userRole = res.data?.user?.role;
        if (userRole !== 'admin') {
          return bot.sendMessage(m.chat, {
            text: `⛔ *Access Denied*\n\nThe account \`${email}\` was verified, but does *not* have administrator privileges on Codex AI.`
          });
        }

        // Reset lockout counter on success
        loginAttempts.delete(sender);

        // Store active admin session
        sessions.set(sender, {
          cookie: cookie.split(';')[0],
          email: res.data?.user?.email || email,
          name: res.data?.user?.fullName || 'Admin',
          expiresAt: Date.now() + SESSION_TTL_MS
        });

        const successCard =
`┏${CARD_BORDER}┓
🔓 *ADMIN AUTHENTICATED*
┣${CARD_BORDER}┫
👤 *Admin:* ${res.data?.user?.fullName || email}
✉️ *Email:* ${email}
🛡️ *Role:* Administrator
⏳ *Session:* 15 minutes
┗${CARD_BORDER}┛

You can now create accounts:
👉 \`.ca Name | email@site.com | yes\``;

        return bot.sendMessage(m.chat, { text: successCard });

      } catch (err) {
        const currentAttempts = (loginAttempts.get(sender)?.count || 0) + 1;
        loginAttempts.set(sender, {
          count: currentAttempts,
          lockUntil: currentAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0
        });

        const remain = MAX_LOGIN_ATTEMPTS - currentAttempts;
        const errMsg = err.response?.data?.error || err.message || 'Login failed';

        if (remain <= 0) {
          return bot.sendMessage(m.chat, {
            text: `⛔ *Account Locked*\n\nToo many failed attempts. try again in 10 minutes.`
          });
        }

        return bot.sendMessage(m.chat, {
          text: `❌ *Authentication Failed:*\n${errMsg}\n\n⚠️ Attempts remaining: *${remain}*`
        });
      }
    }

    // ----------------------------------------------------
    // ACCOUNT CREATION: .ca Full Name | Email | [yes/no] | [note]
    // ----------------------------------------------------
    const session = sessions.get(sender);
    if (!session || Date.now() > session.expiresAt) {
      sessions.delete(sender);
      return bot.sendMessage(m.chat, {
        text: `🔒 *Session Required*\n\nPlease log in first with:\n\`.ca in <email> <password>\``
      });
    }

    // Slide session TTL
    session.expiresAt = Date.now() + SESSION_TTL_MS;

    const fullInput = args.join(' ').trim();
    const parts = fullInput.split('|').map(s => s.trim());

    if (parts.length < 2) {
      return bot.sendMessage(m.chat, {
        text: `⚠️ *Creation Format:*\n\`.ca <Full Name> | <Email> | [premium: yes/no] | [optional note]\`\n\n*Examples:*\n• \`.ca Jane Doe | jane@gmail.com\`\n• \`.ca John Ray | john@gmail.com | yes | WhatsApp client\``
      });
    }

    const fullName = parts[0];
    const email = parts[1];
    const grantPremium = parts[2] ? /^(yes|true|1|y|premium)$/i.test(parts[2]) : false;
    const customNote = parts[3] || `Created via WhatsApp (${sender.split('@')[0]})`;
    const password = generateSecurePassword();

    try {
      const res = await axios.post(
        `${BASE_URL}/api/dashboard/admin/accounts`,
        {
          fullName,
          email,
          password,
          grantPremium,
          note: customNote.slice(0, 200)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': session.cookie
          },
          timeout: 12000
        }
      );

      const acc = res.data?.account || {};
      const premiumLabel = acc.premiumUntil ? '💎 30 Days (Active)' : '⚪ Standard Free';
      const expiryText = acc.premiumUntil ? new Date(acc.premiumUntil).toLocaleDateString() : 'N/A';

      const resultCard =
`┏${CARD_BORDER}┓
✨ *ACCOUNT CREATED*
┣${CARD_BORDER}┫
👤 *Name:* ${acc.fullName || fullName}
✉️ *Email:* \`${acc.email || email}\`
🔑 *Password:* \`${password}\`
💎 *Tier:* ${premiumLabel}
📅 *Valid Until:* ${expiryText}
🔗 *Login at:* ${DASHBOARD_URL}
📋 *Note:* ${customNote.slice(0, 200)}
┗${CARD_BORDER}┛`;

      return bot.sendMessage(m.chat, { text: resultCard });

    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        sessions.delete(sender);
        return bot.sendMessage(m.chat, {
          text: `⚠️ *Session Expired or Unauthorized:*\nsession timed out. Please log in again with \`.ca in <email> <password>\``
        });
      }

      const errorMsg = err.response?.data?.error || err.message || 'Server error';
      return bot.sendMessage(m.chat, {
        text: `❌ *Failed to create account:*\n${errorMsg}`
      });
    }
  }
};
