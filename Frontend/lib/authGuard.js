const protectedRoutes = ["/create"];

function cleanPath(value = "") {
  const pathname = String(value).split("?")[0].split("#")[0] || "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function requiresAuth(pathname) {
  const path = cleanPath(pathname);
  return protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}