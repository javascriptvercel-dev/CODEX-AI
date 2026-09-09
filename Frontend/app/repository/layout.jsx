import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Repository",
  description: "Browse the CODEX AI source, track updates, and contribute on GitHub.",
  path: "/repository",
});

export default function RepositoryLayout({ children }) {
  return children;
}
