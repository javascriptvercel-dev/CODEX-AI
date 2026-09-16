const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://codex-ai.site").replace(/\/+$/, "");

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/console/",
        "/create/",
        "/deploy/",
        "/reset-password/",
        "/session/",
        "/suggest/",
        "/apis/",
        "/tools/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
