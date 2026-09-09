import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Suggest a Feature",
  description: "Share an idea for CODEX AI — a plugin, a feature, or an integration.",
  path: "/suggest",
});

export default function SuggestLayout({ children }) {
  return children;
}
