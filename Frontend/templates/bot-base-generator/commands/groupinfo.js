export default {
  name: 'groupinfo',
  aliases: ['ginfo'],
  description: 'Show info about the current group',
  async run({ sock, from, isGroup, reply }) {
    if (!isGroup) return reply('This command only works in groups.')
    const meta = await sock.groupMetadata(from)
    const admins = meta.participants.filter((p) => p.admin).length
    await reply(
      `*${meta.subject}*\n\n👥 Members: ${meta.participants.length}\n👑 Admins: ${admins}\n📝 ${meta.desc || 'No description'}`
    )
  }
}
