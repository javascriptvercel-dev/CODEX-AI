const SITE_NAME = "CODEX AI WA BOT";
const DEFAULT_DESCRIPTION =
  "A multifunctional WhatsApp bot built with baileys.";
// Fall back to the production domain so canonical/OG tags are always absolute,
// even when NEXT_PUBLIC_SITE_URL is missing in a build environment.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://codex-ai.site"
).replace(/\/+$/, "");
const OG_IMAGE = `${SITE_URL}/codex-robot.png`;

/**
 * Build a Next.js `metadata` object with a page-specific title,
 * description, canonical URL, and matching Open Graph / Twitter tags,
 * instead of every route inheriting the generic root-layout defaults.
 *
 * @param {object} opts
 * @param {string} opts.title - Page-specific title (site name is appended).
 * @param {string} [opts.description] - Falls back to the site description.
 * @param {string} [opts.path] - Route path, e.g. "/plugins", used for canonical/OG url.
 * @param {string[]} [opts.keywords] - Extra page keywords.
 * @param {boolean} [opts.noIndex] - Set true for authenticated/admin-only routes.
 */
export function buildMetadata({
  title,
  description,
  path = "",
  keywords,
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path || ""}`;

  return {
    title: fullTitle,
    description: desc,
    ...(keywords?.length ? { keywords } : {}),
    // Pages without a stable public path (e.g. admin areas) get no canonical.
    ...(path ? { alternates: { canonical: url } } : {}),
    openGraph: {
      title: fullTitle,
      description: desc,
      siteName: SITE_NAME,
      type: "website",
      ...(path ? { url } : {}),
      images: [
        { url: OG_IMAGE, width: 1024, height: 1024, alt: `${SITE_NAME} robot mark` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [OG_IMAGE],
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
