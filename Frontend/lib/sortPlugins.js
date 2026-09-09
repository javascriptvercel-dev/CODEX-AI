/**
 * Sort plugins by their actual publish date instead of just
 * reversing the array (which only "looks" sorted when the API
 * already returns newest-first, and silently breaks otherwise).
 * Items with a missing/invalid date sort to the end regardless
 * of direction, rather than jumping to the top or bottom at random.
 */
export function sortPluginsByDate(plugins, newestFirst = true) {
  const withIndex = plugins.map((plugin, index) => ({ plugin, index }));

  withIndex.sort((a, b) => {
    const aTime = getTime(a.plugin);
    const bTime = getTime(b.plugin);

    const aValid = Number.isFinite(aTime);
    const bValid = Number.isFinite(bTime);

    if (!aValid && !bValid) return a.index - b.index;
    if (!aValid) return 1;
    if (!bValid) return -1;

    return newestFirst ? bTime - aTime : aTime - bTime;
  });

  return withIndex.map((entry) => entry.plugin);
}

function getTime(plugin) {
  const raw = plugin?.publishedAt || plugin?.createdAt;
  if (!raw) return NaN;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? NaN : time;
}
