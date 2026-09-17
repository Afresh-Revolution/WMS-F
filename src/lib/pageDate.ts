export const DEFAULT_PAGE_TIME_ZONE = "Africa/Lagos";

export function getClientTimeZone(): string {
  if (typeof Intl === "undefined") return DEFAULT_PAGE_TIME_ZONE;
  return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_PAGE_TIME_ZONE;
}

export function formatPageDate(
  date = new Date(),
  timeZone = getClientTimeZone(),
): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  });
}
