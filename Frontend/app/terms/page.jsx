import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SupportLink from "@/components/layout/SupportLink";
export const metadata = {
  title: "Terms of Service | CODEX AI",
  description: "The terms that govern use of CODEX AI.",
};
const sections = [
  {
    title: "1. Acceptance of These Terms",
    content: [
      "These Terms of Service form a binding agreement between you and CODEX AI regarding your access to and use of the CODEX AI website, workspace, plugins, and related services (collectively, the “Service”). By accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
      "You must have the legal capacity to enter into this agreement. If you use the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.",
    ],
  },
  {
    title: "2. Accounts and Security",
    content: [
      "You are responsible for providing accurate account information and keeping it current. Keep your password and access credentials confidential, and notify us promptly through Support if you suspect unauthorized access. You are responsible for activity conducted through your account unless it resulted from our failure to use reasonable security measures.",
      "We may suspend or limit access to an account when reasonably necessary to protect the Service, investigate abuse, address a security issue, or comply with law.",
    ],
  },
  {
    title: "3. Acceptable Use",
    content: [
      "You may use the Service only in compliance with applicable law and these Terms. You must not use it to send unsolicited or unlawful communications, impersonate another person, violate privacy or intellectual-property rights, distribute malware, interfere with the Service, bypass access controls, or facilitate fraud, harassment, abuse, or other harmful activity.",
      "You are responsible for obtaining all permissions and consents required for messages, data, contacts, repositories, and other material you connect to or process through the Service. You must comply with WhatsApp’s terms and policies and with any applicable messaging, marketing, and data-protection laws.",
    ],
  },
  {
    title: "4. Your Content and Plugins",
    content: [
      "You retain ownership of content you submit to the Service. You grant CODEX AI a limited, worldwide, non-exclusive license to host, store, reproduce, transmit, and display that content as necessary to provide, secure, and improve the Service. You represent that you have the rights needed to grant this license.",
      "Plugins, repositories, and other third-party content may be provided by their respective creators. You are responsible for reviewing and testing them before use. CODEX AI does not guarantee that third-party content is secure, accurate, compatible, or continuously available.",
    ],
  },
  {
    title: "5. Intellectual Property",
    content: [
      "The Service, including its software, design, branding, documentation, and original materials, is owned by CODEX AI or its licensors and is protected by applicable intellectual-property laws. These Terms grant you a limited, revocable, non-transferable right to use the Service for its intended purpose; they do not transfer ownership or grant any rights not expressly stated here.",
      "If you believe content on the Service infringes your rights, contact Support with enough information for us to investigate. We may remove content that reasonably appears to violate these Terms or applicable law.",
    ],
  },
  {
    title: "6. Fees and Third-Party Services",
    content: [
      "Any fees, limits, or usage terms presented for a particular feature apply when you activate or purchase that feature. Unless required by law, fees are non-refundable except as expressly stated at the time of purchase.",
      "The Service may depend on or link to third-party services. Those services are governed by their own terms, and CODEX AI is not responsible for their availability, content, security, or performance.",
    ],
  },
  {
    title: "7. Disclaimers and Limitation of Liability",
    content: [
      "The Service is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, CODEX AI disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, availability, and accuracy. We do not guarantee uninterrupted or error-free operation, or that the Service will meet every requirement.",
      "To the fullest extent permitted by law, CODEX AI and its providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, data, revenue, or business opportunities arising from or related to the Service. Our total liability for claims relating to the Service will not exceed the amount you paid us for the Service during the twelve months before the event giving rise to the claim, or USD 100 if you paid nothing.",
    ],
  },
  {
    title: "8. Indemnification",
    content: [
      "To the extent permitted by law, you agree to defend, indemnify, and hold harmless CODEX AI and its personnel from claims, losses, liabilities, damages, costs, and expenses arising from your content, your use or misuse of the Service, your violation of these Terms, or your violation of another person’s rights or applicable law.",
    ],
  },
  {
    title: "9. Termination and Changes",
    content: [
      "You may stop using the Service at any time. We may suspend or terminate access if you materially breach these Terms, create risk for users or the Service, or where required for legal or operational reasons. Provisions that by their nature should survive termination, including ownership, disclaimers, limitations of liability, and indemnification, will survive.",
      "We may update these Terms as the Service evolves. For material changes, we will provide reasonable notice through the Service or by email. Continued use after the effective date means you accept the revised Terms.",
    ],
  },
  {
    title: "10. General Terms",
    content: [
      "These Terms and any policies referenced here are the entire agreement concerning the Service and replace prior agreements on that subject. If a provision is unenforceable, it will be modified to the minimum extent necessary, and the remaining provisions will remain in effect. You may not assign these Terms without our written consent; we may assign them in connection with a merger, acquisition, or transfer of assets.",
      "These Terms are governed by the laws applicable in the jurisdiction where CODEX AI is established, without regard to conflict-of-law rules, unless mandatory local law requires otherwise. Any dispute will be resolved in a court of competent jurisdiction in that location, subject to any rights you have under applicable consumer law.",
    ],
  },
];
export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      
      <Navbar />
      <main className="flex-1">
        
        <article className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
          
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-azure-500">
            Legal
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-muted">Effective August 26, 2026</p>
          <p className="mt-8 text-base leading-7 text-muted">
            
            These Terms govern your access to and use of CODEX AI. They explain
            your responsibilities, the rights you grant us to operate the
            Service, and the limits that apply to our relationship.
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
            
            Questions about these Terms can be submitted through <SupportLink />
            .
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
