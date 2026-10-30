import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SupportLink from "@/components/layout/SupportLink";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How CODEX AI collects, uses, and protects information.",
  path: "/privacy",
});
const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "We collect information you provide when you create or manage an account, including your email address, profile details, authentication information, and content you submit to the service. You may also provide bot configuration, plugin submissions, repositories, and support requests.",
      "When you use the site assistant, your question and its reply may be processed by an AI service to provide an answer and create a reusable FAQ suggestion. The generated FAQ draft is stored for administrator review; only approved drafts are published. Do not include passwords, session IDs, tokens, or other sensitive information in assistant questions.",
      "We automatically receive technical information needed to operate and secure CODEX AI, such as log data, device and browser information, approximate location derived from your IP address, and usage events.",
    ],
  },
  {
    title: "2. Cookies and Browser Storage",
    content: [
      "A cookie is a small piece of information that a website asks your browser to store. Your browser sends that information back to the website with later requests, which lets the site remember things such as whether you are signed in.",
      "CODEX AI uses essential cookies for account authentication and secure sign-in. The codex_session cookie keeps you signed in, and short-lived cookies help protect sign-in when you use Google or GitHub. These cookies are necessary for the Service to work. We do not use cookies for advertising or analytics.",
      "CODEX AI also uses local storage and session storage in your browser for interface preferences and temporary page state. These are separate from cookies: they are not automatically sent to our servers with every request. You can clear or block cookies and browser storage in your browser settings; blocking essential cookies may prevent sign-in or other account features from working.",
    ],
  },
  {
    title: "3. How We Use Information",
    content: [
      "We use information to provide, maintain, personalize, and improve CODEX AI; authenticate users; process requests; communicate with you about the service; prevent fraud and abuse; troubleshoot issues; and comply with legal obligations.",
      "We do not sell your personal information. We use account and service data only for the purposes described in this Policy or with your direction and consent where required.",
    ],
  },
  {
    title: "4. WhatsApp and Third-Party Services",
    content: [
      "CODEX AI may connect with WhatsApp, hosting providers, storage providers, repositories, email providers, and other third-party services that you choose to use. Those services process information under their own terms and privacy policies. You are responsible for reviewing those policies and ensuring that your use of integrations is authorized.",
      "We may share information with vendors that provide infrastructure, security, analytics, communications, and support. These providers may access information only as needed to perform services for us and are expected to protect it.",
      "Assistant questions and replies used to prepare FAQ suggestions are sent to the AI service configured for CODEX AI. The FAQ review queue stores the generated summary, not the original conversation. The AI service may process submitted content under its own terms and privacy policy.",
    ],
  },
  {
    title: "5. Data Retention and Security",
    content: [
      "We retain information for as long as reasonably necessary to provide the service, meet contractual and legal requirements, resolve disputes, enforce agreements, and maintain security records. Retention periods vary by the type and purpose of the information.",
      "We use reasonable administrative, technical, and organizational safeguards designed to protect information. No internet transmission or storage system is completely secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "6. Your Choices and Rights",
    content: [
      "You may review or update certain account information through the service. You may request access to, correction of, or deletion of your personal information, subject to applicable law and legitimate operational requirements. You may also unsubscribe from non-essential communications by using the instructions in the message.",
      "To make a privacy request, contact us through the Support option in CODEX AI. We may need to verify your identity before completing a request. Depending on where you live, you may have additional rights under local privacy law.",
    ],
  },
  {
    title: "7. Children’s Privacy",
    content: [
      "CODEX AI is not directed to children under the age at which they may legally use the service in their jurisdiction. We do not knowingly collect personal information from children. If you believe a child has provided information to us, contact Support so we can review and remove it where appropriate.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      "We may update this Privacy Policy as the service or legal requirements change. When we make a material change, we will provide reasonable notice through the service or by email. The revised Policy becomes effective when posted unless stated otherwise.",
    ],
  },
];
export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">

      <Navbar />
      <main className="flex-1">

        <article className="mx-auto max-w-3xl px-5 py-10 sm:py-14">

          <p className="mb-3 font-mono text-sm uppercase tracking-[0.2em] text-azure-500">
            Legal
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted">Effective August 26, 2026</p>
          <p className="mt-8 text-base leading-7 text-muted">

            This Privacy Policy explains how CODEX AI collects, uses, shares,
            and protects information when you use our website, workspace,
            plugins, and related services (collectively, the “Service”).
          </p>
          <div className="mt-12 space-y-10">

            {sections.map((section) => (
              <section key={section.title}>

                <h2 className="font-display text-xl font-bold">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted">

                  {section.content.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-12 border-t border-edge pt-6 text-sm leading-7 text-muted">

            Questions about this Policy can be submitted through <SupportLink />
            .
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
