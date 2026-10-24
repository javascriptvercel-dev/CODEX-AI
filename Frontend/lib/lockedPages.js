export const LOCKED_PAGE_STATUS = {
  DEVELOPMENT: "development",
  REPAIR: "repair",
};

export const lockedPages = [
  {
    path: "/apis",
    title: "APIs",
    status: LOCKED_PAGE_STATUS.DEVELOPMENT,
    message:
      "The APIs section is in development. Availability will be announced when it is ready.",
  },
];

function cleanPath(value = "") {
  const pathname = String(value).split("#")[0].split("?")[0] || "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function getLockedPage(value) {
  const path = cleanPath(value);
  return lockedPages.find((page) => cleanPath(page.path) === path) || null;
}

export function getLockedPageMessage(page) {
  if (!page) return "";
  if (page.message) return page.message;

  if (page.status === LOCKED_PAGE_STATUS.REPAIR) {
    return `${page.title} is temporarily unavailable while we repair and improve this section. Please check back soon.`;
  }

  return `${page.title} is in development. Availability will be announced when it is ready.`;
}
