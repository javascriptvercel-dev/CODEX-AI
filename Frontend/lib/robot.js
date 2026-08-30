const SAY_EVENT = "codex-robot:say";
const MOOD_EVENT = "codex-robot:mood";
export const robot = {
  say(message) {
    if (typeof window === "undefined" || !message) return;
    window.dispatchEvent(new CustomEvent(SAY_EVENT, { detail: { message } }));
  },
  mood(mood) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(MOOD_EVENT, { detail: { mood } }));
  },
};
export const ROBOT_EVENTS = { SAY_EVENT, MOOD_EVENT };
