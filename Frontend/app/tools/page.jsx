import LockedRoutePage from "@/components/layout/LockedRoutePage";
import { getLockedPage } from "@/lib/lockedPages";

export default function ToolsPage() {
  return <LockedRoutePage page={getLockedPage("/tools")} />;
}
