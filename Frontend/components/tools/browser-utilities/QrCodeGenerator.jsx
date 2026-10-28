"use client";

import { useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download, QrCode, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  BROWSER_UTILITY_LIMITS,
  consumeBrowserUtilityUsage,
  downloadToolText,
  TOOL_CARD_CLASS,
  TOOL_INPUT_CLASS,
  TOOL_LABEL_CLASS,
  ToolError,
  ToolFrame,
  UtilityPlanNotice,
} from "./ToolFrame";

const QR_TYPES = [
  ["url", "Link"],
  ["text", "Text"],
  ["wifi", "Wi-Fi"],
  ["email", "Email"],
  ["sms", "SMS"],
  ["contact", "Contact"],
];

function escapeWifi(value) {
  return value.replace(/[\\;,:"']/gu, (char) => `\\${char}`);
}

function escapeVCard(value) {
  return value.replace(/\\/gu, "\\\\").replace(/\n/gu, "\\n").replace(/,/gu, "\\,").replace(/;/gu, "\\;");
}

function makeQrPayload(type, fields) {
  if (type === "url") {
    const url = fields.url.trim();
    if (!url) throw new Error("Enter a link to create a QR code.");
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Enter a complete URL that starts with http:// or https://.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("QR links must use http:// or https://.");
    }
    return parsed.href;
  }
  if (type === "text") {
    if (!fields.text.trim()) throw new Error("Enter some text to create a QR code.");
    return fields.text;
  }
  if (type === "wifi") {
    if (!fields.ssid.trim()) throw new Error("Enter the Wi-Fi network name.");
    if (fields.security !== "nopass" && !fields.wifiPassword) {
      throw new Error("Enter the Wi-Fi password or choose an open network.");
    }
    return `WIFI:T:${fields.security};S:${escapeWifi(fields.ssid)};P:${escapeWifi(fields.wifiPassword)};H:${fields.hidden ? "true" : "false"};;`;
  }
  if (type === "email") {
    if (!fields.email.trim()) throw new Error("Enter an email address.");
    return `mailto:${fields.email.trim()}?subject=${encodeURIComponent(fields.subject)}&body=${encodeURIComponent(fields.emailBody)}`;
  }
  if (type === "sms") {
    if (!fields.phone.trim()) throw new Error("Enter a phone number.");
    return `SMSTO:${fields.phone.trim()}:${fields.smsBody}`;
  }

  if (!fields.contactName.trim()) throw new Error("Enter a contact name.");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(fields.contactName)}`,
    fields.organization && `ORG:${escapeVCard(fields.organization)}`,
    fields.contactPhone && `TEL;TYPE=CELL:${escapeVCard(fields.contactPhone)}`,
    fields.contactEmail && `EMAIL:${escapeVCard(fields.contactEmail)}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function QrTextField({ id, label, value, onChange, placeholder, type = "text", required = false }) {
  return (
    <label htmlFor={id} className={TOOL_LABEL_CLASS}>
      {label}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className={`${TOOL_INPUT_CLASS} mt-2`}
      />
    </label>
  );
}

export default function QrCodeGenerator() {
  const { user } = useAuth();
  const isPremium = user?.role === "admin" || user?.isPremium;
  const outputWidth = isPremium
    ? BROWSER_UTILITY_LIMITS.premiumQrPixels
    : BROWSER_UTILITY_LIMITS.freeQrPixels;
  const [type, setType] = useState("url");
  const [fields, setFields] = useState({
    url: "",
    text: "",
    ssid: "",
    wifiPassword: "",
    security: "WPA",
    hidden: false,
    email: "",
    subject: "",
    emailBody: "",
    phone: "",
    smsBody: "",
    contactName: "",
    organization: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [qr, setQr] = useState(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  function updateField(name, value) {
    setFields((current) => ({ ...current, [name]: value }));
    setQr(null);
    setError("");
  }

  async function generate(event) {
    event.preventDefault();
    setGenerating(true);
    setError("");
    setQr(null);
    try {
      const payload = makeQrPayload(type, fields);
      await consumeBrowserUtilityUsage("qr-code-generator");
      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: outputWidth,
        color: { dark: "#111827", light: "#FFFFFF" },
      });
      const svg = await QRCode.toString(payload, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 2,
        width: outputWidth,
        color: { dark: "#111827", light: "#FFFFFF" },
      });
      setQr({ dataUrl, svg });
    } catch (generationError) {
      setError(
        generationError?.message?.includes("too big")
          ? "That content is too long for a QR code. Shorten it and try again."
          : generationError?.message || "Could not create this QR code.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ToolFrame
      icon={QrCode}
      title="QR Code Generator"
      description="Create downloadable QR codes for links, text, Wi-Fi, email, SMS, and contact cards. Generated locally."
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="QR code content type">
        {QR_TYPES.map(([id, label]) => (
          <Button
            key={id}
            variant={type === id ? "primary" : "secondary"}
            size="sm"
            aria-pressed={type === id}
            onClick={() => {
              setType(id);
              setQr(null);
              setError("");
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <form onSubmit={generate} className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {type === "url" && (
            <QrTextField id="qr-url" label="Website URL" value={fields.url} onChange={(value) => updateField("url", value)} placeholder="https://example.com" type="url" required />
          )}
          {type === "text" && (
            <label htmlFor="qr-text" className={TOOL_LABEL_CLASS}>
              Text
              <textarea id="qr-text" value={fields.text} onChange={(event) => updateField("text", event.target.value)} rows={5} placeholder="Type a message…" className={`${TOOL_INPUT_CLASS} mt-2 resize-y`} />
            </label>
          )}
          {type === "wifi" && (
            <>
              <QrTextField id="qr-ssid" label="Network name (SSID)" value={fields.ssid} onChange={(value) => updateField("ssid", value)} placeholder="Your Wi-Fi name" required />
              <label htmlFor="qr-security" className={TOOL_LABEL_CLASS}>
                Security
                <select id="qr-security" value={fields.security} onChange={(event) => updateField("security", event.target.value)} className={`${TOOL_INPUT_CLASS} mt-2`}>
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Open network</option>
                </select>
              </label>
              {fields.security !== "nopass" && (
                <QrTextField id="qr-wifi-password" label="Network password" value={fields.wifiPassword} onChange={(value) => updateField("wifiPassword", value)} placeholder="Wi-Fi password" type="password" required />
              )}
              <label className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" checked={fields.hidden} onChange={(event) => updateField("hidden", event.target.checked)} className="h-4 w-4 accent-azure-500" />
                Hidden network
              </label>
            </>
          )}
          {type === "email" && (
            <>
              <QrTextField id="qr-email" label="Email address" value={fields.email} onChange={(value) => updateField("email", value)} placeholder="hello@example.com" type="email" required />
              <QrTextField id="qr-subject" label="Subject (optional)" value={fields.subject} onChange={(value) => updateField("subject", value)} placeholder="Email subject" />
              <label htmlFor="qr-email-body" className={TOOL_LABEL_CLASS}>
                Message (optional)
                <textarea id="qr-email-body" value={fields.emailBody} onChange={(event) => updateField("emailBody", event.target.value)} rows={3} className={`${TOOL_INPUT_CLASS} mt-2 resize-y`} />
              </label>
            </>
          )}
          {type === "sms" && (
            <>
              <QrTextField id="qr-phone" label="Phone number" value={fields.phone} onChange={(value) => updateField("phone", value)} placeholder="+1234567890" type="tel" required />
              <label htmlFor="qr-sms-body" className={TOOL_LABEL_CLASS}>
                Message (optional)
                <textarea id="qr-sms-body" value={fields.smsBody} onChange={(event) => updateField("smsBody", event.target.value)} rows={3} className={`${TOOL_INPUT_CLASS} mt-2 resize-y`} />
              </label>
            </>
          )}
          {type === "contact" && (
            <>
              <QrTextField id="qr-contact-name" label="Name" value={fields.contactName} onChange={(value) => updateField("contactName", value)} placeholder="Full name" required />
              <QrTextField id="qr-contact-org" label="Organization (optional)" value={fields.organization} onChange={(value) => updateField("organization", value)} placeholder="Company or organization" />
              <QrTextField id="qr-contact-phone" label="Phone (optional)" value={fields.contactPhone} onChange={(value) => updateField("contactPhone", value)} placeholder="+1234567890" type="tel" />
              <QrTextField id="qr-contact-email" label="Email (optional)" value={fields.contactEmail} onChange={(value) => updateField("contactEmail", value)} placeholder="hello@example.com" type="email" />
            </>
          )}
          <Button type="submit" disabled={generating}>
            <Sparkles size={15} aria-hidden="true" />
            {generating ? "Generating…" : "Generate QR code"}
          </Button>
        </div>

        <div className={`${TOOL_CARD_CLASS} flex min-h-72 flex-col items-center justify-center gap-4`}>
          {qr ? (
            <>
              <Image
                src={qr.dataUrl}
                alt="Generated QR code"
                width={256}
                height={256}
                unoptimized
                className="h-64 w-64 max-w-full rounded-lg bg-white p-2"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <a href={qr.dataUrl} download="codex-qr-code.png" className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-md border border-edge bg-surface px-3 text-xs font-semibold text-fg">
                  <Download size={14} aria-hidden="true" /> PNG
                </a>
                <Button variant="secondary" size="sm" onClick={() => downloadToolText("codex-qr-code.svg", qr.svg, "image/svg+xml;charset=utf-8")}>
                  <Download size={14} aria-hidden="true" /> SVG
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-muted">
              <QrCode size={54} strokeWidth={1.3} className="mx-auto opacity-60" aria-hidden="true" />
              <p className="mt-3 text-sm">Your QR code will appear here</p>
            </div>
          )}
        </div>
      </form>
      <UtilityPlanNotice
        freeBenefit={`${BROWSER_UTILITY_LIMITS.freeQrPixels}px PNG exports`}
        premiumBenefit={`${BROWSER_UTILITY_LIMITS.premiumQrPixels.toLocaleString()}px PNG exports`}
      />
      <ToolError message={error} />
      <p className="text-xs leading-5 text-muted">
        QR content is generated on your device. Avoid encoding sensitive information.
      </p>
    </ToolFrame>
  );
}
