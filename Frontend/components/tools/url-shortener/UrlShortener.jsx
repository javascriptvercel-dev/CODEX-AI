"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Clipboard,
  ExternalLink,
  Link2,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function UrlShortener() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    api
      .shortLinks()
      .then(({ links: data }) => {
        if (active) setLinks(data);
      })
      .catch((err) => {
        if (active) setError(err?.message || "Could not load your links.");
      })
      .finally(() => {
        if (active) setLoadedUserId(user.id);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const copyShortUrl = useCallback(async (link) => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedId(link.id);
      setMessage("Short link copied.");
      setError("");
    } catch {
      setError("Could not copy automatically. Select and copy the link instead.");
    }
  }, []);

  async function createLink(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const { link } = await api.createShortLink(url);
      setLinks((current) => [link, ...current].slice(0, maxLinks));
      setUrl("");
      setMessage("Your short link is ready.");
    } catch (err) {
      setError(err?.message || "Could not create the short link.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteLink(link) {
    if (!window.confirm("Delete this short link? Anyone using it will lose access.")) {
      return;
    }
    setDeletingId(link.id);
    setError("");
    setMessage("");
    try {
      await api.deleteShortLink(link.id);
      setLinks((current) => current.filter((item) => item.id !== link.id));
      setMessage("Short link deleted.");
    } catch (err) {
      setError(err?.message || "Could not delete the short link.");
    } finally {
      setDeletingId(null);
    }
  }

  const visibleLinks = loadedUserId === user.id ? links : [];
  const loadingLinks = loadedUserId !== user.id;
  const maxLinks = user.isPremium ? 500 : 100;

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="flex items-start gap-4 border-b border-edge p-5 sm:p-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          <Link2 size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">Create a short link</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Turn a long web address into a compact link you can share. Links are
            private to your account and can be deleted any time.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <form onSubmit={createLink} className="space-y-3">
          <label htmlFor="long-url" className="text-sm font-semibold text-fg">
            Destination URL
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="long-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              maxLength={2048}
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/your/long/link"
              className="focus-ring min-h-11 min-w-0 flex-1 rounded-lg border border-edge bg-surface2 px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-muted/70"
            />
            <Button type="submit" disabled={creating}>
              {creating ? (
                <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus size={16} aria-hidden="true" />
              )}
              {creating ? "Creating…" : "Shorten URL"}
            </Button>
          </div>
          <p className="text-xs leading-5 text-muted">
            HTTP and HTTPS links only.
            {user.role !== "admin" &&
              ` Limit: ${user.isPremium ? "50" : "10"} new links per hour and ${maxLinks} active links per account.`}
          </p>
        </form>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-azure-400">
            {message}
          </p>
        )}

        <section aria-labelledby="your-short-links">
          <div className="flex items-center justify-between gap-3 border-b border-edge pb-3">
            <h3 id="your-short-links" className="font-display font-bold">
              Your links
            </h3>
            {user.role !== "admin" && (
              <span className="text-xs text-muted">{visibleLinks.length} / {maxLinks}</span>
            )}
          </div>

          {loadingLinks ? (
            <div className="grid gap-3 pt-4">
              <div className="h-20 animate-pulse rounded-lg bg-surface2" />
              <div className="h-20 animate-pulse rounded-lg bg-surface2" />
            </div>
          ) : visibleLinks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-edge bg-surface2/50 px-5 py-10 text-center">
              <Link2 size={19} className="mx-auto text-azure-500" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">No short links yet</p>
              <p className="mt-1 text-sm text-muted">
                Create your first link above and it will show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-edge">
              {visibleLinks.map((link) => (
                <li
                  key={link.id}
                  className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <a
                      href={link.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex max-w-full items-center gap-1.5 break-all text-sm font-semibold text-azure-400 hover:text-azure-300"
                    >
                      {link.shortUrl}
                      <ExternalLink size={13} className="flex-none" aria-hidden="true" />
                    </a>
                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-xs text-muted hover:text-fg"
                      title={link.targetUrl}
                    >
                      {link.targetUrl}
                    </a>
                    <p className="mt-1 text-xs text-muted">
                      {link.clickCount} {link.clickCount === 1 ? "click" : "clicks"} ·{" "}
                      {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => copyShortUrl(link)}
                      aria-label={`Copy ${link.shortUrl}`}
                    >
                      {copiedId === link.id ? (
                        <Check size={14} aria-hidden="true" />
                      ) : (
                        <Clipboard size={14} aria-hidden="true" />
                      )}
                      {copiedId === link.id ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLink(link)}
                      disabled={deletingId === link.id}
                      aria-label={`Delete ${link.shortUrl}`}
                      className="text-red-400 hover:text-red-300"
                    >
                      {deletingId === link.id ? (
                        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 size={14} aria-hidden="true" />
                      )}
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
