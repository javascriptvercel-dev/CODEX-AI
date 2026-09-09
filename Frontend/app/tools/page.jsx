import LockedRoutePage from "@/components/layout/LockedRoutePage";
import { getLockedPage } from "@/lib/lockedPages";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tools",
  description: "Extra CODEX AI tooling is in development and will unlock soon.",
  path: "/tools",
});

export default function ToolsPage() {
  return <LockedRoutePage page={getLockedPage("/tools")} />;
}
