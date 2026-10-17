let nextToastId = 0;
let pendingToast = null;
const toastListeners = new Set();

export function showToast(message, { type = "success" } = {}) {
  if (typeof window === "undefined" || !message) return;

  const toast = { id: ++nextToastId, message, type };
  if (toastListeners.size) {
    toastListeners.forEach((listener) => listener(toast));
  } else {
    pendingToast = toast;
  }
}

export function subscribeToToasts(listener) {
  toastListeners.add(listener);
  if (pendingToast) {
    listener(pendingToast);
    pendingToast = null;
  }
  return () => toastListeners.delete(listener);
}
