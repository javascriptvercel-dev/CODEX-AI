const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://codex-ai.site").replace(/\/+$/, "");

const PUBLIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/plugins", priority: 0.9, changeFrequency: "daily" },
  { path: "/support", priority: 0.7, changeFrequency: "monthly" },
  { path: "/repository", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap() {
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
