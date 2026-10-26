import {
  Bot,
  Braces,
  FileCode2,
  Fingerprint,
  KeyRound,
  Link2,
  QrCode,
  ShieldCheck,
  Type,
} from "lucide-react";

/**
 * Tools registry — the single place every tool is declared.
 *
 * To add a tool:
 *   1. Build its UI as a default-exported client component, e.g.
 *      components/tools/<slug>/<Name>.jsx
 *   2. Add one entry below. The hub card, the /tools/<slug> page, the
 *      sitemap entry and the lazy loading all come from this entry.
 *
 * `load` is a dynamic import, so a tool's code is only downloaded when
 * someone opens it. Leave `load` out (and set status "soon") to show a
 * non-clickable "coming soon" card.
 */
export const TOOL_STATUS = {
  LIVE: "live",
  BETA: "beta",
  SOON: "soon",
};

export const tools = [
  {
    slug: "javascript-obfuscator",
    name: "JavaScript Obfuscator",
    description:
      "Make JavaScript harder to read with adjustable obfuscation presets.",
    icon: Braces,
    status: TOOL_STATUS.LIVE,
    tags: ["JavaScript", "Code"],
    keywords: ["JavaScript obfuscator", "obfuscate code", "code protection"],
    preview: "/tools/javascript-obfuscator/JavaScript%20Obfuscator.png",
    load: () => import("@/components/tools/javascript-obfuscator/JavaScriptObfuscator"),
  },
  {
    slug: "url-shortener",
    name: "URL Shortener",
    description:
      "Create and manage compact, shareable links with your CODEX AI account.",
    icon: Link2,
    status: TOOL_STATUS.LIVE,
    tags: ["Links", "Share"],
    keywords: ["URL shortener", "short links", "link management"],
    preview: "/tools/url-shortener/URL%20Shortener.png",
    load: () => import("@/components/tools/url-shortener/UrlShortener"),
  },
  {
    slug: "bot-base-generator",
    name: "Bot Base Generator",
    description:
      "Create a ready-to-run WhatsApp bot starter.",
    icon: Bot,
    status: TOOL_STATUS.LIVE,
    tags: ["Generator", "ZIP"],
    keywords: ["WhatsApp bot base generator", "WhatsApp bot starter"],
    preview: "/tools/bot-base-generator/preview.svg",
    load: () => import("@/components/tools/bot-base-generator/BotBaseGenerator"),
  },
  {
    slug: "wa-ban-checker",
    name: "WhatsApp Ban Checker",
    description:
      "Check whether a WhatsApp number is active, temporarily restricted or permanently banned.",
    icon: ShieldCheck,
    status: TOOL_STATUS.LIVE,
    tags: ["WhatsApp", "Lookup"],
    keywords: ["WhatsApp ban checker", "check banned WhatsApp number"],
    preview: "/tools/wa-ban-checker/bg.jpg",
    load: () => import("@/components/tools/wa-ban-checker/WaBanChecker"),
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    description:
      "Create QR codes for links, text, Wi-Fi, email, SMS, and contacts without uploading your data.",
    icon: QrCode,
    status: TOOL_STATUS.LIVE,
    tags: ["Free", "Private"],
    keywords: ["QR code generator", "make QR", "Wi-Fi QR", "contact QR"],
    preview: "/tools/qr-code-generator/preview.svg",
    load: () => import("@/components/tools/browser-utilities/QrCodeGenerator"),
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    description:
      "Generate secure UUID v4 values in batches, right in your browser.",
    icon: Fingerprint,
    status: TOOL_STATUS.LIVE,
    tags: ["Free", "Generator"],
    keywords: ["UUID", "GUID generator", "random identifier"],
    preview: "/tools/uuid-generator/preview.svg",
    load: () => import("@/components/tools/browser-utilities/UuidGenerator"),
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    description:
      "Create strong random passwords with your choice of length and characters.",
    icon: KeyRound,
    status: TOOL_STATUS.LIVE,
    tags: ["Free", "Private"],
    keywords: ["secure password", "random password", "password strength"],
    preview: "/tools/password-generator/preview.svg",
    load: () => import("@/components/tools/browser-utilities/PasswordGenerator"),
  },
  {
    slug: "character-counter",
    name: "Character Counter",
    description:
      "Count characters, words, sentences, and paragraphs as you type.",
    icon: Type,
    status: TOOL_STATUS.LIVE,
    tags: ["Free", "Writing"],
    keywords: ["word counter", "text counter", "sentence counter", "letter count"],
    preview: "/tools/character-counter/preview.svg",
    load: () => import("@/components/tools/browser-utilities/CharacterCounter"),
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder / Decoder",
    description:
      "Encode or decode URL text and validate web addresses locally.",
    icon: Link2,
    status: TOOL_STATUS.LIVE,
    tags: ["Free", "Private"],
    keywords: ["percent encoding", "URI encoder", "URL decode", "URL validator"],
    preview: "/tools/url-encoder-decoder/preview.svg",
    load: () => import("@/components/tools/browser-utilities/UrlEncoderDecoder"),
  },
  {
    slug: "code-minifier",
    name: "Code Minifier",
    description:
      "Automatically detect and minify code in your browser, with no language selector.",
    icon: FileCode2,
    status: TOOL_STATUS.LIVE,
    tags: ["Free", "Code"],
    keywords: ["JavaScript minifier", "CSS minifier", "JSON minifier", "code compression"],
    preview: "/tools/code-minifier/preview.svg",
    load: () => import("@/components/tools/browser-utilities/CodeMinifier"),
  },
];

export function getTool(slug) {
  return tools.find((tool) => tool.slug === slug) || null;
}

export function isToolOpenable(tool) {
  return Boolean(tool?.load) && tool.status !== TOOL_STATUS.SOON;
}
