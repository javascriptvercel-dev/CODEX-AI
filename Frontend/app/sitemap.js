const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://codex-ai.site"
).replace(/\/+$/, "");

// Public, indexable routes only. Authenticated areas (console, create,
// session, deploy, reset-password) are excluded on purpose.
const ROUTES = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/plugins", changeFrequency: "daily", priority: 0.9 },
  { path: "/repository", changeFrequency: "weekly", priority: 0.8 },
  { path: "/support", changeFrequency: "monthly", priority: 0.7 },
  { path: "/suggest", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools", changeFrequency: "monthly", priority: 0.5 },
  { path: "/apis", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap() {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
