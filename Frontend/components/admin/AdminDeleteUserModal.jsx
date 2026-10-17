"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "@/components/modals/Modal";
import Button from "@/components/ui/Button";

export default function AdminDeleteUserModal({ user, busy, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const confirmed = confirmText.trim().toLowerCase() === user.email.trim().toLowerCase();

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
          This permanently deletes <span className="text-fg">{user.email}</span> and
          their pending or rejected plugin submissions. Approved plugins stay
          published. This can&apos;t be undone.
        </p>
        <label className="w-full text-left text-sm">
          <span className="mb-1.5 block text-muted">
            Type <span className="font-semibold text-fg">{user.email}</span> to confirm
          </span>
          <input
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 px-3 text-sm text-fg outline-none"
            autoComplete="off"
          />
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" size="lg" full disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="lg" full disabled={busy || !confirmed} onClick={() => onConfirm(user)}>
          {busy ? "Deleting…" : "Delete account"}
        </Button>
      </div>
    </Modal>
  );
}
