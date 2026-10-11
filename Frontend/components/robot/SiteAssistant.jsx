"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Bot, Send, X } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { SUPPORT_FAQS } from "@/lib/supportFaqs";
import { api } from "@/lib/api";

const DEPLOYMENT_PROMPTS = [
  "Which deployment should I choose?",
  "What is persistent storage?",
  "Show me the VPS steps",
];
const MIN_REPLY_DELAY_MS = 2000;
const TYPING_INTERVAL_MS = 18;
const TYPING_CHUNK_SIZE = 3;

const PAGE_PROMPTS = {
  deploy: DEPLOYMENT_PROMPTS,
  session: [
    "How do I pair my WhatsApp?",
    "Which pairing method should I use?",
    "Is my session ID private?",
  ],
  plugins: [
    "How do I find a plugin?",
    "How do I submit a plugin?",
    "What format should plugin code use?",
  ],
  tools: [
    "What tools are available?",
    "How does the bot base generator work?",
    "What does the ban checker do?",
  ],
  support: [
    "Where can I get help?",
    "What should I include in a bug report?",
    "What information should I keep private?",
  ],
  default: [
    "What can I do on this site?",
    "How do I connect my WhatsApp?",
    "How do I deploy the bot?",
  ],
};

const DEPLOYMENT_ANSWER = {
  text: "The best fit depends on what you have access to. A panel is the simplest route if you already have one; a Linux VPS gives you direct control. Render needs an always-on service and persistent disk, Docker needs persistent volumes, and Heroku is not recommended for the bot as-is because its local files can be lost. Every option needs Node.js 22+, one running bot per session, and storage that survives restarts.",
  link: { href: "/deploy", label: "See deployment options" },
};

function getPageKey(pathname) {
  if (pathname === "/session") return "session";
  if (pathname === "/plugins" || pathname.startsWith("/plugins/")) return "plugins";
  if (pathname === "/tools" || pathname.startsWith("/tools/")) return "tools";
  if (pathname === "/support") return "support";
  if (pathname === "/deploy") return "deploy";
  return "default";
}

function answerQuestion(question, pathname, approvedFaqs = []) {
  const normalized = question.toLowerCase();
  const exactFaq = SUPPORT_FAQS.find(
    (faq) => faq.question.toLowerCase() === normalized.trim(),
  ) || approvedFaqs.find(
    (faq) => faq.question?.toLowerCase() === normalized.trim(),
  );

  if (exactFaq) return { text: exactFaq.answer, link: null };

  if (/session id|token|password|private|secret|credential/.test(normalized)) {
    return {
      text: "Yes—your session ID is private and should be treated like a password. Don’t share it in messages, screenshots, public issues, or plugin code. If you think it was exposed, generate a new one.",
      link: null,
    };
  }

  if (/pair|link|connect|qr|whatsapp number/.test(normalized)) {
    return {
      text: "Open the Session page, choose a linking method, and follow the on-screen instructions in WhatsApp. Keep the resulting session details private. Once linked, use the Deploy page to configure the bot.",
      link: { href: "/session", label: "Open Session" },
    };
  }

  if (/persistent|storage|restart|disk|lost data/.test(normalized)) {
    return {
      text: "Persistent storage keeps files after a host restarts or redeploys. This bot needs it for its WhatsApp login under session/ and runtime data under database/. Without it, the bot may need to be paired again and can lose saved data.",
      link: { href: "/deploy", label: "Review deployment requirements" },
    };
  }

  if (/vps|linux|pm2/.test(normalized)) {
    return {
      text: "For a Linux VPS, install Node.js 22+, Git, pnpm, and PM2; clone the bot repo; install dependencies; configure config.json and a private SESSION_ID; then start one process with PM2. Keep session/ and database/ on persistent storage.",
      link: { href: "/deploy#linux-vps", label: "Open Linux VPS steps" },
    };
  }

  if (/render/.test(normalized)) {
    return {
      text: "The repo includes a Render Blueprint. Configure SESSION_ID privately, use a service that stays running, and retain the persistent disk mounted for session/ and database/. The repo marks the Blueprint untested, so check the first deployment logs and confirm the disk survives redeploys.",
      link: { href: "/deploy#render", label: "Open Render steps" },
    };
  }

  if (/docker|container/.test(normalized)) {
    return {
      text: "Docker can work if you run one container per WhatsApp session, provide SESSION_ID privately, and mount persistent volumes for /app/session and /app/database. The repo doesn’t include Docker files, so the example setup on the Deploy page needs to be tested on your host.",
      link: { href: "/deploy#docker", label: "Open Docker steps" },
    };
  }

  if (/heroku/.test(normalized)) {
    return {
      text: "Heroku isn’t recommended for this bot as-is. The bot saves its WhatsApp login and runtime data to local files, and Heroku’s filesystem is ephemeral. It would need a storage redesign before deployment could be reliable.",
      link: { href: "/deploy#heroku", label: "Read the Heroku notes" },
    };
  }

  if (/deploy|hosting|host|pterodactyl|panel/.test(normalized)) {
    return DEPLOYMENT_ANSWER;
  }

  if (/announcement|release note|project update/.test(normalized)) {
    return { text: SUPPORT_FAQS[1].answer, link: null };
  }

  if (/problem|bug|error|issue|report/.test(normalized)) {
    return { text: SUPPORT_FAQS[2].answer, link: null };
  }

  if (/support|help|community|where.*ask/.test(normalized)) {
    return { text: SUPPORT_FAQS[0].answer, link: null };
  }

  if (/plugin format|plugin code|commands|submit|create.*plugin|upload.*plugin/.test(normalized)) {
    return {
      text: "Open Plugins and choose the option to submit a plugin. Add a clear name and description, then paste your source or upload a file. The code example in the form is a placeholder only; replace it with your own plugin code before submitting.",
      link: { href: "/plugins", label: "Open Plugins" },
    };
  }

  if (/find.*plugin|search.*plugin|plugin.*find/.test(normalized)) {
    return {
      text: "Open Plugins to browse or search the library. You can filter the listings to narrow down what you need.",
      link: { href: "/plugins", label: "Browse Plugins" },
    };
  }

  if (/tool|generator|ban checker|bot base/.test(normalized)) {
    return {
      text: "The Tools page has utilities including the Bot Base Generator and WhatsApp Ban Checker. Open a tool card to see its form and instructions.",
      link: { href: "/tools", label: "Browse Tools" },
    };
  }

  if (/support|help|bug|problem|error/.test(normalized)) {
    return {
      text: "For community help, open Support and choose a WhatsApp or Telegram channel. When reporting a problem, explain what you tried and include the visible error—but remove passwords, session IDs, pairing codes, and tokens.",
      link: { href: "/support", label: "Open Support" },
    };
  }

  if (/what can|what do|this site|codex/.test(normalized)) {
    return {
      text: "CODEX AI helps you pair a WhatsApp session, configure and deploy the bot, browse community plugins, and use bot-related tools. Pick a quick question below or ask me about one of those areas.",
      link: null,
    };
  }

  return {
    text: `I’m not sure about that one yet. I can help with ${getPageKey(pathname) === "deploy" ? "deployment, hosting, and persistent storage" : "sessions, deployment, plugins, tools, and support"}. Try one of the suggested questions, or visit Support for community help.`,
    link: { href: "/support", label: "Open Support" },
    fallback: true,
  };
}

