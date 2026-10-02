import { ShieldCheck } from "lucide-react";

/**
 * Tools registry — the single place every tool is declared.
 *
 * To add a tool:
 *   1. Build its UI as a default-exported client component, e.g.
 *      components/tools/<slug>/<Name>.jsx
 *   2. Add one entry below. The hub card, the /tools/<slug> page, the
 *      sitemap entry and the lazy loading all come from this entry.
 *
 * `load` is a dynamic import, so a tool's code is only downloaded when
 * someone opens it. Leave `load` out (and set status "soon") to show a
 * non-clickable "coming soon" card.
 */
export const TOOL_STATUS = {
  LIVE: "live",
  BETA: "beta",
  SOON: "soon",
};

export const tools = [
  {
    slug: "wa-ban-checker",
    name: "WhatsApp Ban Checker",
    description:
      "Check whether a WhatsApp number is active, temporarily restricted or permanently banned.",
    icon: ShieldCheck,
    status: TOOL_STATUS.LIVE,
    tags: ["WhatsApp", "Lookup"],
    keywords: ["WhatsApp ban checker", "check banned WhatsApp number"],
    load: () => import("@/components/tools/wa-ban-checker/WaBanChecker"),
  },
];

export function getTool(slug) {
  return tools.find((tool) => tool.slug === slug) || null;
}

export function isToolOpenable(tool) {
  return Boolean(tool?.load) && tool.status !== TOOL_STATUS.SOON;
}
