import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveApiRoot } from "@/lib/api/proxy";
import { unwrapList, unwrapRecord } from "@/lib/api/types";
import { parseAuthUser } from "@/lib/currentUser";

const STORE_FILE = join(process.cwd(), ".data", "employee-announcements.json");

function backendUrl(path: string, search = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiRoot()}/api/v1${normalized}${search}`;
}

async function backendJson(
  request: Request,
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const search =
    init.method && init.method !== "GET" ? "" : new URL(request.url).search;
  const response = await fetch(backendUrl(path, search), {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function isMissingRoute(status: number) {
  return status === 401 || status === 403 || status === 404 || status === 405;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    return JSON.parse(Buffer.from(padded + pad, "base64").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function authorFromRequest(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const claims = decodeJwtPayload(token);
  return parseAuthUser(claims) ?? parseAuthUser({ data: claims });
}

function announcementKey(row: Record<string, unknown>) {
  return String(row.id ?? row._id ?? row.title ?? "")
    .trim()
    .toLowerCase();
}

function readStore(): Record<string, unknown>[] {
  try {
    if (!existsSync(STORE_FILE)) return [];
    const parsed = JSON.parse(readFileSync(STORE_FILE, "utf8"));
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

function writeStore(rows: Record<string, unknown>[]) {
  mkdirSync(dirname(STORE_FILE), { recursive: true });
  writeFileSync(STORE_FILE, JSON.stringify(rows, null, 2), "utf8");
}

function mergeRows(sources: unknown[]) {
  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    for (const row of unwrapList<Record<string, unknown>>(source)) {
      const key = announcementKey(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }
  return merged;
}

function persistAnnouncement(
  body: Record<string, unknown>,
  payload: unknown = {},
  authorName = "Employee",
  initials = "EM",
) {
  const data = unwrapRecord(payload);
  const now = new Date().toISOString();
  const title = String(body.title ?? data.title ?? "").trim();
  const message = String(body.message ?? body.body ?? data.message ?? data.body ?? "").trim();
  const source = String(
    data.source ?? data.author ?? body.author ?? body.source ?? authorName,
  );
  const record: Record<string, unknown> = {
    id:
      String(data.id ?? data._id ?? "") ||
      `emp-announcement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: String(data.createdAt ?? body.createdAt ?? now),
    publishedAt: String(data.publishedAt ?? body.publishedAt ?? now),
    ...body,
    ...data,
    title,
    message,
    body: message,
    category: String(data.category ?? body.category ?? "General"),
    status: String(data.status ?? body.status ?? "published"),
    audienceType: String(data.audienceType ?? body.audienceType ?? "all_staff"),
    audience: String(data.audience ?? body.audience ?? "All staff"),
    isPinned: Boolean(data.isPinned ?? body.isPinned),
    pinned: Boolean(data.isPinned ?? body.isPinned),
    source,
    author: source,
    publishedBy: source,
    initials: String(data.initials ?? body.initials ?? initials),
    isRead: false,
    unread: true,
  };

  const others = readStore().filter(
    (row) => announcementKey(row) !== announcementKey(record),
  );
  writeStore([record, ...others]);
  return record;
}

export async function listEmployeeAnnouncements(request: Request) {
  const results = await Promise.allSettled([
    backendJson(request, "/announcements"),
    backendJson(request, "/employee/announcements"),
  ]);

  const remote: unknown[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    if (result.value.response.ok) remote.push(result.value.payload);
  }

  return Response.json({ data: mergeRows([...remote, readStore()]) }, { status: 200 });
}

export async function createEmployeeAnnouncement(
  request: Request,
  body: Record<string, unknown>,
) {
  if (!request.headers.get("authorization")) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to publish." } },
      { status: 401 },
    );
  }

  const title = String(body.title ?? "").trim();
  const message = String(body.message ?? body.body ?? "").trim();
  if (!title) {
    return Response.json(
      { error: { code: "TITLE_REQUIRED", message: "Enter a title." } },
      { status: 400 },
    );
  }
  if (!message) {
    return Response.json(
      { error: { code: "MESSAGE_REQUIRED", message: "Enter a message." } },
      { status: 400 },
    );
  }

  const author = authorFromRequest(request);
  const authorName = String(body.author ?? body.source ?? author?.name ?? "Employee");
  const initials = String(body.initials ?? author?.initials ?? "EM");
  const payload = {
    ...body,
    title,
    message,
    body: message,
    category: String(body.category ?? "General"),
    audienceType: String(body.audienceType ?? "all_staff"),
    audience: String(body.audience ?? "All staff"),
    status: String(body.status ?? "published"),
    isPinned: Boolean(body.isPinned),
    author: authorName,
    source: authorName,
  };

  const attempts = ["/employee/announcements", "/announcements", "/staff/announcements"];

  for (const path of attempts) {
    try {
      const { response, payload: result } = await backendJson(request, path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const stored = persistAnnouncement(payload, result, authorName, initials);
        return Response.json({ data: stored }, { status: response.status });
      }
      if (isMissingRoute(response.status)) continue;
      return Response.json(result ?? { error: "Announcement could not be published." }, {
        status: response.status,
      });
    } catch {
      /* backend unreachable — keep trying, then store locally */
    }
  }

  const stored = persistAnnouncement(payload, {}, authorName, initials);
  return Response.json({ data: stored }, { status: 201 });
}
