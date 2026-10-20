import { buildMetadata } from "@/lib/seo";

// noIndex: the dashboard is a private, signed-in area with no public entry.
export const metadata = buildMetadata({
  title: "Dashboard",
  description: "Your CODEX AI account, tools, and Premium status.",
  noIndex: true,
});

export default function DashboardLayout({ children }) {
  return children;
}
