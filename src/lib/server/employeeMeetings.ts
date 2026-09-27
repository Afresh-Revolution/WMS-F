import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveApiRoot } from "@/lib/api/proxy";
import { unwrapList, unwrapRecord } from "@/lib/api/types";
import { parseAuthUser } from "@/lib/currentUser";

const STORE_FILE = join(process.cwd(), ".data", "employee-meetings.json");

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

function meetingKey(row: Record<string, unknown>) {
  return String(row.id ?? row._id ?? "")
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
      const key = meetingKey(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }
  return merged;
}

function clock24(value: string) {
  const text = value.trim();
  const ampm = text.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampm) {
    let hours = Number(ampm[1]) % 12;
    if (ampm[3].toLowerCase() === "pm") hours += 12;
    return `${String(hours).padStart(2, "0")}:${ampm[2]}`;
  }
  const hm = text.match(/^(\d{1,2}):(\d{2})/);
  if (hm) return `${hm[1].padStart(2, "0")}:${hm[2]}`;
  return "";
}

function combineStart(date: string, time: string) {
  const day = date.trim().slice(0, 10);
  if (!day) return "";
  const clock = clock24(time) || "09:00";
  return `${day}T${clock}:00`;
}

function durationMinutes(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  const hours = raw.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)$/i);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const mins = raw.match(/^(\d+)\s*(m|min|mins|minute|minutes)$/i);
  if (mins) return Number(mins[1]);
  return undefined;
}

