import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Log in",
  description: "Log in to continue to your CODEX AI destination.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }) {
  return children;
}
