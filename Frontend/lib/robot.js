const SAY_EVENT = "codex-robot:say";
const MOOD_EVENT = "codex-robot:mood";
const ASSISTANT_ASK_EVENT = "codex-robot:assistant-ask";
export const robot = {
  say(message) {
    if (typeof window === "undefined" || !message) return;
    window.dispatchEvent(new CustomEvent(SAY_EVENT, { detail: { message } }));
  },
  mood(mood) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(MOOD_EVENT, { detail: { mood } }));
  },
  askAssistant(question) {
    if (
      typeof window === "undefined" ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent(ASSISTANT_ASK_EVENT, {
        detail: { question: question.trim() },
      }),
    );
  },
};
export const ROBOT_EVENTS = { SAY_EVENT, MOOD_EVENT, ASSISTANT_ASK_EVENT };
