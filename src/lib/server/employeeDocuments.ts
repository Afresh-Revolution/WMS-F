import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveApiRoot } from "@/lib/api/proxy";
import { unwrapRecord } from "@/lib/api/types";
import { parseAuthUser } from "@/lib/currentUser";

const STORE_FILE = join(process.cwd(), ".data", "employee-documents.json");
const FILES_DIR = join(process.cwd(), ".data", "employee-documents");
const MAX_BYTES = 15 * 1024 * 1024;

const CATEGORIES = ["Policy", "HR", "Finance", "Reports", "Compliance"] as const;
const ACCESS_LEVELS = ["All staff", "Managers", "HR only", "Restricted"] as const;

function backendUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiRoot()}/api/v1${normalized}`;
}

async function backendJson(request: Request, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  if (init.body && !headers.has("content-type") && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(backendUrl(path), {
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
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
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

function documentKey(row: Record<string, unknown>) {
  return String(row.id ?? row._id ?? "")
    .trim()
    .toLowerCase();
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeCategory(value: unknown) {
  const raw = text(value);
  const exact = CATEGORIES.find((item) => item.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  if (/polic/i.test(raw)) return "Policy";
  if (/\bhr\b|human/i.test(raw)) return "HR";
  if (/financ/i.test(raw)) return "Finance";
  if (/report/i.test(raw)) return "Reports";
  if (/compli/i.test(raw)) return "Compliance";
  return raw || "Policy";
}

function normalizeAccess(value: unknown) {
  const raw = text(value).toLowerCase().replace(/[_-]+/g, " ");
  if (!raw || raw === "all staff" || raw === "everyone" || raw === "public" || raw === "company") {
    return "All staff";
  }
  const exact = ACCESS_LEVELS.find((item) => item.toLowerCase() === raw);
  if (exact) return exact;
  if (raw.includes("manager")) return "Managers";
  if (raw.includes("hr")) return "HR only";
  return "Restricted";
}

function fileKind(name: string, mime: string) {
  const raw = `${name} ${mime}`.toLowerCase();
  if (raw.includes("pdf")) return "PDF";
  if (raw.includes("png") || raw.includes("jpeg") || raw.includes("jpg") || raw.includes("webp")) {
    return "Image";
  }
  if (raw.includes("sheet") || raw.includes("csv") || raw.includes("xls")) return "Sheet";
  if (raw.includes("doc")) return "DOCX";
  if (raw.includes("ppt")) return "Slides";
  return "File";
}

function extensionFor(name: string, mime: string) {
  const fromName = name.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("word")) return "docx";
  if (mime.includes("sheet") || mime.includes("excel")) return "xlsx";
  return "bin";
}

function presentLocal(row: Record<string, unknown>) {
  const id = text(row.id);
  const rest = { ...row };
  delete rest.storageName;
  return {
    ...rest,
    id,
    fileUrl: `/api/v1/employee/documents/${id}/file`,
    local: true,
  };
}

function presentRemote(row: Record<string, unknown>) {
  const id = text(row.id ?? row._id ?? row.documentId);
  const name = text(row.name ?? row.title ?? row.documentName ?? row.fileName);
  const mime = text(row.mimeType ?? row.contentType ?? row.fileType);
  const fileName = text(row.fileName ?? row.filename ?? name);
  const access = normalizeAccess(
    row.access ?? row.visibility ?? row.audience ?? row.audienceType,
  );
  return {
    ...row,
    id,
    name,
    title: name,
    category: normalizeCategory(row.category ?? row.documentType ?? row.type),
    fileType: fileKind(fileName, mime),
    mimeType: mime,
    size: Number(row.size ?? row.fileSize ?? row.bytes ?? 0) || 0,
    access,
    restricted: access !== "All staff",
    downloads: Number(row.downloads ?? row.downloadCount ?? row.download_count ?? 0) || 0,
    updatedAt: text(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at),
    createdAt: text(row.createdAt ?? row.created_at ?? row.updatedAt),
    uploadedById: text(row.uploadedById ?? row.ownerId ?? row.userId ?? row.createdBy),
    fileUrl: text(row.fileUrl ?? row.file_url ?? row.url ?? row.downloadUrl),
    local: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function documentRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  const data = isRecord(payload.data) ? payload.data : null;
  for (const key of ["documents", "files", "items"]) {
    const source = data?.[key] ?? payload[key];
    if (Array.isArray(source)) return source.filter(isRecord);
  }
  if (Array.isArray(payload.data)) return payload.data.filter(isRecord);
  return [];
}

function findLocal(id: string) {
  const key = id.trim().toLowerCase();
  return readStore().find((row) => documentKey(row) === key) ?? null;
}

export async function listEmployeeDocuments(request: Request) {
  const remotePaths = ["/employee/documents", "/documents", "/employee/records"];
  const remote: unknown[] = [];
  const results = await Promise.allSettled(
    remotePaths.map((path) => backendJson(request, path)),
  );
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value.response.ok) continue;
    remote.push(result.value.payload);
  }

  const seen = new Set<string>();
  const documents: Record<string, unknown>[] = [];
  for (const row of readStore()) {
    const key = documentKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    documents.push(presentLocal(row));
  }
  for (const source of remote) {
    for (const row of documentRows(source)) {
      const presented = presentRemote(row);
      const key = documentKey(presented);
      if (!key || seen.has(key) || !presented.name) continue;
      seen.add(key);
      documents.push(presented);
    }
  }

  return Response.json({ data: documents }, { status: 200 });
}

export async function createEmployeeDocument(request: Request) {
  if (!request.headers.get("authorization")) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to upload a document." } },
      { status: 401 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: { code: "FILE_REQUIRED", message: "Choose a file to upload." } },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return Response.json(
      {
        error: {
          code: "FILE_TOO_LARGE",
          message: "Files must be 15 MB or smaller.",
        },
      },
      { status: 400 },
    );
  }

  const fallbackName = file.name.replace(/\.[^.]+$/, "").trim() || "Document";
  const name = text(form?.get("name") ?? form?.get("title")) || fallbackName;
  const category = normalizeCategory(form?.get("category"));
  const access = normalizeAccess(form?.get("access"));
  const author = authorFromRequest(request);

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadFile = () =>
    new File([bytes], file.name, { type: file.type || "application/octet-stream" });

  for (const path of ["/employee/documents", "/documents"]) {
    const outbound = new FormData();
    outbound.set("name", name);
    outbound.set("title", name);
    outbound.set("category", category);
    outbound.set("access", access);
    outbound.set("file", uploadFile(), file.name);
    try {
      const { response, payload } = await backendJson(request, path, {
        method: "POST",
        body: outbound,
      });
      if (response.ok) {
        const data = unwrapRecord(payload);
        return Response.json(
          { data: data.id || data._id ? presentRemote(data) : payload },
          { status: 201 },
        );
      }
      if (isMissingRoute(response.status)) continue;
      return Response.json(payload ?? { error: "Document could not be uploaded." }, {
        status: response.status,
      });
    } catch {
      /* save locally when the backend cannot be reached */
    }
  }

  const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const extension = extensionFor(file.name, file.type);
  const storageName = `${id}.${extension}`;
  mkdirSync(FILES_DIR, { recursive: true });
  writeFileSync(join(FILES_DIR, storageName), bytes);

  const now = new Date().toISOString();
  const record: Record<string, unknown> = {
    id,
    name,
    title: name,
    category,
    fileType: fileKind(file.name, file.type),
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
    extension,
    size: file.size,
    access,
    restricted: access !== "All staff",
    downloads: 0,
    storageName,
    uploadedById: author?.id ?? "",
    uploadedByName: author?.name ?? "",
    createdAt: now,
    updatedAt: now,
  };
  writeStore([record, ...readStore()]);
  return Response.json({ data: presentLocal(record) }, { status: 201 });
}

export async function readEmployeeDocumentFile(request: Request, id: string, download: boolean) {
  if (!request.headers.get("authorization")) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to open this document." } },
      { status: 401 },
    );
  }
  const row = findLocal(id);
  const storageName = text(row?.storageName);
  if (!row || !/^doc-[a-z0-9-]+\.[a-z0-9]+$/i.test(storageName)) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Document file was not found." } },
      { status: 404 },
    );
  }
  const filePath = join(FILES_DIR, storageName);
  if (!existsSync(filePath)) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "Document file was not found." } },
      { status: 404 },
    );
  }
  const bytes = readFileSync(filePath);
  const filename = text(row.fileName) || `${text(row.name) || "document"}.${text(row.extension) || "bin"}`;
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": text(row.mimeType) || "application/octet-stream",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${filename.replace(/"/g, "")}"`,
      "cache-control": "private, no-store",
    },
  });
}

export async function downloadEmployeeDocument(request: Request, id: string) {
  if (!request.headers.get("authorization")) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to download this document." } },
      { status: 401 },
    );
  }

  const rows = readStore();
  const index = rows.findIndex((row) => documentKey(row) === id.trim().toLowerCase());
  if (index >= 0) {
    const current = rows[index];
    const downloads = (Number(current.downloads) || 0) + 1;
    const next = { ...current, downloads, updatedAt: new Date().toISOString() };
    rows[index] = next;
    writeStore(rows);
    return Response.json({ data: presentLocal(next) }, { status: 200 });
  }

  for (const path of [
    `/employee/documents/${id}/download`,
    `/documents/${id}/download`,
  ]) {
    try {
      const { response, payload } = await backendJson(request, path, { method: "POST" });
      if (response.ok) return Response.json(payload ?? { data: { id } }, { status: 200 });
      if (isMissingRoute(response.status)) continue;
      return Response.json(payload ?? { error: "Download could not be recorded." }, {
        status: response.status,
      });
    } catch {
      /* try the next path */
    }
  }

  return Response.json(
    { error: { code: "NOT_FOUND", message: "Document was not found." } },
    { status: 404 },
  );
}
