import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Plugins",
  description: "Discover and install community plugins for your WhatsApp bot, or publish your own.",
  path: "/plugins",
});

export default function PluginsLayout({ children }) {
  return children;
}
