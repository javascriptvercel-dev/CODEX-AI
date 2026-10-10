import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'quotes.json')

export default {
  name: 'quote',
  description: 'Get a random quote',
  async run({ reply }) {
    const quotes = JSON.parse(fs.readFileSync(file, 'utf8'))
    await reply(`💬 ${quotes[Math.floor(Math.random() * quotes.length)]}`)
  }
}
