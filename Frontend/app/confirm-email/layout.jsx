import { buildMetadata } from "@/lib/seo";

// noIndex: single-use confirmation links must never be indexed.
export const metadata = buildMetadata({
  title: "Confirm email",
  description: "Confirm your new CODEX AI email address.",
  noIndex: true,
});

export default function ConfirmEmailLayout({ children }) {
  return children;
}
