"use client";

import { LifeBuoy } from "lucide-react";
import Modal from "./Modal";
import { SUPPORT_CHANNELS } from "@/lib/supportChannels";

export default function SupportModal({ onClose }) {
  return (
    <Modal
      title="Support"
      icon={<LifeBuoy size={18} className="text-azure-500" aria-hidden="true" />}
      onClose={onClose}
    >
      <p className="mb-4 text-sm leading-6 text-muted">
        Choose a community space for questions, announcements, or tutorials.
      </p>
      <div className="grid gap-2">
        {SUPPORT_CHANNELS.map(({ name, description, href, icon: Icon, color }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${name} — opens in a new tab`}
            className="focus-ring group flex items-center gap-3 rounded-xl border border-edge bg-surface2 p-3 transition hover:border-azure-500/60"
          >
            <Icon size={20} className="flex-shrink-0" style={{ color }} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{name}</span>
              <span className="block text-xs leading-5 text-muted">{description}</span>
            </span>
          </a>
        ))}
      </div>
    </Modal>
  );
}
