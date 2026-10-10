import * as baileys from '@codexverified/baileys'
import pino from 'pino'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config.js'
import { ask } from './lib/console.js'
import { loadCommands } from './lib/loader.js'
import { handleMessage } from './lib/handler.js'

const makeWASocket = baileys.default?.default ?? baileys.default ?? baileys.makeWASocket
const { useMultiFileAuthState, DisconnectReason, Browsers } = baileys

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SESSION_DIR = path.join(__dirname, 'data', 'session')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e?.message || e))
process.on('uncaughtException', (e) => console.error('Uncaught exception:', e?.message || e))

const commands = await loadCommands()
console.log(`Loaded ${new Set(commands.values()).size} commands`)

let pairNumber = null
let failures = 0

async function getNumber() {
  if (pairNumber) return pairNumber
  let n = (config.pairingNumber || '').replace(/\D/g, '')
  while (n.length < 7 || n.length > 15) {
    const input = await ask('\nEnter your WhatsApp number with country code, digits only (e.g. 2348012345678): ')
    n = input.replace(/\D/g, '')
    if (n.length < 7 || n.length > 15) console.log('Invalid number, try again.')
  }
  pairNumber = n
  return n
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const needsPairing = !state.creds.registered

  // Ask BEFORE opening the socket so the connection can't time out while you type
  const number = needsPairing ? await getNumber() : null

  // NOTE: no version override on purpose - the library uses its own supported WhatsApp version
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers?.ubuntu ? Browsers.ubuntu('Chrome') : ['Ubuntu', 'Chrome', '22.04.4'],
    markOnlineOnConnect: false,
    keepAliveIntervalMs: 10000,
    connectTimeoutMs: 60000
  })

  let closed = false
  let pairingDone = false

  const tryPair = async () => {
    if (!needsPairing || pairingDone || closed) return
    pairingDone = true
    try {
      const code = await sock.requestPairingCode(number)
      failures = 0
      console.log(`\n==============================`)
      console.log(` PAIRING CODE: ${code?.match(/.{1,4}/g)?.join('-') ?? code}`)
      console.log(`==============================`)
      console.log('WhatsApp > Linked devices > Link a device > Link with phone number instead\n')
    } catch (e) {
      console.error('Pairing code request failed:', e?.message || e)
      pairingDone = false
    }
  }

  // Request the code once the socket is ready ("qr" event), with a fallback timer
  setTimeout(tryPair, 6000)

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) await tryPair()
    if (connection === 'open') {
      failures = 0
      console.log('✅ Bot connected!')
    }
    if (connection === 'close') {
      closed = true
      const err = lastDisconnect?.error
      const code = err?.output?.statusCode
      if (code === DisconnectReason.loggedOut) {
        console.log('Logged out. Delete the data/session folder and restart to pair again.')
        process.exit(0)
      }
      failures++
      console.log(`Connection closed (code ${code ?? 'unknown'}: ${err?.message || 'no message'}), attempt ${failures}`)
      if (code === 405 && failures >= 3) {
        console.log('WhatsApp keeps rejecting this connection (405). Waiting 30s before retrying...')
      }
      const delay = Math.min(1000 * 2 ** Math.min(failures, 5), 30000)
      await sleep(delay)
      start().catch((e) => console.error('Restart failed:', e?.message || e))
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg, commands)
      } catch (e) {
        console.error('Handler error:', e?.message || e)
      }
    }
  })
}

start().catch((e) => console.error('Start failed:', e))
