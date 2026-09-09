import LockedRoutePage from "@/components/layout/LockedRoutePage";
import { getLockedPage } from "@/lib/lockedPages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "APIs",
  description: "Programmatic access to CODEX AI is in development and will unlock soon.",
  path: "/apis",
});

export default function APIsPage() {
  return <LockedRoutePage page={getLockedPage("/apis")} />;
}
