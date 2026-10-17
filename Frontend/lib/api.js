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

async function requestBlob(path, options = {}) {
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

  if (!res.ok) {
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;
    robot.mood("error");
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }
  return res.blob();
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
  adminSubmissions: (status = "pending", reviewer = "all") =>
    request(
      `/api/admin/submissions?status=${encodeURIComponent(status)}${
        reviewer === "me" ? "&reviewedBy=me" : ""
      }`,
    ),
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
  adminStats: () => request("/api/admin/stats"),
  adminPremium: () => request("/api/admin/premium"),
  adminUsers: ({ page = 1, q = "" } = {}) =>
    request(`/api/admin/users?page=${page}&q=${encodeURIComponent(q)}`),
  updateAdminUser: (id, body) =>
    request(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAdminUser: (id) =>
    request(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
  publishedAssistantFaqs: () => request("/api/assistant-faqs"),
  adminAssistantFaqDrafts: () => request("/api/admin/assistant-faqs"),
  createAssistantFaqDraft: (body) =>
    request("/api/assistant-faqs/suggestions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  reviewAssistantFaqDraft: (id, body) =>
    request(`/api/admin/assistant-faqs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  submitSuggestion: (body) =>
    request("/api/suggestions", { method: "POST", body: JSON.stringify(body) }),
  checkBan: (number) =>
    request("/api/tools/ban-check", {
      method: "POST",
      body: JSON.stringify({ number }),
      signal: AbortSignal.timeout(25000),
    }),
  generateBotBase: (settings) =>
    requestBlob("/api/tools/bot-base-generator", {
      method: "POST",
      body: JSON.stringify(settings),
    }),
  obfuscateJavaScript: (code, mode) =>
    request("/api/tools/javascript-obfuscator", {
      method: "POST",
      body: JSON.stringify({ code, mode }),
    }),
  obfuscateJavaScriptUpload: (file, mode) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    return requestBlob("/api/tools/javascript-obfuscator/upload", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(900000),
    });
  },
  dashboard: () => request("/api/dashboard"),
  dashboardToolSettings: () => request("/api/dashboard/tool-settings"),
  saveDashboardToolSettings: (tool, settings) =>
    request("/api/dashboard/tool-settings", {
      method: "PUT",
      body: JSON.stringify({ tool, settings }),
    }),
  createAdminAccount: (body) =>
    request("/api/dashboard/admin/accounts", { method: "POST", body: JSON.stringify(body) }),
  shortLinks: () => request("/api/tools/short-links"),
  createShortLink: (url) =>
    request("/api/tools/short-links", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  deleteShortLink: (id) =>
    request(`/api/tools/short-links/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
export const CREATE_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
