"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, RefreshCw, Search, X } from "lucide-react";
import AdminEditUserModal from "@/components/admin/AdminEditUserModal";
import AdminDeleteUserModal from "@/components/admin/AdminDeleteUserModal";
import { api } from "@/lib/api";

function DeleteToast({ message, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef(null);
  const exitTimer = useRef(null);

  const dismiss = useCallback(() => {
    if (exitTimer.current) return;
    setVisible(false);
    exitTimer.current = window.setTimeout(onDismiss, 250);
  }, [onDismiss]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    const timeout = window.setTimeout(dismiss, 6000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.clearTimeout(exitTimer.current);
    };
  }, [dismiss]);

  return (
    <aside
      role="status"
      aria-live="polite"
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (
          touchStartX.current !== null &&
          Math.abs(event.changedTouches[0].clientX - touchStartX.current) > 48
        ) {
          dismiss();
        }
        touchStartX.current = null;
      }}
      className={`fixed inset-x-3 bottom-3 z-[80] mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-xl border border-emerald-500/30 bg-surface p-3.5 text-sm text-emerald-500 shadow-2xl transition-[opacity,transform] duration-200 ease-out sm:inset-x-auto sm:bottom-5 sm:right-5 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-emerald-500/10">
        <Check size={18} aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 break-words">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss deletion notification"
        className="focus-ring grid h-8 w-8 flex-none place-items-center rounded-md text-muted transition hover:bg-surface2 hover:text-fg"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteToast, setDeleteToast] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const debounceRef = useRef(null);
  const dismissDeleteToast = useCallback(() => setDeleteToast(""), []);

  // Debounced search: one request after the admin stops typing.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch !== search || page !== 1) {
        setLoading(true);
        setSearch(nextSearch);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, searchInput, page]);

  const load = useCallback(
    async (targetPage = page, targetSearch = search) => {
      try {
        const result = await api.adminUsers({ page: targetPage, q: targetSearch });
        setUsers(result.users);
        setTotal(result.total);
        setPageSize(result.pageSize);
        setPremiumEnabled(result.premiumEnabled);
        setError("");
      } catch (requestError) {
        setUsers([]);
        setError(requestError.message || "Could not load users.");
      } finally {
        setLoading(false);
      }
    },
    [page, search],
  );

  const reload = useCallback(
    async (targetPage = page, targetSearch = search) => {
      setLoading(true);
      setError("");
      await load(targetPage, targetSearch);
    },
    [load, page, search],
  );

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function saveUser(userId, changes) {
    setBusyId(userId);
    setError("");
    setNotice("");
    try {
      const result = await api.updateAdminUser(userId, changes);
      setSelectedUser((current) =>
        current && current.id === userId
          ? {
              ...current,
              fullName: result.fullName,
              email: result.email,
              premiumUntil: result.premiumUntil || null,
              isPremium: result.isPremium,
            }
          : current,
      );
      setNotice(
        result.isPremium && result.premiumUntil
          ? "Saved. Premium grant recorded in the history."
          : "User updated.",
      );
      await reload();
      if (changes.isPremium === false && selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (requestError) {
      setError(requestError.message || "Could not update this user.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteUser(target) {
    setBusyId(target.id);
    setError("");
    setNotice("");
    try {
      const result = await api.deleteAdminUser(target.id);
      setDeleteToast(result.cleanupWarning || `Deleted ${target.email}.`);
      setDeletingUser(null);
      setSelectedUser(null);
      if (users.length === 1 && page > 1) {
        setLoading(true);
        setPage((current) => current - 1);
      } else {
        await reload();
      }
    } catch (requestError) {
      setError(requestError.message || "Could not delete this account.");
      setDeletingUser(null);
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
          <p className="mt-1 text-xs text-muted">
            Search by name or email. Click a user to edit their profile or manage Premium.
          </p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search users by name or email</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchInput}
            maxLength={100}
            placeholder="Search name or email"
            onChange={(event) => {
              setError("");
              setNotice("");
              setSearchInput(event.target.value);
            }}
            className="focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 pl-9 pr-3 text-sm text-fg outline-none"
          />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-500">{notice}</p>}

      {loading ? (
        <div className="grid min-h-36 place-items-center text-sm text-muted">
          <span className="inline-flex items-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Loading users…</span>
        </div>
      ) : error && !users.length ? (
        <div className="flex items-center justify-between gap-3 py-6 text-sm text-muted">
          <span>Try changing your search or reload the user list.</span>
          <button type="button" onClick={() => void reload()} className="focus-ring rounded-md border border-edge px-3 py-1.5 text-xs font-semibold text-fg">Retry</button>
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
          {search ? "No users match this search." : "No user accounts found."}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
          <p className="text-xs text-muted">
            {total
              ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} ${search ? "matching " : ""}users`
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

      {selectedUser && (
        <AdminEditUserModal
          key={`${selectedUser.id}-${selectedUser.premiumUntil}-${selectedUser.isPremium}`}
          user={selectedUser}
          premiumEnabled={premiumEnabled}
          busy={busyId === selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onSave={saveUser}
          onDelete={(target) => {
            setSelectedUser(null);
            setDeletingUser(target);
          }}
        />
      )}
      {deletingUser && (
        <AdminDeleteUserModal
          user={deletingUser}
          busy={busyId === deletingUser.id}
          onClose={() => setDeletingUser(null)}
          onConfirm={deleteUser}
        />
      )}
      {deleteToast && (
        <DeleteToast
          key={deleteToast}
          message={deleteToast}
          onDismiss={dismissDeleteToast}
        />
      )}
    </section>
  );
}
