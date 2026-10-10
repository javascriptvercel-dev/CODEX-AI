import readline from 'readline'

export function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false })
    process.stdout.write(question)
    rl.once('line', (line) => {
      rl.close()
      resolve(line.trim())
    })
  })
}
