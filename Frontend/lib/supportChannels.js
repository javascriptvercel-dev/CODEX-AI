import { MessageCircle, Send, Users, Youtube } from "lucide-react";

export const SUPPORT_CHANNELS = [
  {
    name: "WhatsApp Community",
    description: "Announcements, updates, and community support.",
    href: "https://whatsapp.com/channel/0029Vb78BHmL2AU7fsANSH2y",
    icon: MessageCircle,
    group: "community",
  },
  {
    name: "WhatsApp Backup Channel",
    description: "A second place for announcements and updates.",
    href: "https://whatsapp.com/channel/0029Vb6sMEy96H4VI2w3I50F",
    icon: MessageCircle,
    group: "community",
  },
  {
    name: "WhatsApp Group",
    description: "Ask questions and chat with other users.",
    href: "https://chat.whatsapp.com/COw1JMX5TCc0QujXuYiote?s=cl&p=a&ilr=0&amv=0",
    icon: Users,
    group: "community",
  },
  {
    name: "Telegram Group",
    description: "Community discussion and general support.",
    href: "https://t.me/CODEXV3",
    icon: Send,
    group: "community",
  },
  {
    name: "Telegram Channel",
    description: "Announcements and project updates.",
    href: "https://t.me/CODEX_AIV3",
    icon: Send,
    group: "updates",
  },
  {
    name: "YouTube",
    description: "Tutorials, demos, and walkthroughs.",
    href: "https://www.youtube.com/@CODEXSPACEX",
    icon: Youtube,
    group: "learning",
  },
];
