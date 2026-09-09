const SITE_NAME = "CODEX AI";
const DEFAULT_DESCRIPTION =
  "A multifunctional WhatsApp bot with fun plugins and community support.";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const OG_IMAGE = "/codex-robot.png";

/**
 * Build a Next.js `metadata` object with a page-specific title,
 * description, and matching Open Graph / Twitter tags, instead of
 * every route inheriting the generic root-layout defaults.
 *
 * @param {object} opts
 * @param {string} opts.title - Page-specific title (site name is appended).
 * @param {string} [opts.description] - Falls back to the site description.
 * @param {string} [opts.path] - Route path, e.g. "/plugins", used for canonical/OG url.
 * @param {boolean} [opts.noIndex] - Set true for authenticated/admin-only routes.
 */
export function buildMetadata({ title, description, path = "", noIndex = false }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESCRIPTION;
  // Only build absolute URLs when a site URL is actually configured —
  // otherwise omit them rather than emitting a malformed relative path.
  const url = SITE_URL ? `${SITE_URL}${path || ""}` : undefined;

  return {
    title: fullTitle,
    description: desc,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      title: fullTitle,
      description: desc,
      siteName: SITE_NAME,
      type: "website",
      ...(url ? { url } : {}),
      images: [{ url: OG_IMAGE }],
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description: desc,
      images: [OG_IMAGE],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
