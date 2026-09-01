import LockedRoutePage from "@/components/layout/LockedRoutePage";
import { getLockedPage } from "@/lib/lockedPages";

export default function APIsPage() {
  return <LockedRoutePage page={getLockedPage("/apis")} />;
}
