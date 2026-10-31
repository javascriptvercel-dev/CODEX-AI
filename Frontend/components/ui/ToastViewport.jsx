"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Info, X, XCircle } from "lucide-react";
import { subscribeToToasts } from "@/lib/toast";

const TOAST_STYLES = {
  success: {
    icon: Check,
    className: "border-emerald-500/30 text-emerald-500",
    iconClassName: "bg-emerald-500/10",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-400/30 text-amber-400",
    iconClassName: "bg-amber-400/10",
  },
  info: {
    icon: Info,
    className: "border-azure-500/30 text-azure-500",
    iconClassName: "bg-azure-500/10",
  },
  error: {
    icon: XCircle,
    className: "border-red-500/30 text-red-400",
    iconClassName: "bg-red-500/10",
  },
};

const AUTO_DISMISS_MS = 6000;
const SWIPE_THRESHOLD = 72;
const MAX_STACK = 3;
const TOAST_TYPES = ["success", "warning", "info", "error"];

function ToastCard({ toast, leaving, onDismiss }) {
  const [shown, setShown] = useState(false);
  const [dragX, setDragX] = useState(0);
  const timerRef = useRef(null);
  const startedAtRef = useRef(null);
  const remainingRef = useRef(AUTO_DISMISS_MS);
  const dragRef = useRef({ active: false, startX: 0 });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (startedAtRef.current) {
      remainingRef.current = Math.max(
        remainingRef.current - (Date.now() - startedAtRef.current),
        800,
      );
      startedAtRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearTimer();
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(
      () => onDismiss(toast.id),
      remainingRef.current,
    );
  }, [clearTimer, onDismiss, toast.id]);

  useEffect(() => {
    scheduleDismiss();
    return clearTimer;
  }, [scheduleDismiss, clearTimer]);

  function onPointerDown(event) {
    dragRef.current = { active: true, startX: event.clientX };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    clearTimer();
  }

  function onPointerMove(event) {
    if (!dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    if (delta > 0) setDragX(delta);
  }

  function onPointerUp(event) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const delta = event.clientX - dragRef.current.startX;
    if (delta > SWIPE_THRESHOLD) {
      onDismiss(toast.id);
      return;
    }
    setDragX(0);
    scheduleDismiss();
  }

  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.success;
  const Icon = style.icon;
  const offsetX = leaving ? 28 : shown ? dragX : 28;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={clearTimer}
      onMouseLeave={() => {
        if (!dragRef.current.active) scheduleDismiss();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform: `translateX(${offsetX}px)`,
        opacity: shown && !leaving ? 1 : 0,
        touchAction: "none",
      }}
      className={`pointer-events-auto flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-surface p-3.5 text-sm shadow-2xl transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${style.className}`}
    >
      <span
        className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${style.iconClassName}`}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 break-words text-fg">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="focus-ring grid h-8 w-8 flex-none place-items-center rounded-md text-muted transition hover:bg-surface2 hover:text-fg"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ToastViewport() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast,
      ),
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 220);
  }, []);

  useEffect(() => {
    return subscribeToToasts((incoming) => {
      const message = incoming?.message;
      if (typeof message !== "string" || !message.trim()) return;
      const type = TOAST_TYPES.includes(incoming.type) ? incoming.type : "success";
      setToasts((current) =>
        [
          { id: incoming.id, message: message.trim(), type },
          ...current,
        ].slice(0, MAX_STACK),
      );
    });
  }, []);

  if (!toasts.length) return null;

  return (
    <aside
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-3 top-3 z-[130] flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[24rem]"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          leaving={Boolean(toast.leaving)}
          onDismiss={dismiss}
        />
      ))}
    </aside>
  );
}
