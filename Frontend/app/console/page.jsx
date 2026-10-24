"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellRing,
  BookOpenCheck,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  PackagePlus,
  RefreshCw,
  Settings,
  Crown,
  ShieldCheck,
  Users,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SubmissionCard from "@/components/admin/SubmissionCard";
import SuggestionCard from "@/components/admin/SuggestionCard";
import AssistantFaqDraftCard from "@/components/admin/AssistantFaqDraftCard";
import UserCount from "@/components/home/UserCount";
import SettingsTab from "@/components/admin/SettingsTab";
import StateBlock from "@/components/ui/StateBlock";
import AdminEmailOptInModal, {
  shouldShowEmailPrompt,
} from "@/components/admin/AdminEmailOptInModal";
import AdminOverview from "@/components/admin/AdminOverview";
import UsersPanel from "@/components/admin/UsersPanel";
import PremiumPanel from "@/components/admin/PremiumPanel";
import PluginSubmitForm from "@/components/plugins/PluginSubmitForm";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import Avatar from "@/components/layout/Avatar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { robot } from "@/lib/robot";

const CONSOLE_GREETINGS = [
  "Welcome back, {name}. Here are the latest items for review.",
  "Welcome back, {name}. Your console is ready.",
  "{name}, your administrator console is ready.",
  "Welcome back, {name}.",
];

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "submissions", label: "Submissions", icon: ShieldCheck },
  { id: "suggestions", label: "Feedback", icon: MessageSquareText },
  { id: "faqDrafts", label: "FAQ drafts", icon: BookOpenCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "premium", label: "Premium", icon: Crown },
  { id: "create", label: "Create plugin", icon: PackagePlus, dividerBefore: true },
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
      : "overview";

  const tab = initialTab;
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewerFilter, setReviewerFilter] = useState("all");
  const [submissions, setSubmissions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [faqDrafts, setFaqDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailPromptDismissed, setEmailPromptDismissed] = useState(false);
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);
  const greetedRef = useRef(false);
  const showEmailPrompt =
    emailPromptOpen ||
    (!authLoading && !emailPromptDismissed && shouldShowEmailPrompt(user));

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=%2Fconsole&cancel=%2F");
    } else if (!authLoading && user && !isAdmin) {
      router.replace("/");
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (greetedRef.current || authLoading || !user || !isAdmin) return;
    greetedRef.current = true;
    const firstName = (user.fullName || user.email || "").trim().split(/\s+/)[0] || "boss";
    const template =
      CONSOLE_GREETINGS[Math.floor(Math.random() * CONSOLE_GREETINGS.length)];
    robot.say(template.replace("{name}", firstName));
    robot.mood("happy");
  }, [authLoading, user, isAdmin]);

  const selectTab = (id) => {
    if (["submissions", "suggestions", "faqDrafts"].includes(id)) {
      setLoading(true);
      setError(null);
    }
    router.replace(`/console?tab=${id}`, {
      scroll: false,
    });
  };

  const loadSubmissions = useCallback(async () => {
    try {
      const { submissions: data } = await api.adminSubmissions(
        statusFilter,
        statusFilter === "pending" ? "all" : reviewerFilter,
      );
      setSubmissions(data);
    } catch (err) {
      setSubmissions([]);
      setError(err?.message || "Something went wrong loading submissions.");
      if (err?.message === "Sign in to continue.") await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh, reviewerFilter, statusFilter]);

  const loadSuggestions = useCallback(async () => {
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
  }, [refresh]);

  const loadFaqDrafts = useCallback(async () => {
    try {
      const { faqs: data } = await api.adminAssistantFaqDrafts();
      setFaqDrafts(data);
    } catch (err) {
      setFaqDrafts([]);
      setError(err?.message || "Something went wrong loading FAQ drafts.");
      if (err?.message === "Sign in to continue.") await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const reload = () => {
    setLoading(true);
    setError(null);
    if (tab === "suggestions") return loadSuggestions();
    if (tab === "faqDrafts") return loadFaqDrafts();
    return loadSubmissions();
  };

  const handlePluginSubmitted = () => {
    setLoading(true);
    setError(null);
    setStatusFilter("pending");
    selectTab("submissions");
  };

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const request =
      tab === "submissions"
        ? api.adminSubmissions(
            statusFilter,
            statusFilter === "pending" ? "all" : reviewerFilter,
          ).then(({ submissions: data }) => ({
            type: "submissions",
            data,
          }))
        : tab === "suggestions"
          ? api.adminSuggestions().then(({ suggestions: data }) => ({
              type: "suggestions",
              data,
            }))
          : tab === "faqDrafts"
            ? api.adminAssistantFaqDrafts().then(({ faqs: data }) => ({
                type: "faqDrafts",
                data,
              }))
            : null;

    if (!request) return undefined;

    request
      .then(({ type, data }) => {
        if (!active) return;
        if (type === "submissions") setSubmissions(data);
        else if (type === "suggestions") setSuggestions(data);
        else setFaqDrafts(data);
        setError(null);
      })
      .catch(async (err) => {
        if (!active) return;
        if (tab === "submissions") setSubmissions([]);
        else if (tab === "suggestions") setSuggestions([]);
        else setFaqDrafts([]);
        setError(err?.message || "Something went wrong loading this list.");
        if (err?.message === "Sign in to continue.") await refresh();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, statusFilter, reviewerFilter, isAdmin, refresh]);

  const handleApprove = async (id) => {
    try {
      await api.approveSubmission(id);
      setLoading(true);
      setError(null);
      await loadSubmissions();
    } catch (err) {
      if (err?.message === "Sign in to continue.") await refresh();
      throw err; // surfaced inside the full view so the admin sees why it failed
    }
  };

  const handleReject = async (id, note) => {
    try {
      await api.rejectSubmission(id, note);
      setLoading(true);
      setError(null);
      await loadSubmissions();
    } catch (err) {
      if (err?.message === "Sign in to continue.") await refresh();
      throw err; // surfaced inside the full view so the admin sees why it failed
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
    return <div className="min-h-screen bg-bg" />;
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
            Unauthorized access
          </p>
        </div>
      </div>
    );
  }

  const activeList =
    tab === "suggestions"
      ? suggestions
      : tab === "faqDrafts"
        ? faqDrafts
        : submissions;
  const isListTab = ["submissions", "suggestions", "faqDrafts"].includes(tab);

  return (
    <>
      <DashboardShell
        sections={TABS}
        active={tab}
        onSelect={selectTab}
        title="Admin console"
      >
        {tab === "overview" && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar size={56} showBadge={false} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-azure-500">
                    Administrator account center
                  </p>
                  <h1 className="mt-2 flex flex-wrap items-center gap-2 font-display text-3xl font-bold">
                    Welcome, {user.fullName || user.email}
                    <VerifiedBadge size={18} label="Verified administrator" />
                  </h1>
                  <p className="mt-1 text-sm text-muted">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 max-w-xs">
              <UserCount />
            </div>

            {!user.emailNotificationsEnabled && (
              <section
                aria-labelledby="email-alert-reminder-title"
                className="mt-5 flex flex-col gap-4 rounded-2xl border border-azure-500/25 bg-gradient-to-r from-azure-500/[0.08] via-surface to-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-azure-500/20 bg-azure-500/10 text-azure-500">
                    <BellRing size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="email-alert-reminder-title"
                      className="text-sm font-semibold text-fg"
                    >
                      Email alerts are turned off
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                      Get notified when new plugin submissions and community
                      suggestions arrive. You can change this any time in Settings.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailPromptOpen(true)}
                  className="focus-ring inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-azure-500 bg-azure-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-azure-600 hover:bg-azure-600 active:scale-[0.98] sm:ml-4"
                >
                  <Mail size={15} aria-hidden="true" />
                  Set up alerts
                </button>
              </section>
            )}
          </>
        )}

        {isListTab && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {tab === "submissions" ? (
              <div className="inline-flex items-center gap-3">
                {statusFilter !== "pending" && (
                  <div className="inline-flex overflow-hidden rounded border border-edge">
                    {[
                      { id: "all", label: "All" },
                      { id: "me", label: "By me" },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setLoading(true);
                          setError(null);
                          setReviewerFilter(id);
                        }}
                        aria-pressed={reviewerFilter === id}
                        className={`focus-ring border-l border-edge px-3 py-1.5 text-xs font-semibold transition first:border-l-0 ${
                          reviewerFilter === id
                            ? "bg-azure-500 text-white"
                            : "bg-surface2 text-muted hover:text-fg"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-sm text-muted">
                  {loading ? "Loading…" : `${activeList.length} ${statusFilter}`}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted">
                {loading
                  ? "Loading…"
                  : `${activeList.length} ${
                      tab === "suggestions"
                        ? activeList.length === 1
                          ? "item"
                          : "items"
                        : "drafts"
                    }`}
              </p>
            )}
            {tab === "submissions" && (
              <div className="inline-flex overflow-hidden rounded border border-edge">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      setStatusFilter(status);
                    }}
                    aria-pressed={statusFilter === status}
                    className={`focus-ring border-l border-edge px-3 py-1.5 text-xs font-semibold capitalize transition first:border-l-0 ${
                      statusFilter === status
                        ? "bg-azure-500 text-white"
                        : "bg-surface2 text-muted hover:text-fg"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          {tab === "overview" ? (
            <AdminOverview />
          ) : tab === "users" ? (
            <UsersPanel />
          ) : tab === "premium" ? (
            <PremiumPanel />
          ) : tab === "settings" ? (
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
            <StateBlock
              tone="error"
              appearance="empty"
              icon={ShieldCheck}
              title="Unable to load this list"
              message={error}
              onRetry={reload}
            />
          ) : activeList.length === 0 ? (
            <div className="rounded border border-dashed border-edge bg-surface p-10 text-center sm:p-14">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded bg-azure-500/10 text-azure-500">
                {tab === "submissions" ? (
                  <ShieldCheck size={19} />
                ) : tab === "faqDrafts" ? (
                  <BookOpenCheck size={19} />
                ) : (
                  <MessageSquareText size={19} />
                )}
              </div>
              <p className="mt-4 font-semibold">
                {tab === "submissions"
                  ? "No submissions in this view"
                  : tab === "faqDrafts"
                    ? "No FAQ drafts waiting for review"
                  : "No feedback yet"}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {tab === "submissions"
                  ? "Try another status filter or return later when new items are ready for review."
                  : tab === "faqDrafts"
                    ? "Questions that can help other visitors will appear here after they are summarized."
                  : "Community feedback will appear here as it is submitted."}
              </p>
            </div>
          ) : (
            <div
              className={
                tab === "submissions"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-2.5"
              }
            >
              {tab === "submissions"
                ? activeList.map((submission, i) => (
                    <div
                      key={submission.id}
                      className="h-full animate-rise"
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
                : tab === "faqDrafts"
                  ? faqDrafts.map((faq, i) => (
                      <div
                        key={faq.id}
                        className="animate-rise"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <AssistantFaqDraftCard
                          faq={faq}
                          onReviewed={loadFaqDrafts}
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
      </DashboardShell>

      {showEmailPrompt && (
        <AdminEmailOptInModal
          onClose={() => {
            setEmailPromptDismissed(true);
            setEmailPromptOpen(false);
          }}
        />
      )}
    </>
  );
}

export default function ConsolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <ConsolePageInner />
    </Suspense>
  );
}
