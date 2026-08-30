"use client";
import { MessageCircle, Send, Users, Youtube, UserRound } from "lucide-react";
import Modal from "./Modal";
const CHANNELS = [
  {
    name: "WhatsApp Channel (Main)",
    description: "Announcements & updates.",
    href: "https://whatsapp.com/channel/0029Vb78BHmL2AU7fsANSH2y",
    icon: MessageCircle,
  },
  {
    name: "WhatsApp Channel (Backup)",
    description: "Announcements & updates.",
    href: "https://whatsapp.com/channel/0029Vb6sMEy96H4VI2w3I50F",
    icon: MessageCircle,
  },
  {
    name: "WhatsApp Group",
    description: "Community chat & support.",
    href: "https://chat.whatsapp.com/COw1JMX5TCc0QujXuYiote?s=cl&p=a&ilr=0&amv=0",
    icon: Users,
  },
  {
    name: "Telegram Group",
    description: "Community chat & support.",
    href: "https://t.me/CODEXV3",
    icon: Send,
  },
  {
    name: "Telegram Channel",
    description: "Announcements & updates.",
    href: "https://t.me/CODEX_AIV3",
    icon: Send,
  },
  {
    name: "YouTube Channel",
    description: "Tutorials & demos.",
    href: "https://www.youtube.com/@CODEXSPACEX",
    icon: Youtube,
  },
  {
    name: "Developer",
    description: "Contact directly on Telegram.",
    href: "https://t.me/DEV_CODEXV3",
    icon: UserRound,
  },
];
export default function SupportModal({ onClose }) {
  return (
    <Modal
      title="Support"
      icon={<MessageCircle size={18} className="text-azure-500" />}
      onClose={onClose}
    >

      <p className="mb-4 text-sm text-muted">
        Reach the community and the team directly.
      </p>
      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">

        {CHANNELS.map(({ name, description, href, icon: Icon }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="focus-ring group flex items-center gap-3 rounded-xl border border-edge bg-surface2 p-3 transition hover:border-azure-500/60"
          >

            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-azure-500/10 text-azure-500">

              <Icon size={17} />
            </span>
            <span>

              <span className="block text-sm font-semibold">{name}</span>
              <span className="block text-xs text-muted">
                {description}
              </span>
            </span>
          </a>
        ))}
      </div>
    </Modal>
  );
}
