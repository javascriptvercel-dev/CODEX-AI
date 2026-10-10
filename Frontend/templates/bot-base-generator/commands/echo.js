export default {
  name: 'echo',
  aliases: ['say'],
  description: 'Repeat your text',
  async run({ reply, args, config }) {
    if (!args.length) return reply(`Usage: ${config.prefix}echo <text>`)
    await reply(`🗣️ ${args.join(' ')}`)
  }
}
