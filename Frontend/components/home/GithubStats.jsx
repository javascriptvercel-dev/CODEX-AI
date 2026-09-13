"use client";

import { useEffect, useState } from "react";
import { GitFork, Star } from "lucide-react";

const REPO_API_URL = "https://api.github.com/repos/codexverified/CODEX-AI";
const REPO_URL = "https://github.com/codexverified/CODEX-AI";

const formatCount = (value) =>
  typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : "--";

export default function GithubStats() {
  const [stats, setStats] = useState({ stars: null, forks: null });

  useEffect(() => {
    let active = true;

    fetch(REPO_API_URL, { headers: { Accept: "application/vnd.github+json" } })
      .then((response) => {
        if (!response.ok) throw new Error("GitHub stats unavailable");
        return response.json();
      })
      .then((repository) => {
        if (active) {
          setStats({ stars: repository.stargazers_count, forks: repository.forks_count });
        }
      })
      .catch(() => {
        if (active) setStats({ stars: null, forks: null });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mb-4 flex justify-center lg:justify-end">
      <div className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface/80 p-1 shadow-sm">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface2 hover:text-fg"
          aria-label={`${formatCount(stats.stars)} GitHub stars`}
        >
          <span>{formatCount(stats.stars)}</span>
          <Star size={14} className="text-yellow-400" />
          <span>Stars</span>
        </a>
        <a
          href={`${REPO_URL}/fork`}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface2 hover:text-fg"
          aria-label={`${formatCount(stats.forks)} GitHub forks`}
        >
          <span>{formatCount(stats.forks)}</span>
          <GitFork size={14} className="text-azure-400" />
          <span>Forks</span>
        </a>
      </div>
    </div>
  );
}
