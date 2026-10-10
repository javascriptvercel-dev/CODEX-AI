import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.join(__dirname, '..', 'commands')

export async function loadCommands() {
  const commands = new Map()
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    try {
      const mod = await import(pathToFileURL(path.join(dir, file)).href)
      const cmd = mod.default
      if (!cmd?.name) continue
      commands.set(cmd.name, cmd)
      for (const alias of cmd.aliases || []) commands.set(alias, cmd)
    } catch (e) {
      console.error(`Failed to load command ${file}:`, e.message)
    }
  }
  return commands
}
