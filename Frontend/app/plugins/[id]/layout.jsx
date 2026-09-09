import { buildMetadata } from "@/lib/seo";

// Metadata here is intentionally generic: the page itself fetches the
// plugin client-side, and this layout renders before that data exists.
// A future improvement would move that fetch server-side so this can
// use generateMetadata() with the plugin's real name/description.
export const metadata = buildMetadata({
  title: "Plugin Details",
  description: "View plugin details, install commands, and source code.",
});

export default function PluginDetailLayout({ children }) {
  return children;
}
