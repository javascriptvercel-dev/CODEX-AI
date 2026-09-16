const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://codex-ai.site"
).replace(/\/+$/, "");

// Private / authenticated areas stay out of search results; everything
// public is crawlable. Sitemap is advertised so Google finds every page.
const DISALLOW = [
  "/api/",
  "/console",
  "/console/",
  "/create",
  "/create/",
  "/session",
  "/session/",
  "/deploy",
  "/deploy/",
  "/reset-password",
];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
