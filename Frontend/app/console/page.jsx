"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  MessageSquareText,
  PackagePlus,
  RefreshCw,
  Settings,
  ShieldCheck,
} from "lucide-react";
import ConsoleNavbar from "@/components/layout/ConsoleNavbar";
import Footer from "@/components/layout/Footer";
import SubmissionCard from "@/components/admin/SubmissionCard";
import SuggestionCard from "@/components/admin/SuggestionCard";
import SettingsTab from "@/components/admin/SettingsTab";
import AdminEmailOptInModal, {
  shouldShowEmailPrompt,
} from "@/components/admin/AdminEmailOptInModal";
import PluginSubmitForm from "@/components/plugins/PluginSubmitForm";
import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const TABS = [
  { id: "submissions", label: "Submissions", icon: ShieldCheck },
  { id: "suggestions", label: "Feedback", icon: MessageSquareText },
  { id: "create", label: "Create plugin", icon: PackagePlus },
  { id: "settings", label: "Settings", icon: Settings },
];
const TAB_IDS = TABS.map((t) => t.id);
const STATUSES = ["pending", "approved", "rejected"];

function ConsolePageInner() {
  const { user, isAdmin, loading: authLoading, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlTab = searchParams.get("tab");
  const legacyView = searchParams.get("view");
  const initialTab = TAB_IDS.includes(urlTab)
    ? urlTab
    : legacyView === "settings"
      ? "settings"
      : "submissions";

  const [tab, setTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [submissions, setSubmissions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    const v = searchParams.get("view");
    if (TAB_IDS.includes(t)) setTab(t);
    else if (v === "settings") setTab("settings");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!authLoading) setShowEmailPrompt(shouldShowEmailPrompt(user));
  }, [authLoading, user]);

  const selectTab = (id) => {
    setTab(id);
    router.replace(id === "submissions" ? "/console" : `/console?tab=${id}`, {
      scroll: false,
    });
  };

  const onTabKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % TABS.length
        : (index - 1 + TABS.length) % TABS.length;
    selectTab(TABS[next].id);
    document.getElementById(`console-tab-${TABS[next].id}`)?.focus();
  };

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { submissions: data } = await api.adminSubmissions(statusFilter);
      setSubmissions(data);
    } catch (err) {
      setSubmissions([]);
      setError(err?.message || "Something went wrong loading submissions.");
      if (err?.message === "Sign in to continue.") await refresh();
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { suggestions: data } = await api.adminSuggestions();
      setSuggestions(data);
    } catch (err) {
      setSuggestions([]);
      setError(err?.message || "Something went wrong loading feedback.");
      if (err?.message === "Sign in to continue.") await refresh();
    } finally {
      setLoading(false);
    }
  };

  const reload = () =>
    tab === "suggestions" ? loadSuggestions() : loadSubmissions();

  const handlePluginSubmitted = () => {
    setStatusFilter("pending");
    selectTab("submissions");
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "submissions") loadSubmissions();
    else if (tab === "suggestions") loadSuggestions();
  }, [tab, statusFilter, isAdmin]);

  const handleApprove = async (id) => {
    try {
      await api.approveSubmission(id);
      await loadSubmissions();
    } catch (err) {
      if (err?.message === "Sign in to continue.") await refresh();
      else setError(err?.message || "Could not approve this submission.");
    }
  };

  const handleReject = async (id, note) => {
    try {
      await api.rejectSubmission(id, note);
      await loadSubmissions();
    } catch (err) {
      if (err?.message === "Sign in to continue.") await refresh();
      else setError(err?.message || "Could not reject this submission.");
    }
  };

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <div className="flex items-center gap-2 text-sm text-muted">
          <RefreshCw size={15} className="animate-spin" /> Checking your access…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg">
        <AuthModal
          message="Sign in to enter the admin console."
          onClose={() => router.push("/")}
          onSuccess={refresh}
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-4 text-center">
        <div className="max-w-sm">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-edge bg-surface2 text-muted">
            <ShieldCheck size={18} />
          </div>
          <p className="mt-4 font-semibold text-fg">Console access required</p>
          <p className="mt-1 text-sm text-muted">
            This area is limited to administrators. Taking you back home…
          </p>
        </div>
      </div>
    );
  }

  const activeList = tab === "suggestions" ? suggestions : submissions;
  const isListTab = tab === "submissions" || tab === "suggestions";

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <ConsoleNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Console
          </h1>
          <p className="text-sm text-muted">
            Review submissions, triage feedback, and manage this workspace.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Console sections"
          className="mt-5 flex flex-wrap items-center gap-1 border-b border-edge"
        >
          {TABS.map(({ id, label, icon: Icon }, index) => {
            const active = tab === id;
            return (
              <button
                key={id}
                id={`console-tab-${id}`}
                role="tab"
                type="button"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                onClick={() => selectTab(id)}
                className={`focus-ring -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-azure-500 text-fg"
                    : "border-transparent text-muted hover:text-fg"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>

        {isListTab && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {loading
                ? "Loading…"
                : `${activeList.length} ${
                    tab === "suggestions"
                      ? activeList.length === 1
                        ? "item"
                        : "items"
                      : statusFilter
                  }`}
            </p>
            {tab === "submissions" && (
              <div className="inline-flex overflow-hidden rounded border border-edge">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    aria-pressed={statusFilter === s}
                    className={`focus-ring border-l border-edge px-3 py-1.5 text-xs font-semibold capitalize transition first:border-l-0 ${
                      statusFilter === s
                        ? "bg-azure-500 text-white"
                        : "bg-surface2 text-muted hover:text-fg"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          {tab === "settings" ? (
            <SettingsTab />
          ) : tab === "create" ? (
            <PluginSubmitForm
              onSubmitted={handlePluginSubmitted}
              onBack={() => selectTab("submissions")}
              submitLabel="Submit"
              headingLevel="h2"
            />
          ) : loading ? (
            <div className="grid gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded border border-edge bg-surface2"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded border border-red-400/40 bg-red-500/5 p-8 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded bg-red-500/10 text-red-400">
                <AlertTriangle size={19} />
              </div>
              <p className="mt-4 font-semibold">Couldn’t load this list</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">{error}</p>
              <button
                type="button"
                onClick={reload}
                className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded border border-edge bg-surface2 px-3 py-2 text-sm font-semibold transition hover:border-azure-500/60 active:scale-95"
              >
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          ) : activeList.length === 0 ? (
            <div className="rounded border border-dashed border-edge bg-surface p-10 text-center sm:p-14">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded bg-azure-500/10 text-azure-500">
                {tab === "submissions" ? (
                  <ShieldCheck size={19} />
                ) : (
                  <MessageSquareText size={19} />
                )}
              </div>
              <p className="mt-4 font-semibold">
                {tab === "submissions"
                  ? "No submissions in this view"
                  : "No feedback yet"}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {tab === "submissions"
                  ? "Try another status filter or return later when new items are ready for review."
                  : "Community feedback will appear here as it is submitted."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {tab === "submissions"
                ? submissions.map((submission, i) => (
                    <div
                      key={submission.id}
                      className="animate-rise"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <SubmissionCard
                        submission={submission}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onSaved={loadSubmissions}
                      />
                    </div>
                  ))
                : suggestions.map((suggestion, i) => (
                    <div
                      key={suggestion.id}
                      className="animate-rise"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <SuggestionCard suggestion={suggestion} />
                    </div>
                  ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showEmailPrompt && (
        <AdminEmailOptInModal onClose={() => setShowEmailPrompt(false)} />
      )}
    </div>
  );
}

export default function ConsolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <ConsolePageInner />
    </Suspense>
  );
}
