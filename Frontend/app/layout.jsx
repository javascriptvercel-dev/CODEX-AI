import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import RobotWidget from "@/components/robot/RobotWidget";
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
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "CODEX AI — Multifunctional WhatsApp Bot",
  description:
    "A multifunctional WhatsApp bot with fun plugins and community support.",
  icons: {
    icon: "/codex-robot.png",
    shortcut: "/codex-robot.png",
    apple: "/codex-robot.png",
  },
};
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
