import LockedRoutePage from "@/components/layout/LockedRoutePage";
import { getLockedPage } from "@/lib/lockedPages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "APIs",
  description: "Programmatic access to CODEX AI is in development. Availability will be announced when it is ready.",
  path: "/apis",
});

export default function APIsPage() {
  return <LockedRoutePage page={getLockedPage("/apis")} />;
}
