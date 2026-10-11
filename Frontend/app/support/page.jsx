import { LifeBuoy, ShieldCheck } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SupportFaqs from "@/components/support/SupportFaqs";
import { SUPPORT_CHANNELS } from "@/lib/supportChannels";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Support",
  description:
    "Get help from the CODEX AI community, follow release updates, and find quick answers before you reach out.",
  path: "/support",
});

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
      <Icon size={24} className="flex-none" style={{ color: channel.color }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg sm:text-base">{channel.name}</span>
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
                <div className="mb-4 inline-flex items-center gap-2 rounded-[3px] border border-azure-500/20 bg-azure-500/10 px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-azure-500">
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
                    <SiWhatsapp size={16} color="#25D366" aria-hidden="true" />
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
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-azure-500">Community</p>
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
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-azure-500">Updates & learning</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Stay in the loop</h2>
            </div>
            <div className="grid gap-3">
              {[...updates, ...learning].map((channel) => <SupportCard key={channel.name} channel={channel} />)}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-azure-500">Quick answers</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">Before you reach out</h2>
            </div>
            <SupportFaqs />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
