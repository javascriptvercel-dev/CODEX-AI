"use client";
import { useState } from "react";
import { LoaderCircle, MailCheck, Trash2 } from "lucide-react";
import Modal from "@/components/modals/Modal";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
export default function DeleteAccountModal({ onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const requestDeletion = async () => {
    setLoading(true);
    setError("");
    try {
      await api.requestAccountDeletion();
      setSent(true);
    } catch (requestError) {
      setError(requestError.message || "Could not send the confirmation email.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      title={sent ? "Check your email" : "Confirm account deletion"}
      icon={sent ? <MailCheck size={18} className="text-azure-500" /> : <Trash2 size={18} className="text-red-400" />}
      onClose={onClose}
    >
      {sent ? (
        <>
          <p className="text-sm leading-relaxed text-muted">
            A confirmation link was sent to <strong className="text-fg">{user?.email}</strong>.
            Your account will remain active unless you confirm the request from that email.
          </p>
          <Button variant="secondary" size="lg" full className="mt-5" onClick={onClose}>
            Done
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-400">
              <Trash2 size={20} />
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              We&apos;ll send a confirmation link to your account email. Your account
              won&apos;t be deleted unless you open that link and confirm.
            </p>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-center text-sm text-red-400">{error}</p>
          )}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" size="lg" full disabled={loading} onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" size="lg" full disabled={loading} onClick={requestDeletion}>
              {loading && <LoaderCircle size={15} className="animate-spin" />}
              {loading ? "Sending…" : "Send confirmation"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