function persistMeeting(
  body: Record<string, unknown>,
  payload: unknown = {},
  organizer = "Employee",
) {
  const data = unwrapRecord(payload);
  const now = new Date().toISOString();
  const title = String(body.title ?? data.title ?? "").trim();
  const date = String(body.date ?? body.startDate ?? data.date ?? data.startDate ?? "")
    .trim()
    .slice(0, 10);
  const time = String(body.time ?? data.time ?? "").trim();
  const start = String(
    data.startDate ??
      data.startsAt ??
      data.scheduledAt ??
      body.startDate ??
      combineStart(date, time),
  );
  const isVirtual = Boolean(
    data.isVirtual ?? data.virtual ?? body.isVirtual ?? body.virtual,
  );
  const location = String(
    data.location ?? body.location ?? (isVirtual ? "Virtual" : ""),
  ).trim();
  const minutes =
    durationMinutes(data.durationMinutes ?? body.durationMinutes) ??
    durationMinutes(data.duration ?? body.duration);
  const id =
    String(data.id ?? data._id ?? body.id ?? "") ||
    `emp-meeting-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const attendees = Array.isArray(data.attendees)
    ? data.attendees
    : Array.isArray(body.attendees)
      ? body.attendees
      : organizer
        ? [{ name: organizer }]
        : [];

  const record: Record<string, unknown> = {
    ...body,
    ...data,
    id,
    title,
    date: date || start.slice(0, 10),
    startDate: start,
    scheduledAt: start,
    startsAt: start,
    time: time || clock24(start) || "",
    duration: String(data.duration ?? body.duration ?? (minutes ? `${minutes} minutes` : "")),
    ...(minutes ? { durationMinutes: minutes } : {}),
    location,
    meetingUrl: String(data.meetingUrl ?? body.meetingUrl ?? (isVirtual ? location : "")),
    type: String(data.type ?? body.type ?? (isVirtual ? "virtual" : "in-person")),
    meetingType: String(
      data.meetingType ?? body.meetingType ?? (isVirtual ? "virtual" : "in-person"),
    ),
    isVirtual,
    virtual: isVirtual,
    status: String(data.status ?? body.status ?? "upcoming"),
    category: String(data.category ?? body.category ?? "Upcoming"),
    agenda: String(data.agenda ?? body.agenda ?? ""),
    notes: String(data.notes ?? body.notes ?? body.agenda ?? ""),
    description: String(data.description ?? body.description ?? body.agenda ?? ""),
    attendees,
    attendeeCount: attendees.length,
    organizer,
    organiser: organizer,
    createdAt: String(data.createdAt ?? body.createdAt ?? now),
    updatedAt: now,
  };

  const others = readStore().filter((row) => meetingKey(row) !== meetingKey(record));
  writeStore([record, ...others]);
  return record;
}

export async function listEmployeeMeetings(request: Request) {
  const results = await Promise.allSettled([
    backendJson(request, "/employee/meetings"),
    backendJson(request, "/employee/schedule"),
    backendJson(request, "/meetings"),
  ]);

  const remote: unknown[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    if (result.value.response.ok) remote.push(result.value.payload);
  }

  return Response.json({ data: mergeRows([readStore(), ...remote]) }, { status: 200 });
}

export async function getEmployeeMeeting(request: Request, id: string) {
  const local = readStore().find((row) => meetingKey(row) === id.trim().toLowerCase());
  if (local) return Response.json({ data: local }, { status: 200 });

  const attempts = [`/employee/meetings/${id}`, `/meetings/${id}`];
  for (const path of attempts) {
    try {
      const { response, payload } = await backendJson(request, path);
      if (response.ok) return Response.json(payload ?? { data: null }, { status: 200 });
      if (isMissingRoute(response.status)) continue;
      return Response.json(payload ?? { error: "Meeting could not be loaded." }, {
        status: response.status,
      });
    } catch {
      /* try the next path */
    }
  }

  return Response.json(
    { error: { code: "NOT_FOUND", message: "Meeting was not found." } },
    { status: 404 },
  );
}

export async function createEmployeeMeeting(
  request: Request,
  body: Record<string, unknown>,
) {
  if (!request.headers.get("authorization")) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to create a meeting." } },
      { status: 401 },
    );
  }

  const title = String(body.title ?? "").trim();
  const date = String(body.date ?? body.startDate ?? "").trim();
  if (!title) {
    return Response.json(
      { error: { code: "TITLE_REQUIRED", message: "Enter a meeting title." } },
      { status: 400 },
    );
  }
  if (!date) {
    return Response.json(
      { error: { code: "DATE_REQUIRED", message: "Choose a date." } },
      { status: 400 },
    );
  }

  const author = authorFromRequest(request);
  const organizer = String(
    body.organizer ?? body.organiser ?? author?.name ?? "Employee",
  );
  const isVirtual = Boolean(body.isVirtual ?? body.virtual) ||
    String(body.type ?? body.meetingType ?? "").toLowerCase().includes("virtual");
  const payload = {
    ...body,
    title,
    date: date.slice(0, 10),
    startDate: String(body.startDate ?? combineStart(date, String(body.time ?? ""))),
    type: String(body.type ?? (isVirtual ? "virtual" : "in-person")),
    meetingType: String(body.meetingType ?? body.type ?? (isVirtual ? "virtual" : "in-person")),
    isVirtual,
    virtual: isVirtual,
    status: String(body.status ?? "upcoming"),
    organizer,
    organiser: organizer,
  };

  const attempts = ["/employee/meetings", "/meetings", "/employee/schedule"];

  for (const path of attempts) {
    try {
      const { response, payload: result } = await backendJson(request, path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const stored = persistMeeting(payload, result, organizer);
        return Response.json({ data: stored }, { status: response.status });
      }
      if (isMissingRoute(response.status)) continue;
      return Response.json(result ?? { error: "Meeting could not be created." }, {
        status: response.status,
      });
    } catch {
      /* backend unreachable — keep trying, then store locally */
    }
  }

  const stored = persistMeeting(payload, {}, organizer);
  return Response.json({ data: stored }, { status: 201 });
}

export async function updateEmployeeMeeting(
  request: Request,
  id: string,
  body: Record<string, unknown>,
) {
  if (!request.headers.get("authorization")) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to update a meeting." } },
      { status: 401 },
    );
  }

  const author = authorFromRequest(request);
  const organizer = String(
    body.organizer ?? body.organiser ?? author?.name ?? "Employee",
  );
  const payload = { ...body, id };

  const attempts = [`/employee/meetings/${id}`, `/meetings/${id}`];
  for (const path of attempts) {
    try {
      const { response, payload: result } = await backendJson(request, path, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const stored = persistMeeting(payload, result, organizer);
        return Response.json({ data: stored }, { status: response.status });
      }
      if (isMissingRoute(response.status)) continue;
      return Response.json(result ?? { error: "Meeting could not be updated." }, {
        status: response.status,
      });
    } catch {
      /* try the next path, then store locally */
    }
  }

  const existing = readStore().find((row) => meetingKey(row) === id.trim().toLowerCase());
  const stored = persistMeeting({ ...(existing ?? {}), ...payload, id }, {}, organizer);
  return Response.json({ data: stored }, { status: 200 });
}
