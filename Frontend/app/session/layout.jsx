import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Session",
  description: "Pair your WhatsApp number with CODEX AI using a secure linking method.",
  path: "/session",
});

export default function SessionLayout({ children }) {
  return children;
}
