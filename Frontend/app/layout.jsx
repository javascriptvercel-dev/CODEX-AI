import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import RobotWidget from "@/components/robot/RobotWidget";
import Script from "next/script";
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600"],
});
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://codex-ai.site"
).replace(/\/+$/, "");

const SITE_NAME = "CODEX AI";
const TITLE = "CODEX AI — Multifunctional WhatsApp Bot";
const DESCRIPTION =
  "CODEX AI is a multifunctional WhatsApp bot: pair a session, deploy in minutes, and browse a growing library of free plugins with community support.";
const OG_IMAGE = `${siteUrl}/codex-robot.png`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "WhatsApp bot",
    "CODEX AI",
    "WhatsApp bot plugins",
    "multifunctional WhatsApp bot",
    "bot session pairing",
    "deploy WhatsApp bot",
  ],
  alternates: { canonical: siteUrl },
  verification: {
    google: "cyqYA6TZYfiaLt20QYRr1-Vw3QjRJkg47ACroMzy8yU",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: siteUrl,
    images: [{ url: OG_IMAGE, width: 1024, height: 1024, alt: "CODEX AI robot mark" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: {
    icon: "/codex-robot.png",
    shortcut: "/codex-robot.png",
    apple: "/codex-robot.png",
  },
  other: {
    "google-adsense-account": "ca-pub-5108480355141022",
  },
};

// Structured data so Google can show CODEX AI as a known site/app
// with a sitelinks search box for the plugin library.
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/plugins?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Web, WhatsApp",
    url: siteUrl,
    image: OG_IMAGE,
    description: DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
];

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >

      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >

        <ThemeProvider>

          <AuthProvider>

            {children}
            <RobotWidget />
            <Script
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5108480355141022"
              crossOrigin="anonymous"
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
