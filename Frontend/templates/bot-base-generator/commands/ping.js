export default {
  name: 'ping',
  description: 'Check bot speed',
  async run({ reply, msg }) {
    const start = Date.now()
    const ts = Number(msg.messageTimestamp) * 1000
    await reply(`🏓 Pong! ${Math.max(Date.now() - ts, Date.now() - start)}ms`)
  }
}
