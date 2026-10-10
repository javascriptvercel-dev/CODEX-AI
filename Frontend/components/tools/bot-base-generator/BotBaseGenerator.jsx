"use client";

import { useState } from "react";
import { Bot, Download, LoaderCircle } from "lucide-react";

const INITIAL_VALUES = {
  botName: "",
  prefix: "",
  ownerName: "",
  ownerNumber: "",
  pairingNumber: "",
};

const inputClassName =
  "focus-ring mt-1.5 w-full rounded-lg border border-edge bg-surface px-3.5 py-3 text-sm text-fg outline-none placeholder:text-muted/70";

function FormField({ id, label, hint, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-fg">
        {label}
      </label>
      <input id={id} className={inputClassName} {...inputProps} />
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

export default function BotBaseGenerator() {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function updateValue(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function generate(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/tools/bot-base-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "The bot base couldn't be generated.");
      }

      const archive = await response.blob();
      const downloadUrl = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "whatsapp-bot-base.zip";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setMessage("Your customized bot base has been downloaded.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "The bot base couldn't be generated. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="flex items-start gap-4 border-b border-edge p-5 sm:p-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          <Bot size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">Personalize your bot base</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Fill in the details for your WhatsApp bot. We&apos;ll package the complete
            starter project as a ZIP.
          </p>
        </div>
      </div>

      <form onSubmit={generate} className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="botName"
            name="botName"
            label="Bot name"
            type="text"
            autoComplete="off"
            maxLength={50}
            placeholder="e.g. MyBot"
            value={values.botName}
            onChange={updateValue}
            required
          />
          <FormField
            id="prefix"
            name="prefix"
            label="Command prefix"
            type="text"
            autoComplete="off"
            maxLength={4}
            pattern="[^\s]{1,4}"
            title="Enter 1–4 non-space characters."
            placeholder=". or /"
            value={values.prefix}
            onChange={updateValue}
            required
            hint="For example: . or !"
          />
          <FormField
            id="ownerName"
            name="ownerName"
            label="Owner name"
            type="text"
            autoComplete="name"
            maxLength={50}
            placeholder="e.g. Alex"
            value={values.ownerName}
            onChange={updateValue}
            required
          />
          <FormField
            id="ownerNumber"
            name="ownerNumber"
            label="Owner WhatsApp number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            pattern="[0-9]{7,15}"
            maxLength={15}
            placeholder="2348012345678"
            value={values.ownerNumber}
            onChange={updateValue}
            required
            hint="Country code and number, digits only (7–15 digits)."
          />
          <div className="sm:col-span-2">
            <FormField
              id="pairingNumber"
              name="pairingNumber"
              label="Pairing number (optional)"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              pattern="([0-9]{7,15})?"
              maxLength={15}
              placeholder="Leave blank to enter it when the bot starts"
              value={values.pairingNumber}
              onChange={updateValue}
              hint="If provided, the bot uses this number instead of prompting at startup. Digits only."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-azure-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <Download size={17} aria-hidden="true" />
          )}
          {loading ? "Generating..." : "Generate bot base"}
        </button>

        <p
          role={isError ? "alert" : "status"}
          aria-live="polite"
          className={`text-sm ${isError ? "text-red-400" : "text-muted"}`}
        >
          {message}
        </p>
      </form>
    </div>
  );
}
