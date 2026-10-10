export default {
  name: 'dice',
  aliases: ['roll'],
  description: 'Roll a dice (1-6)',
  async run({ reply }) {
    await reply(`🎲 You rolled a *${Math.floor(Math.random() * 6) + 1}*`)
  }
}
