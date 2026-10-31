"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from "lucide-react";
import { subscribeToToasts } from "@/lib/toast";

/**
 * Farm-Pulse inspired toast notification system.
 * - Top-right floating stack with depth scaling
 * - Native swipe-to-dismiss (touch & mouse pointer drag)
 * - Theme-aware surface colors with a subtle accent glow
 * - Warnings, errors, success & info styling
 */

const TOAST_THEMES = {
  success: {
    icon: CheckCircle2,
    badgeBg: "bg-azure-500/10 text-azure-500 border-azure-500/20",
    accentGlow: "from-azure-500/30 via-azure-500/10 to-transparent",
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: "bg-azure-500/10 text-azure-500 border-azure-500/20",
    accentGlow: "from-azure-500/30 via-azure-500/10 to-transparent",
  },
  error: {
    icon: XCircle,
    badgeBg: "bg-azure-500/10 text-azure-500 border-azure-500/20",
    accentGlow: "from-azure-500/30 via-azure-500/10 to-transparent",
  },
  info: {
    icon: Info,
    badgeBg: "bg-azure-500/10 text-azure-500 border-azure-500/20",
    accentGlow: "from-azure-500/30 via-azure-500/10 to-transparent",
  },
};

const SWIPE_THRESHOLD = 70;
const MAX_VISIBLE_STACK = 3;

function ToastCard({ item, index, onDismiss }) {
  const [shown, setShown] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0 });

  const duration = item.duration || 5000;

  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, duration);
  }, [duration, item.id, onDismiss]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isHovered) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isHovered, startTimer, clearTimer]);

  function onPointerDown(e) {
    if (e.target.closest("button")) return;
    dragRef.current = { active: true, startX: e.clientX };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    clearTimer();
  }

  function onPointerMove(e) {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.startX;
    if (delta > 0) setDragX(delta);
  }

  function onPointerUp(e) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const delta = e.clientX - dragRef.current.startX;
    if (delta > SWIPE_THRESHOLD) {
      onDismiss(item.id);
    } else {
      setDragX(0);
      startTimer();
    }
  }

  const theme = TOAST_THEMES[item.type] || TOAST_THEMES.success;
  const Icon = theme.icon;

  const isLeaving = Boolean(item.leaving);
  const stackOffset = Math.min(index, 2) * 8;
  const scale = 1 - Math.min(index, 2) * 0.04;
  const opacity = isLeaving ? 0 : shown ? 1 - Math.min(index, 2) * 0.15 : 0;

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform: `translate3d(${dragX}px, ${stackOffset}px, 0) scale(${scale})`,
        opacity,
        touchAction: "none",
      }}
      className="pointer-events-auto relative flex w-full max-w-[23rem] items-start gap-3 overflow-hidden rounded-2xl border border-edge bg-surface/95 p-4 text-fg shadow-xl backdrop-blur-xl transition-all duration-200 ease-out select-none"
    >
      {/* Top subtle glow line */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${theme.accentGlow}`}
      />

      {/* Status icon badge */}
      <div
        className={`grid h-8 w-8 flex-none place-items-center rounded-xl border ${theme.badgeBg}`}
      >
        <Icon size={17} strokeWidth={2.2} />
      </div>

      {/* Text body */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold tracking-tight text-fg leading-snug">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 text-xs text-muted leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Close notification"
        className="focus-ring flex-none -mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastViewport() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 180);
  }, []);

  useEffect(() => {
    return subscribeToToasts((incoming) => {
      setToasts((prev) => [incoming, ...prev].slice(0, MAX_VISIBLE_STACK));
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex flex-col items-end gap-2.5 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-auto"
    >
      {toasts.map((item, idx) => (
        <ToastCard
          key={item.id}
          item={item}
          index={idx}
          onDismiss={dismiss}
        />
      ))}
    </aside>
  );
}
