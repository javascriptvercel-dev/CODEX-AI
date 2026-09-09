"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "@/components/modals/Modal";
import Button from "@/components/ui/Button";
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

        <Button variant="secondary" size="lg" full className="flex-1" disabled={loading} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="lg" full className="flex-1" disabled={loading} onClick={handleDelete}>
          {loading ? "Deleting…" : "Delete account"}
        </Button>
      </div>
    </Modal>
  );
}
