import { robot } from "@/lib/robot";
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
export const API_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, "")
  : "";
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers:
        options.body instanceof FormData
          ? undefined
          : { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    robot.mood("error");
    throw new Error(
      "Can't reach the server right now. Check your connection and try again.",
    );
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    robot.mood("error");
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }
  return data;
}
export const api = {
  me: () => request("/api/auth/me"),
  signup: (body) =>
    request("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  forgotPassword: (email) =>
    request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (body) =>
    request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  githubUrl: (next) => `${API_URL}/api/auth/github${next ? `?next=${encodeURIComponent(next)}` : ""}`,
  setNotifications: (enabled) =>
    request("/api/auth/notifications", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return request("/api/auth/avatar", { method: "POST", body: formData });
  },
  deleteAccount: () => request("/api/auth/account", { method: "DELETE" }),
  listPlugins: (q) =>
    request(`/api/plugins${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  getPlugin: (id) => request(`/api/plugins/${id}`),
  submitPlugin: (formData) =>
    request("/api/plugins/submissions", { method: "POST", body: formData }),
  mySubmissions: () => request("/api/plugins/submissions/mine"),
  adminSubmissions: (status = "pending") =>
    request(`/api/admin/submissions?status=${status}`),
  approveSubmission: (id) =>
    request(`/api/admin/submissions/${id}/approve`, { method: "POST" }),
  saveAndApproveSubmission: (id, body) =>
    request(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  rejectSubmission: (id, note) =>
    request(`/api/admin/submissions/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  adminSuggestions: () => request("/api/admin/suggestions"),
  submitSuggestion: (body) =>
    request("/api/suggestions", { method: "POST", body: JSON.stringify(body) }),
};
export const CREATE_SESSION_MAX_AGE_MS = 45 * 60 * 1000;
