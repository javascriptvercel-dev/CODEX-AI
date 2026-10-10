export default {
  name: 'uptime',
  aliases: ['runtime'],
  description: 'Show how long the bot has been running',
  async run({ reply }) {
    let s = Math.floor(process.uptime())
    const d = Math.floor(s / 86400); s %= 86400
    const h = Math.floor(s / 3600); s %= 3600
    const m = Math.floor(s / 60); s %= 60
    await reply(`⏱️ Uptime: ${d}d ${h}h ${m}m ${s}s`)
  }
}
