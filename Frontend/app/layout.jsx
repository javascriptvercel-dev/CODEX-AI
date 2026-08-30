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
export const metadata = {
  title: "CODEX AI BOT — Bot workspace",
  description:
    "A multifunctional WhatsApp bot workspace built with Baileys.",
  icons: {
    icon: "/codex-robot.png",
    shortcut: "/codex-robot.png",
    apple: "/codex-robot.png",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        
        <ThemeProvider>
          
          <AuthProvider>
            
            {children} <RobotWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