export default function SiteAssistant({ open, onClose, askRequest }) {
  const pathname = usePathname();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [faqDraftStatus, setFaqDraftStatus] = useState("");
  const [approvedFaqs, setApprovedFaqs] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageIdRef = useRef(0);
  const handledAskRequestRef = useRef(0);
  const pageKey = getPageKey(pathname);
  const suggestions = PAGE_PROMPTS[pageKey];

  const showReply = useCallback(async (reply, minimumDelay) => {
    await minimumDelay;

    messageIdRef.current += 1;
    const id = `assistant-${messageIdRef.current}`;
    setMessages((current) => [
      ...current,
      { id, role: "assistant", ...reply, text: "" },
    ]);

    for (let end = TYPING_CHUNK_SIZE; end <= reply.text.length; end += TYPING_CHUNK_SIZE) {
      await new Promise((resolve) => window.setTimeout(resolve, TYPING_INTERVAL_MS));
      const visibleText = reply.text.slice(0, end);
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, text: visibleText } : message,
        ),
      );
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, text: reply.text } : message,
      ),
    );
  }, []);

  const queueFaqDraft = useCallback(async (submittedQuestion, submittedAnswer) => {
    setFaqDraftStatus("preparing");
    try {
      const result = await fetch("/api/site-assistant/faq-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: submittedQuestion,
          answer: submittedAnswer,
        }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "FAQ draft request failed.");
      if (!data.draft) {
        setFaqDraftStatus("skipped");
        return;
      }
      await api.createAssistantFaqDraft(data.draft);
      setFaqDraftStatus("queued");
    } catch {
      console.error("[site-assistant] FAQ draft could not be submitted.");
      setFaqDraftStatus("failed");
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();

    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    api
      .publishedAssistantFaqs()
      .then(({ faqs }) => {
        if (!cancelled) setApprovedFaqs(Array.isArray(faqs) ? faqs : []);
      })
      .catch(() => {
        if (!cancelled) {
          console.error("[site-assistant] Approved FAQs could not be loaded.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const ask = useCallback(async (rawQuestion) => {
    const trimmedQuestion = rawQuestion.trim();
    if (!trimmedQuestion || pending) return;

    const minimumDelay = new Promise((resolve) =>
      window.setTimeout(resolve, MIN_REPLY_DELAY_MS),
    );
    const response = answerQuestion(trimmedQuestion, pathname, approvedFaqs);
    setFaqDraftStatus("");
    messageIdRef.current += 1;
    setMessages((current) => [
      ...current.slice(-18),
      {
        id: `user-${messageIdRef.current}`,
        role: "user",
        text: trimmedQuestion,
      },
    ]);
    setQuestion("");
    setPending(true);
    let reply;

    try {
      if (!response.fallback) {
        reply = response;
      } else {
        const result = await fetch("/api/site-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmedQuestion, page: pageKey }),
        });
        const data = await result.json();
        if (!result.ok) throw new Error(data.error || "AI assistant is unavailable.");
        if (typeof data.answer !== "string" || !data.answer.trim()) {
          throw new Error("AI assistant returned an empty answer.");
        }
        reply = { text: data.answer.trim() };
      }

      await showReply(reply, minimumDelay);
    } catch (error) {
      reply = {
        text: `${response.text}\n\nI couldn’t answer that just now. Please try again later or visit Support.`,
        link: response.link,
      };
      await showReply(
        reply,
        minimumDelay,
      );
    } finally {
      setPending(false);
    }
    void queueFaqDraft(trimmedQuestion, reply.text);
  }, [approvedFaqs, pageKey, pathname, pending, queueFaqDraft, showReply]);

  useEffect(() => {
    if (
      !open ||
      !askRequest ||
      handledAskRequestRef.current === askRequest.id
    ) {
      return;
    }
    handledAskRequestRef.current = askRequest.id;
    void ask(askRequest.question);
  }, [askRequest, open, ask]);

  return (
    <section
      id="site-assistant-panel"
      role="dialog"
      aria-label="CODEX AI site assistant"
      aria-modal="false"
      className={`fixed bottom-24 right-3 z-50 flex max-h-[min(36rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl transition duration-200 sm:bottom-28 sm:right-5 ${
        open
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-3 scale-95 opacity-0"
      }`}
      aria-hidden={!open}
    >
      <header className="flex items-center gap-3 border-b border-edge bg-surface2 p-4">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-azure-500/10 text-azure-500">
          <Bot size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-fg">
            CODEX AI Assistant
            <VerifiedBadge size={15} label="Verified CODEX AI assistant" />
          </h2>
          <p className="text-xs text-muted">Help with CODEX AI and the site</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          tabIndex={open ? 0 : -1}
          className="focus-ring grid h-9 w-9 flex-none place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-fg"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-surface2 px-3.5 py-3 text-sm leading-5 text-fg">
          {pageKey === "deploy"
            ? "Hey! I can walk you through the deployment options on this page. What are you setting up?"
            : "Hey! I can help you find your way around CODEX AI. What are you trying to do?"}
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-sm leading-5 ${
                message.role === "user"
                  ? "rounded-br-sm bg-azure-500 text-white"
                  : "rounded-tl-sm bg-surface2 text-fg"
              }`}
            >
              <p className="whitespace-pre-line">{message.text}</p>
              {message.link ? (
                <a
                  href={message.link.href}
                  onClick={onClose}
                  tabIndex={open ? 0 : -1}
                  className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                >
                  {message.link.label}
                  <ArrowRight size={12} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        ))}
        {pending ? (
          <div className="flex justify-start" role="status" aria-label="Assistant is typing">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface2 px-4 py-3">
              <span className="sr-only">Thinking and writing a reply</span>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-2 w-2 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: `${dot * 120}ms` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-edge p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => ask(suggestion)}
              disabled={pending}
              tabIndex={open ? 0 : -1}
              className="focus-ring rounded-full border border-edge bg-surface2 px-3 py-1.5 text-left text-xs leading-4 text-muted transition hover:border-azure-500/50 hover:text-fg disabled:cursor-wait disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask(question);
          }}
        >
          <label className="sr-only" htmlFor="site-assistant-question">
            Ask the site assistant
          </label>
          <input
            ref={inputRef}
            id="site-assistant-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={pending}
            maxLength={300}
            placeholder="Ask a question..."
            tabIndex={open ? 0 : -1}
            className="focus-ring min-w-0 flex-1 rounded-xl border border-edge bg-surface2 px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={!question.trim() || pending}
            tabIndex={open ? 0 : -1}
            aria-label="Send question"
            className="focus-ring grid h-10 w-10 flex-none place-items-center rounded-xl bg-azure-500 text-white transition hover:bg-azure-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
        <p className="mt-2 text-[11px] leading-4 text-muted">
          Questions and replies may be summarized into FAQ drafts for review. Never
          share passwords, session IDs, or tokens.
        </p>
        {faqDraftStatus ? (
          <p className="mt-1 text-[11px] leading-4 text-muted" role="status">
            {faqDraftStatus === "preparing"
              ? "Preparing a private FAQ draft…"
              : faqDraftStatus === "queued"
                ? "A private FAQ draft was sent for admin review."
                : faqDraftStatus === "skipped"
                  ? "No reusable FAQ draft was created for that question."
                  : "The answer worked, but an FAQ draft couldn’t be prepared."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
