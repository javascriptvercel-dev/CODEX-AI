"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellRing,
  BookOpenCheck,
  Mail,
  MessageSquareText,
  PackagePlus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import ConsoleNavbar from "@/components/layout/ConsoleNavbar";
import Footer from "@/components/layout/Footer";
import SubmissionCard from "@/components/admin/SubmissionCard";
import SuggestionCard from "@/components/admin/SuggestionCard";
import AssistantFaqDraftCard from "@/components/admin/AssistantFaqDraftCard";
import UserCount from "@/components/home/UserCount";
import SettingsTab from "@/components/admin/SettingsTab";
import StateBlock from "@/components/ui/StateBlock";
import AdminEmailOptInModal, {
  shouldShowEmailPrompt,
} from "@/components/admin/AdminEmailOptInModal";
import PluginSubmitForm from "@/components/plugins/PluginSubmitForm";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { robot } from "@/lib/robot";

const CONSOLE_GREETINGS = [
  "Welcome back, {name}! Let's see what's waiting for review.",
  "Good to see you, {name}. I'll keep an eye on things too.",
  "Hey {name}! Ready when you are.",
  "{name}, the console is all yours.",
];

const TABS = [
  { id: "submissions", label: "Submissions", icon: ShieldCheck },
  { id: "suggestions", label: "Feedback", icon: MessageSquareText },
  { id: "faqDrafts", label: "FAQ drafts", icon: BookOpenCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "create", label: "Create plugin", icon: PackagePlus },
  { id: "settings", label: "Settings", icon: Settings },
];
const TAB_IDS = TABS.map((t) => t.id);
const STATUSES = ["pending", "approved", "rejected"];

