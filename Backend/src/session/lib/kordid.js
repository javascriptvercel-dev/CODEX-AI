export function kordid(num = 8, prefix = "") {
  const size = Number(num) > 0 ? Number(num) : 8;
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const max = characters.length;
  for (let i = 0; i < size; i++) {
    result += characters.charAt(Math.floor(Math.random() * max));
  }
  return `${prefix}${result}`;
}
