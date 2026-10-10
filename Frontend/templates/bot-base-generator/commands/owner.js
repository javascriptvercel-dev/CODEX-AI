export default {
  name: 'owner',
  description: 'Send the owner contact',
  async run({ sock, from, msg, config }) {
    const vcard =
      'BEGIN:VCARD\nVERSION:3.0\n' +
      `FN:${config.ownerName}\n` +
      `TEL;type=CELL;waid=${config.ownerNumber}:+${config.ownerNumber}\n` +
      'END:VCARD'
    await sock.sendMessage(
      from,
      { contacts: { displayName: config.ownerName, contacts: [{ vcard }] } },
      { quoted: msg }
    )
  }
}
