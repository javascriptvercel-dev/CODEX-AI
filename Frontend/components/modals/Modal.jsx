"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
export default function Modal({ title, icon, onClose, children }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-rise my-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-edge bg-surface p-5 shadow-glow sm:p-6">

        <div className="mb-4 flex items-start justify-between gap-4">

          <div className="flex items-center gap-2.5">

            {icon}
            <h2 className="font-display text-lg font-bold">{title}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg"
          >

            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
