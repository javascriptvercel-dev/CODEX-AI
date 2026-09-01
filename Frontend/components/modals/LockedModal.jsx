"use client";

import { useRouter } from "next/navigation";
import { Lock, Wrench } from "lucide-react";
import Modal from "./Modal";
import {
  LOCKED_PAGE_STATUS,
  getLockedPageMessage,
} from "@/lib/lockedPages";

export function getLockedMessage(title, status) {
  return getLockedPageMessage({
    title: title || "This feature",
    status: status || LOCKED_PAGE_STATUS.DEVELOPMENT,
  });
}

export default function LockedModal({
  title,
  description,
  message,
  status = LOCKED_PAGE_STATUS.DEVELOPMENT,
  onClose,
}) {
  const router = useRouter();
  const isRepair = status === LOCKED_PAGE_STATUS.REPAIR;
  const Icon = isRepair ? Wrench : Lock;
  const label = title || "This page";
  const body = description || message || getLockedMessage(title, status);
  const dismissible = typeof onClose === "function";
  const handleClose = onClose || (() => router.push("/"));

  return (
    <Modal
      title={isRepair ? `${label} is being updated` : `${label} is not available yet`}
      icon={<Icon size={18} className="text-azure-500" aria-hidden="true" />}
      onClose={handleClose}
      closeLabel={dismissible ? "Close dialog" : "Return to home"}
    >
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-azure-500/10 text-azure-500 sm:h-16 sm:w-16">
          <Icon size={28} aria-hidden="true" />
        </div>
        <p className="mx-auto max-w-md text-sm leading-6 text-muted [overflow-wrap:anywhere]">
          {body}
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="focus-ring mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-azure-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 active:scale-[0.98] sm:w-auto"
        >
          {dismissible ? "Got it" : "Return home"}
        </button>
      </div>
    </Modal>
  );
}
