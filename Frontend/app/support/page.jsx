import { ArrowUpRight, CircleHelp, LifeBuoy, MessageCircle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SUPPORT_CHANNELS } from "@/lib/supportChannels";

const FAQS = [
  {
    question: "Where should I ask for help?",
    answer: "Use the WhatsApp or Telegram community when you want help from other users or need to discuss a setup problem.",
  },
  {
    question: "Where do I find announcements?",
    answer: "Follow the announcement channels for release notes, important notices, and project updates.",
  },
  {
    question: "I found a problem. What should I include?",
    answer: "Describe what you were trying to do, what happened, and any visible error message. Avoid sharing passwords, session codes, tokens, or private account information.",
  },
];

function SupportCard({ channel }) {
  const Icon = channel.icon;

  return (
    <a
      href={channel.href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${channel.name} — opens in a new tab`}
      className="focus-ring group flex min-h-[108px] items-center gap-4 rounded-2xl border border-edge bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-azure-500/60 hover:shadow-glow sm:p-5"
    >
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-azure-500/10 text-azure-500 sm:h-12 sm:w-12">
        <Icon size={19} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="block text-sm font-semibold text-fg sm:text-base">{channel.name}</span>
          <ArrowUpRight size={16} className="mt-0.5 flex-none text-muted transition group-hover:text-azure-500" aria-hidden="true" />
        </span>
        <span className="mt-1 block text-xs leading-5 text-muted sm:text-sm">{channel.description}</span>
      </span>
    </a>
  );
}

export default function SupportPage() {
  const community = SUPPORT_CHANNELS.filter((channel) => channel.group === "community");
  const updates = SUPPORT_CHANNELS.filter((channel) => channel.group === "updates");
  const learning = SUPPORT_CHANNELS.filter((channel) => channel.group === "learning");

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-edge bg-surface shadow-glow">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-azure-500 via-azure-300 to-azure-500" />
            <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:p-10">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-azure-500/20 bg-azure-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-azure-500">
                  <LifeBuoy size={13} aria-hidden="true" /> Support
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-fg sm:text-5xl">
                  Get help without the guesswork.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
                  Join the community, follow updates, or use the learning channel that fits what you need. Everything is grouped below so you can get to the right place quickly.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-edge bg-surface2 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MessageCircle size={16} className="text-azure-500" aria-hidden="true" />
                    Community first
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted">Ask questions, compare solutions, and keep up with other users.</p>
                </div>
                <div className="rounded-2xl border border-edge bg-surface2 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck size={16} className="text-azure-500" aria-hidden="true" />
                    Keep private data private
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted">Never post passwords, session codes, access tokens, or private account details.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-azure-500">Community</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Talk to other users</h2>
            </div>
            <span className="hidden text-xs text-muted sm:block">Choose any channel</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {community.map((channel) => <SupportCard key={channel.name} channel={channel} />)}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-azure-500">Updates & learning</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Stay in the loop</h2>
            </div>
            <div className="grid gap-3">
              {[...updates, ...learning].map((channel) => <SupportCard key={channel.name} channel={channel} />)}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-azure-500">Quick answers</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Before you reach out</h2>
            </div>
            <div className="divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-surface">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group p-4 sm:p-5">
                  <summary className="focus-ring flex cursor-pointer list-none items-center gap-3 rounded-lg text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    <CircleHelp size={16} className="flex-none text-azure-500" aria-hidden="true" />
                    <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{faq.question}</span>
                    <span className="text-lg leading-none text-muted transition group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 pl-7 text-sm leading-6 text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
