import config from '../config.js'

function unwrap(m) {
  while (m) {
    if (m.ephemeralMessage) m = m.ephemeralMessage.message
    else if (m.viewOnceMessage) m = m.viewOnceMessage.message
    else if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message
    else if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message
    else break
  }
  return m
}

function getText(msg) {
  const m = unwrap(msg.message)
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ''
  )
}

export async function handleMessage(sock, msg, commands) {
  if (!msg?.message || msg.key.remoteJid === 'status@broadcast') return

  // Ignore old messages (history sync), accept fresh ones
  const ts = msg.messageTimestamp
  const seconds = Number(ts?.toNumber ? ts.toNumber() : ts)
  if (seconds && Date.now() / 1000 - seconds > 60) return

  const text = getText(msg).trim()
  if (!text) return
  console.log(`📩 ${msg.key.fromMe ? '(me)' : ''} ${msg.key.remoteJid}: ${text.slice(0, 80)}`)
  if (!text.startsWith(config.prefix)) return

  const from = msg.key.remoteJid
  const isGroup = from.endsWith('@g.us')
  const sender = isGroup ? msg.key.participant : from
  const [name, ...args] = text.slice(config.prefix.length).trim().split(/\s+/)
  const cmd = commands.get((name || '').toLowerCase())
  if (!cmd) return

  const reply = (content) =>
    sock.sendMessage(from, typeof content === 'string' ? { text: content } : content, { quoted: msg })

  try {
    await cmd.run({ sock, msg, args, from, sender, isGroup, reply, commands, config })
  } catch (e) {
    console.error(`Error in command ${name}:`, e)
    await reply('❌ Something went wrong.').catch(() => {})
  }
}
