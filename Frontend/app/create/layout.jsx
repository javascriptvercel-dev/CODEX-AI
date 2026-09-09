import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Create a Plugin",
  description: "Submit a new plugin to the CODEX AI community library.",
  path: "/create",
});

export default function CreateLayout({ children }) {
  return children;
}
