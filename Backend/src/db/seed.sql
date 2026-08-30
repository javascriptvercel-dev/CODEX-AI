-- Optional: a few real example plugins so the catalog isn't empty on first
-- run. Safe to skip or delete — nothing in the app depends on this data.
-- public_id values below are arbitrary 20-char ids, matching the format the
-- backend generates for real submissions.

insert into public.plugins (public_id, name, author_name, description, code, category)
values
  (
    'WeatherAsst00000001',
    'Weather Assistant',
    'CODEX Labs',
    'Replies with live weather and a short forecast for any city.',
    'export async function run(ctx) {\n  const forecast = await getWeather(ctx.args.join(" "));\n  return ctx.reply(forecast);\n}',
    'Utility'
  ),
  (
    'BookingBot000000002',
    'Booking Bot',
    'Northstar Dev',
    'Lets customers reserve a time slot and get a confirmation message.',
    'export async function run(ctx) {\n  const slot = await reserveSlot(ctx.args[0]);\n  return ctx.reply(`Booked for ${slot}.`);\n}',
    'Productivity'
  ),
  (
    'KnowledgeBase0000003',
    'Knowledge Base',
    'Docs Collective',
    'Answers FAQs by searching a connected knowledge base.',
    'export async function run(ctx) {\n  const [answer] = await kb.search(ctx.text);\n  return ctx.reply(answer ?? "I could not find that.");\n}',
    'AI'
  )
on conflict (public_id) do nothing;
