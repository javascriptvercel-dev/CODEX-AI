"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "@/components/modals/Modal";
import { useAuth } from "@/context/AuthContext";
export default function DeleteAccountModal({ onClose }) {
  const { deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteAccount();
    } catch (err) {
      setError("We could not complete the account deletion. Please try again.");
      setLoading(false);
    }
  };
  return (
    <Modal
      title="Delete account"
      icon={<Trash2 size={18} className="text-red-400" />}
      onClose={onClose}
    >

      <div className="flex flex-col items-center gap-3 py-2 text-center">

        <span className="grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-400">

          <Trash2 size={20} />
        </span>
        <p className="max-w-xs text-sm text-muted">

          This permanently deletes your account and any pending or rejected
          plugin submissions tied to it. Plugins you've already had approved
          stay published. This can&apos;t be undone.
        </p>
      </div>
      {error && (
        <p className="mt-3 text-center text-sm text-red-400">{error}</p>
      )}
      <div className="mt-5 flex gap-2">

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="focus-ring flex-1 rounded-lg border border-edge bg-surface2 py-2.5 text-sm font-semibold transition hover:border-azure-500/60 active:scale-95 disabled:opacity-60"
        >

          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="focus-ring flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-95 disabled:opacity-60"
        >

          {loading ? "Deleting…" : "Delete account"}
        </button>
      </div>
    </Modal>
  );
}
