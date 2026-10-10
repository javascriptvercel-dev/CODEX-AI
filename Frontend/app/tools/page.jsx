import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ToolsHub from "@/components/tools/ToolsHub";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tools",
  description:
    "Free tools for WhatsApp bot owners, including a ban checker and bot base generator.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <Navbar />
      <main className="flex-1">
        <ToolsHub />
      </main>
      <Footer />
    </div>
  );
}
