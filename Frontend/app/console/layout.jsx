import { buildMetadata } from "@/lib/seo";

// noIndex: this is an authenticated admin area, not a public page.
export const metadata = buildMetadata({
  title: "Console",
  description: "Review plugin submissions, triage feedback, and manage the CODEX AI workspace.",
  noIndex: true,
});

export default function ConsoleLayout({ children }) {
  return children;
}
