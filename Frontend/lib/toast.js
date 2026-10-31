let nextToastId = 0;
let pendingToast = null;
const toastListeners = new Set();

export function showToast(message, options = {}) {
  if (typeof window === "undefined" || !message) return;

  const type = options.type || "success";
  const description = options.description || null;
  const duration = options.duration || 5000;

  const toastItem = {
    id: ++nextToastId,
    title: message,
    description,
    type,
    duration,
  };

  if (toastListeners.size > 0) {
    toastListeners.forEach((listener) => listener(toastItem));
  } else {
    pendingToast = toastItem;
  }

  return toastItem.id;
}

export function subscribeToToasts(listener) {
  toastListeners.add(listener);
  if (pendingToast) {
    listener(pendingToast);
    pendingToast = null;
  }
  return () => toastListeners.delete(listener);
}

// Farm-Pulse style shorthand export
export const toast = Object.assign(
  (msg, opts) => showToast(msg, opts),
  {
    success: (msg, opts) => showToast(msg, { ...opts, type: "success" }),
    warning: (msg, opts) => showToast(msg, { ...opts, type: "warning" }),
    error: (msg, opts) => showToast(msg, { ...opts, type: "error" }),
    info: (msg, opts) => showToast(msg, { ...opts, type: "info" }),
  }
);
