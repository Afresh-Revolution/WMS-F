export function isManagerPath(pathname: string) {
  return pathname === "/manager" || pathname.startsWith("/manager/");
}

export function portalHref(pathname: string, href: string) {
  if (!isManagerPath(pathname)) return href;
  if (
    href.startsWith("/manager") ||
    href.startsWith("/sign-out") ||
    href.startsWith("http")
  ) {
    return href;
  }
  return `/manager${href}`;
}
