# WhatsApp Bot

Pterodactyl setup:
1. Use a Node.js egg (Node 20+).
2. Upload these files (or the zip and unarchive).
3. Startup file: `index.js` (or command `npm install && node index.js`).
4. Start the server, type your number (with country code) in the console, press Enter.
5. Enter the pairing code in WhatsApp > Linked devices > Link with phone number.

Add commands: create a file in `commands/` exporting `{ name, aliases, description, run }`.
