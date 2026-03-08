export function getUpstreamBase() {
  const rawBase = process.env.RADAR_API_BASE || process.env.UPSTREAM_API_BASE;
  if (!rawBase) {
    throw new Error("Missing env: RADAR_API_BASE");
  }
  return rawBase.replace(/\/+$/, "");
}

export function buildUpstreamUrl(pathname) {
  return `${getUpstreamBase()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
