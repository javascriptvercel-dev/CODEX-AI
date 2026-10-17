"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
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
};

export default function ToastViewport() {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef(null);
  const autoDismissTimer = useRef(null);
  const exitTimer = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((incomingToast) => {
      const message = incomingToast?.message;
      if (typeof message !== "string" || !message.trim()) return;

      window.clearTimeout(autoDismissTimer.current);
      window.clearTimeout(exitTimer.current);
      window.cancelAnimationFrame(animationFrame.current);

      const id = incomingToast.id;
      const type = ["warning", "info"].includes(incomingToast.type) ? incomingToast.type : "success";
      setVisible(false);
      setToast({ id, message, type });
      animationFrame.current = window.requestAnimationFrame(() => setVisible(true));
      autoDismissTimer.current = window.setTimeout(() => {
        setVisible(false);
        exitTimer.current = window.setTimeout(() => {
          setToast((current) => (current?.id === id ? null : current));
        }, 220);
      }, 6000);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(autoDismissTimer.current);
      window.clearTimeout(exitTimer.current);
      window.cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  function dismiss() {
    if (!toast) return;
    window.clearTimeout(autoDismissTimer.current);
    setVisible(false);
    exitTimer.current = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 220);
  }

  if (!toast) return null;

  const style = TOAST_STYLES[toast.type];
  const Icon = style.icon;

  return (
    <aside
      role="status"
      aria-live="polite"
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const endX = event.changedTouches[0]?.clientX;
        if (touchStartX.current !== null && endX !== undefined && Math.abs(endX - touchStartX.current) > 48) {
          dismiss();
        }
        touchStartX.current = null;
      }}
      className={`fixed inset-x-3 bottom-3 z-[100] mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-xl border bg-surface p-3.5 text-sm shadow-2xl transition-[opacity,transform] duration-200 ease-out sm:inset-x-auto sm:bottom-5 sm:right-5 motion-reduce:transition-none ${
        style.className
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
    >
      <span className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${style.iconClassName}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 break-words">{toast.message}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="focus-ring grid h-8 w-8 flex-none place-items-center rounded-md text-muted transition hover:bg-surface2 hover:text-fg"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
