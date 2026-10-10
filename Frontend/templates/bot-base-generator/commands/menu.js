export default {
  name: 'menu',
  aliases: ['help'],
  description: 'Show all commands',
  async run({ reply, commands, config }) {
    const unique = [...new Set(commands.values())]
    const lines = unique.map((c) => `• ${config.prefix}${c.name} - ${c.description}`)
    await reply(`*${config.botName} Menu*\n\n${lines.join('\n')}`)
  }
}
