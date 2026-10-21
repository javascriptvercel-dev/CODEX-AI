"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import Modal from "@/components/modals/Modal";
import Button from "@/components/ui/Button";

const fieldClass = "focus-ring h-10 w-full rounded-lg border border-edge bg-surface2 px-3 text-sm text-fg outline-none";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

const DURATION_PRESETS = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 180, label: "6 months" },
  { days: 365, label: "1 year" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function PremiumDatePicker({ value, onChange }) {
  const selectedDate = parseInputDate(value);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = selectedDate || new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

  const firstWeekday = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const todayValue = dateInputValue(new Date());

  function changeMonth(offset) {
    setVisibleMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + offset, 1),
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-edge bg-surface shadow-lg">
      <div className="flex items-center justify-between gap-3 border-b border-edge px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg"
          >
            <ChevronLeft size={17} />
          </button>
          <h3 className="min-w-32 text-center text-sm font-semibold">{monthLabel}</h3>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            onChange(todayValue);
          }}
          className="focus-ring rounded-lg px-2.5 py-1.5 text-xs font-semibold text-azure-500 transition hover:bg-azure-500/10"
        >
          Today
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 p-3">
        {WEEKDAYS.map((weekday, index) => (
          <span
            key={weekday}
            aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][index]}
            className="grid h-8 place-items-center text-[11px] font-medium text-muted"
          >
            {weekday}
          </span>
        ))}
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const dateValue = dateInputValue(
            new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
          );
          const isSelected = value === dateValue;
          const isToday = todayValue === dateValue;
          return (
            <button
              key={dateValue}
              type="button"
              aria-pressed={isSelected}
              aria-label={new Date(
                visibleMonth.getFullYear(),
                visibleMonth.getMonth(),
                day,
              ).toLocaleDateString(undefined, { dateStyle: "full" })}
              onClick={() => onChange(dateValue)}
              className={`focus-ring grid aspect-square min-h-9 place-items-center rounded-lg text-sm transition ${
                isSelected
                  ? "bg-azure-500 font-semibold text-white"
                  : isToday
                    ? "border border-azure-500/50 text-azure-500 hover:bg-azure-500/10"
                    : "text-fg hover:bg-surface2"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function endOfDay(date) {
  return new Date(date).toISOString();
}

function expiryFromPreset(currentUntil, days) {
  const base = currentUntil && Date.parse(currentUntil) > Date.now()
    ? Date.parse(currentUntil)
    : Date.now();
  return new Date(base + days * 86_400_000).toISOString();
}

export default function AdminEditUserModal({ user, premiumEnabled, busy, onClose, onSave, onDelete }) {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email);
  const [isPremium, setIsPremium] = useState(Boolean(user.isPremium));
  const [duration, setDuration] = useState("30");
  const [customDate, setCustomDate] = useState(
    user.premiumUntil?.slice(0, 10) || "",
  );
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateError, setDateError] = useState("");
  const [note, setNote] = useState("");
  const isAdminAccount = user.role === "admin";

  function computePremiumUntil() {
    if (useCustomDate && customDate) {
      return endOfDay(`${customDate}T23:59:59.999Z`);
    }
    return expiryFromPreset(user.premiumUntil, Number(duration));
  }

  async function submit(event) {
    event.preventDefault();
    if (premiumEnabled && !isAdminAccount && isPremium && useCustomDate && !customDate) {
      setDateError("Select an expiration date to continue.");
      setCalendarOpen(true);
      return;
    }
    const changes = { fullName, email };
    if (premiumEnabled && !isAdminAccount) {
      changes.isPremium = isPremium;
      changes.premiumUntil = isPremium ? computePremiumUntil() : null;
      changes.grantNote = note.trim() || null;
    }
    await onSave(user.id, changes);
  }

  return (
    <Modal
      title="Edit user"
      icon={<Crown size={18} className="text-azure-500" />}
      onClose={onClose}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Joined {formatDate(user.createdAt)}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
          isAdminAccount ? "bg-violet-500/10 text-violet-400" : "bg-surface2 text-muted"
        }`}>
          {user.role}
        </span>
        {user.premiumUntil && !isAdminAccount && (
          <span className="text-[11px]">Premium until {formatDate(user.premiumUntil)}</span>
        )}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          <span className="mb-1.5 block text-muted">Name</span>
          <input
            required
            maxLength={100}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-medium">
          <span className="mb-1.5 block text-muted">Email</span>
          <input
            required
            type="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
          />
        </label>

        {isAdminAccount ? (
          <div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-4 text-sm">
            <p className="font-semibold text-amber-400">Premium — no expiration</p>
            <p className="mt-1 text-xs text-muted">Administrator accounts have permanent Premium status.</p>
          </div>
        ) : premiumEnabled ? (
          <>
            <div className="grid gap-4 rounded-lg border border-edge bg-surface2/40 p-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                <span className="mb-1.5 block text-muted">Account status</span>
                <select
                  value={isPremium ? "premium" : "free"}
                  onChange={(event) => setIsPremium(event.target.value === "premium")}
                  className={fieldClass}
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
              {isPremium && (
                <label className="text-sm font-medium">
                  <span className="mb-1.5 block text-muted">Duration</span>
                  <select
                    value={useCustomDate ? "custom" : duration}
                    onChange={(event) => {
                      if (event.target.value === "custom") {
                        setUseCustomDate(true);
                        setCalendarOpen(true);
                        setDateError("");
                      }
                      else {
                        setUseCustomDate(false);
                        setDuration(event.target.value);
                      }
                    }}
                    className={fieldClass}
                  >
                    {DURATION_PRESETS.map((preset) => (
                      <option key={preset.days} value={String(preset.days)}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">Custom date…</option>
                  </select>
                </label>
              )}
            </div>
            {isPremium && useCustomDate && (
              <div className="text-sm font-medium">
                <span className="mb-1.5 block text-muted">Premium through</span>
                <button
                  type="button"
                  aria-expanded={calendarOpen}
                  aria-label={
                    customDate
                      ? `Premium through ${parseInputDate(customDate).toLocaleDateString()}`
                      : "Choose premium expiration date"
                  }
                  onClick={() => setCalendarOpen((open) => !open)}
                  className={`${fieldClass} flex items-center justify-between text-left transition hover:border-azure-500/50`}
                >
                  <span className={customDate ? "text-fg" : "text-muted"}>
                    {customDate
                      ? parseInputDate(customDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Select a date"}
                  </span>
                  <CalendarDays size={17} className="text-muted" aria-hidden="true" />
                </button>
                {calendarOpen && (
                  <PremiumDatePicker
                    value={customDate}
                    onChange={(date) => {
                      setCustomDate(date);
                      setDateError("");
                      setCalendarOpen(false);
                    }}
                  />
                )}
                {dateError && (
                  <p role="alert" className="mt-2 text-xs text-red-400">
                    {dateError}
                  </p>
                )}
              </div>
            )}
            {isPremium && (
              <label className="text-sm font-medium">
                <span className="mb-1.5 block text-muted">
                  Note <span className="font-normal text-muted">(optional — e.g. “Paid via WhatsApp”)</span>
                </span>
                <input
                  type="text"
                  maxLength={200}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Payment reference or message"
                  className={fieldClass}
                />
              </label>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3 text-xs text-amber-400">
            Premium is switched off on the server. Set PREMIUM_FEATURES_ENABLED=true in the backend environment to grant it.
          </div>
        )}

        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" size="lg" full disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="lg" full disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
        {!isAdminAccount && onDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(user)}
            className="focus-ring inline-flex h-10 items-center justify-center gap-1.5 self-center rounded-lg border border-red-500/30 px-4 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40"
          >
            Delete this account
          </button>
        )}
      </form>
    </Modal>
  );
}
