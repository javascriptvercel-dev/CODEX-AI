"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareText, PackagePlus, Settings, ShieldCheck } from "lucide-react";
import ConsoleNavbar from "@/components/layout/ConsoleNavbar";
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
const TABS = ["submissions", "suggestions", "create"];
function ConsolePageInner() {
  const { user, isAdmin, loading: authLoading, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view") || searchParams.get("tab");
  const initialTab = TABS.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "submissions";
  const [tab, setTab] = useState(initialTab);
  const showSettings = requestedView === "settings";
  const [statusFilter, setStatusFilter] = useState("pending");
  const [submissions, setSubmissions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (TABS.includes(t)) setTab(t);
  }, [searchParams]);
  useEffect(() => {
    if (!authLoading && user && !isAdmin) router.replace("/");
  }, [authLoading, user, isAdmin, router]);
  useEffect(() => {
    if (!authLoading) setShowEmailPrompt(shouldShowEmailPrompt(user));
  }, [authLoading, user]);
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { submissions: data } = await api.adminSubmissions(statusFilter);
      setSubmissions(data);
    } catch (error) {
      setSubmissions([]);
      if (error.message === "Sign in to continue.") {
        await refresh();
      }
    } finally {
      setLoading(false);
    }
  };
  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { suggestions: data } = await api.adminSuggestions();
      setSuggestions(data);
    } catch (error) {
      setSuggestions([]);
      if (error.message === "Sign in to continue.") {
        await refresh();
      }
    } finally {
      setLoading(false);
    }
  };
  const handlePluginSubmitted = () => {
    setStatusFilter("pending");
    setTab("submissions");
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
    } catch (error) {
      if (error.message === "Sign in to continue.") await refresh();
    }
  };
  const handleReject = async (id, note) => {
    try {
      await api.rejectSubmission(id, note);
      await loadSubmissions();
    } catch (error) {
      if (error.message === "Sign in to continue.") await refresh();
    }
  };
  if (authLoading) return <div className="min-h-screen bg-bg" />;
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
  if (!isAdmin) return <div className="min-h-screen bg-bg" />;
  const submissionCount = submissions.length;
  const suggestionCount = suggestions.length;
  return (
    <div className="min-h-screen bg-bg text-fg">

      <ConsoleNavbar />
      <main className="flex-1">

        <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

          <div className="mb-6 overflow-hidden rounded-3xl border border-edge bg-surface shadow-glow">
            <div className="h-1 w-full bg-gradient-to-r from-azure-500 via-azure-300 to-azure-500" />

            <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:p-7">

              <div className="max-w-2xl">

                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-azure-500">

                  <ShieldCheck size={14} /> Control center
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  ADMINISTRATIVE WORKSPACE
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">

                  Review submissions, triage community feedback, and manage
                  workspace preferences from one place.
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-2 gap-2 lg:w-auto">

                <div className="rounded-2xl border border-edge bg-surface2 px-4 py-3">

                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Current submissions
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {submissionCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-edge bg-surface2 px-4 py-3">

                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Feedback
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {suggestionCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {!showSettings && (
            <div className="rounded-2xl border border-edge bg-surface p-1.5 shadow-sm">

              <div className="flex flex-wrap gap-1.5">

                <button
                  type="button"
                  onClick={() => setTab("submissions")}
                  className={`focus-ring flex flex-shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95 sm:px-4 ${tab === "submissions" ? "bg-azure-500 text-white" : "bg-surface2 text-muted hover:text-fg"}`}
                >

                  <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">

                    <ShieldCheck size={14} /> Plugin submissions
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("suggestions")}
                  className={`focus-ring flex flex-shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95 sm:px-4 ${tab === "suggestions" ? "bg-azure-500 text-white" : "bg-surface2 text-muted hover:text-fg"}`}
                >

                  <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">

                    <MessageSquareText size={14} /> Suggestions
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("create")}
                  className={`focus-ring flex flex-shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold transition active:scale-95 sm:px-4 ${tab === "create" ? "bg-azure-500 text-white" : "bg-surface2 text-muted hover:text-fg"}`}
                >
                  <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <PackagePlus size={14} /> Create plugin
                  </span>
                </button>
              </div>
            </div>
          )}
          {showSettings ? (
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-azure-500">
                <Settings size={14} /> Preferences
              </div>
              <SettingsTab />
            </div>
          ) : (
            <>
              {tab === "submissions" && (
                <div className="mt-4 flex flex-wrap gap-2 pb-1">

                  {["pending", "approved", "rejected"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`focus-ring flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition active:scale-95 ${statusFilter === s ? "bg-azure-500 text-white" : "bg-surface2 text-muted hover:text-fg"}`}
                    >

                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="mt-6">

            {tab === "create" ? (
              <PluginSubmitForm
                onSubmitted={handlePluginSubmitted}
                onBack={() => setTab("submissions")}
                submitLabel="Submit"
              />
            ) : loading ? (
              <div className="grid gap-3">

                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl border border-edge bg-surface2"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            ) : tab === "submissions" ? (
              submissions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-edge bg-surface p-10 text-center sm:p-16">

                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-azure-500/10 text-azure-500">

                    <ShieldCheck size={19} />
                  </div>
                  <p className="mt-4 font-semibold">
                    No submissions in this view
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                    Try another status filter or return later when new items are
                    ready for review.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">

                  {submissions.map((submission, i) => (
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
                  ))}
                </div>
              )
            ) : suggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-edge bg-surface p-10 text-center sm:p-16">

                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-azure-500/10 text-azure-500">

                  <MessageSquareText size={19} />
                </div>
                <p className="mt-4 font-semibold">No feedback yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                  Community feedback will appear here as it is submitted.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">

                {suggestions.map((suggestion, i) => (
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
        </section>
      </main>
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
