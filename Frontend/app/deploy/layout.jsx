import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Deploy",
  description: "Generate a ready-to-run CODEX AI bot and deploy it in minutes.",
  path: "/deploy",
});

export default function DeployLayout({ children }) {
  return children;
}