function AdminUserEditor({ user, premiumEnabled, busy, onSave, onDelete, onBack }) {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email);
  const [isPremium, setIsPremium] = useState(user.isPremium);
  const [premiumDate, setPremiumDate] = useState(user.premiumUntil?.slice(0, 10) || "");

  function updatePremiumStatus(value) {
    setIsPremium(value);
    if (value && (!premiumDate || Date.parse(`${premiumDate}T23:59:59.999Z`) <= Date.now())) {
      const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setPremiumDate(defaultExpiry.toISOString().slice(0, 10));
    }
  }

  async function save(event) {
    event.preventDefault();
    const changes = { fullName, email };
    if (premiumEnabled) {
      changes.isPremium = isPremium;
      changes.premiumUntil = isPremium
        ? new Date(`${premiumDate}T23:59:59.999Z`).toISOString()
        : null;
    }
    await onSave(user.id, changes);
  }

  return (
    <section className="rounded-xl border border-edge bg-surface p-4 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="focus-ring mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-azure-500 hover:underline"
      >
        ← Back to search results
      </button>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div>
          <h3 className="font-display text-lg font-bold">Edit user</h3>
          <p className="mt-1 text-xs text-muted">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
          user.role === "admin" ? "bg-violet-500/10 text-violet-400" : "bg-surface2 text-muted"
        }`}>
          {user.role}
        </span>
      </div>

      <form onSubmit={save} className="grid gap-4 sm:max-w-xl">
        <label className="text-sm font-medium">
          <span className="mb-1.5 block text-muted">Name</span>
          <input
            required
            maxLength={100}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 px-3 text-sm text-fg"
          />
        </label>
        <label className="text-sm font-medium">
          <span className="mb-1.5 block text-muted">Email</span>
          <input
            required
            type="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 px-3 text-sm text-fg"
          />
        </label>
        {user.role === "admin" ? (
          <div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-4 text-sm">
            <p className="font-semibold text-amber-400">Premium — no expiration</p>
            <p className="mt-1 text-xs text-muted">Administrator accounts have permanent Premium status.</p>
          </div>
        ) : premiumEnabled && (
          <div className="grid gap-4 rounded-lg border border-edge bg-surface2/40 p-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              <span className="mb-1.5 block text-muted">Account status</span>
              <select
                value={isPremium ? "premium" : "free"}
                onChange={(event) => updatePremiumStatus(event.target.value === "premium")}
                className="focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 px-3 text-sm text-fg"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            {isPremium && (
              <label className="text-sm font-medium">
                <span className="mb-1.5 block text-muted">Premium through</span>
                <input
                  required
                  type="date"
                  value={premiumDate}
                  onChange={(event) => setPremiumDate(event.target.value)}
                  className="focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 px-3 text-sm text-fg"
                />
              </label>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="focus-ring h-10 rounded-lg border border-azure-500 bg-azure-500 px-4 text-sm font-semibold text-white hover:bg-azure-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            disabled={busy || user.role === "admin"}
            title={user.role === "admin" ? "Administrator accounts cannot be deleted here." : "Delete account"}
            onClick={() => onDelete(user)}
            className="focus-ring inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-500/30 px-4 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            Delete account
          </button>
        </div>
      </form>
    </section>
  );
}

function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    let active = true;
    api.adminUsers({ page, q: search.trim() })
      .then((result) => {
        if (!active) return;
        setUsers(result.users);
        setTotal(result.total);
        setPageSize(result.pageSize);
        setPremiumEnabled(result.premiumEnabled);
      })
      .catch((requestError) => {
        if (!active) return;
        setUsers([]);
        setError(requestError.message || "Could not load users.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, reloadKey, search]);

  function reloadUsers() {
    setLoading(true);
    setError("");
    setReloadKey((current) => current + 1);
  }

  async function saveUser(userId, changes) {
    setBusyId(userId);
    setError("");
    setNotice("");
    try {
      const result = await api.updateAdminUser(userId, changes);
      const updatedUser = {
        ...selectedUser,
        ...result,
        fullName: result.fullName,
        email: result.email,
        premiumUntil: result.premiumUntil || null,
        isPremium: result.isPremium,
      };
      setSelectedUser(updatedUser);
      setUsers((current) => current.map((account) =>
        account.id === userId ? { ...account, ...updatedUser } : account,
      ));
      setReloadKey((current) => current + 1);
      setNotice("User updated.");
    } catch (requestError) {
      setError(requestError.message || "Could not update this user.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteAccount(target) {
    if (!window.confirm(`Permanently delete ${target.email} and their account data? This cannot be undone.`)) return;
    setBusyId(target.id);
    setError("");
    setNotice("");
    try {
      const result = await api.deleteAdminUser(target.id);
      if (result.cleanupWarning) setNotice(result.cleanupWarning);
      else setNotice(`Deleted ${target.email}.`);
      setSelectedUser(null);
      if (users.length === 1 && page > 1) {
        setLoading(true);
        setPage((current) => current - 1);
      }
      else {
        setUsers((current) => current.filter((user) => user.id !== target.id));
        setTotal((current) => Math.max(0, current - 1));
      }
    } catch (requestError) {
      setError(requestError.message || "Could not delete this account.");
    } finally {
      setBusyId("");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="rounded-xl border border-edge bg-surface p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-lg font-bold">Users</h2>
          <p className="mt-1 text-xs text-muted">All accounts are listed below. Search by name or email to narrow the list.</p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search users by name or email</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            maxLength={100}
            placeholder="Search name or email"
            onChange={(event) => {
              setLoading(true);
              setError("");
              setNotice("");
              setSelectedUser(null);
              setSearch(event.target.value);
              setPage(1);
            }}
            className="focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 pl-9 pr-3 text-sm text-fg outline-none"
          />
        </label>
      </div>

      {!premiumEnabled && (
        <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/5 p-3 text-xs text-amber-400">
          Premium editing and account integrations are disabled. In Supabase, run migration 012 first if it has not
          been applied, then run <code className="font-mono">migration_013_premium_dashboard.sql</code>. In Render,
          set <code className="font-mono">PREMIUM_FEATURES_ENABLED=true</code> and restart the backend. User listing,
          profile editing, and account deletion remain available without Premium.
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-500">{notice}</p>}

      {selectedUser ? (
        <div className="mt-5">
          <AdminUserEditor
            key={`${selectedUser.id}-${selectedUser.email}-${selectedUser.fullName}-${selectedUser.premiumUntil}`}
            user={selectedUser}
            premiumEnabled={premiumEnabled}
            busy={busyId === selectedUser.id}
            onSave={saveUser}
            onDelete={deleteAccount}
            onBack={() => {
              setSelectedUser(null);
              setError("");
              setNotice("");
            }}
          />
        </div>
      ) : loading ? (
        <div className="grid min-h-36 place-items-center text-sm text-muted">
          <span className="inline-flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Loading users…</span>
        </div>
      ) : error && !users.length ? (
        <div className="flex items-center justify-between gap-3 py-6 text-sm text-muted">
          <span>Try changing your search or reload the user list.</span>
          <button type="button" onClick={reloadUsers} className="focus-ring rounded-md border border-edge px-3 py-1.5 text-xs font-semibold text-fg">Retry</button>
        </div>
      ) : users.length ? (
        <ul className="mt-2">
          {users.map((account) => (
            <li key={account.id} className="border-b border-edge last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(account);
                  setError("");
                  setNotice("");
                }}
                className="focus-ring flex w-full items-center justify-between gap-3 py-4 text-left hover:bg-surface2/40"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-fg">{account.fullName || "Unnamed account"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      account.role === "admin" ? "bg-violet-500/10 text-violet-400" : "bg-surface2 text-muted"
                    }`}>{account.role}</span>
                    {(premiumEnabled || account.role === "admin") && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        account.role === "admin" || account.isPremium ? "bg-amber-400/10 text-amber-400" : "bg-surface2 text-muted"
                      }`}>{account.role === "admin" || account.isPremium ? "Premium" : "Free"}</span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">{account.email}</span>
                </span>
                <span className="flex-none text-xs font-semibold text-azure-500">Edit user →</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-10 text-center text-sm text-muted">
          {search.trim() ? "No users match this search." : "No user accounts found."}
        </div>
      )}

      {!selectedUser && !loading && !error && (
        <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
          <p className="text-xs text-muted">
            {total
              ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} ${search.trim() ? "matching " : ""}users`
              : "0 users"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
              disabled={page <= 1 || loading}
              className="focus-ring rounded-md border border-edge px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-muted">{page} / {totalPages}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.min(totalPages, current + 1));
              }}
              disabled={page >= totalPages || loading}
              className="focus-ring rounded-md border border-edge px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

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
      router.replace("/login?next=%2Fconsole&cancel=%2Fplugins");
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
            This area is limited to administrators. Taking you back home…
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
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <ConsoleNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Console
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted [overflow-wrap:anywhere]">
              Welcome back,{" "}
              <span className="font-semibold text-fg">
                {user?.fullName || user?.email}
              </span>
              <VerifiedBadge size={14} />
            </p>
          </div>
          <p className="max-w-xs text-sm text-muted sm:max-w-sm sm:text-right">
            Review submissions, triage feedback, and manage this workspace.
          </p>
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

        <div className="mt-4">
          {tab === "users" ? (
            <AdminUsersPanel />
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
              title="Couldn’t load this list"
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
      </main>

      <Footer />

      {showEmailPrompt && (
        <AdminEmailOptInModal
          onClose={() => {
            setEmailPromptDismissed(true);
            setEmailPromptOpen(false);
          }}
        />
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
