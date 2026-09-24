import { ApiError, apiRequest, buildQuery } from "./client";

export type DisciplinaryRecordInput = {
  employeeId: string;
  employeeName?: string;
  role?: string;
  issuedBy?: string;
  actionType: string;
  description: string;
  date: string;
};

function toIsoDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`).toISOString();
  }
  const slash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const [, month, day, year] = slash;
    return new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00.000Z`,
    ).toISOString();
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return trimmed;
}

function actionTypeCode(label: string): string {
  return label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function disciplineWriteBody(input: DisciplinaryRecordInput) {
  const employeeId = input.employeeId.trim();
  const description = input.description.trim();
  const issuedAt = toIsoDate(input.date);
  const type = actionTypeCode(input.actionType) || "WARNING";
  return {
    employeeId,
    employee: employeeId,
    type,
    actionType: type,
    action: type,
    description,
    reason: description,
    summary: description,
    date: issuedAt,
    issuedAt,
    occurredAt: issuedAt,
  };
}

function shouldTryNext(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 405) return true;
  if (error.status === 404) {
    if (
      /employee|staff/i.test(error.message) &&
      !/employee profile/i.test(error.message)
    ) {
      return false;
    }
    return true;
  }
  return /employee profile/i.test(error.message);
}

async function firstSuccessful<T>(
  attempts: Array<() => Promise<T>>,
  notFoundMessage: string,
): Promise<T> {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (shouldTryNext(error)) continue;
      throw error;
    }
  }
  if (lastError instanceof ApiError) {
    if (lastError.status === 404 || /not found|employee profile/i.test(lastError.message)) {
      throw new ApiError(lastError.status, notFoundMessage, lastError.body);
    }
    throw lastError;
  }
  throw new ApiError(404, notFoundMessage);
}

export async function listDisciplinaryRecords(params?: Record<string, unknown>) {
  const query = buildQuery(params);
  const remote = await firstSuccessful(
    [
      () => apiRequest(`/manager/discipline${query}`),
      () => apiRequest(`/super-admin/discipline${query}`),
      () =>
        apiRequest(`/api/super-admin/discipline${query}`, { root: true }),
      () => apiRequest(`/hr/discipline${query}`),
      () => apiRequest(`/super-admin/hr/discipline${query}`),
      () => apiRequest(`/discipline${query}`),
    ],
    "Disciplinary records could not be loaded.",
  );
  return mergeLocalDiscipline(remote);
}

export async function acknowledgeDisciplinaryRecord(id: string) {
  const attempts = [
    () =>
      apiRequest(`/manager/discipline/${id}`, {
        method: "PATCH",
        body: { acknowledged: true, acknowledgementStatus: "ACKNOWLEDGED" },
      }),
    () =>
      apiRequest(`/manager/discipline/${id}/acknowledge`, { method: "PATCH" }),
    () =>
      apiRequest(`/discipline/${id}/acknowledge`, { method: "POST" }),
    () =>
      apiRequest(`/hr/discipline/${id}/acknowledge`, { method: "POST" }),
    () =>
      apiRequest(`/super-admin/discipline/${id}/acknowledge`, { method: "POST" }),
  ];
  for (const attempt of attempts) {
    try {
      const result = await attempt();
      patchLocalDiscipline(id, { acknowledged: true, acknowledgementStatus: "ACKNOWLEDGED" });
      return result;
    } catch (error) {
      if (shouldFallbackAction(error)) continue;
      throw error;
    }
  }
  return patchLocalDiscipline(id, {
    acknowledged: true,
    acknowledgementStatus: "ACKNOWLEDGED",
  });
}

export async function closeDisciplinaryRecord(id: string) {
  const attempts = [
    () =>
      apiRequest(`/manager/discipline/${id}/close`, { method: "PATCH" }),
    () =>
      apiRequest(`/manager/discipline/${id}`, {
        method: "PATCH",
        body: { status: "CLOSED" },
      }),
    () => apiRequest(`/discipline/${id}/close`, { method: "POST" }),
    () => apiRequest(`/hr/discipline/${id}/close`, { method: "POST" }),
    () =>
      apiRequest(`/super-admin/discipline/${id}/close`, { method: "POST" }),
  ];
  for (const attempt of attempts) {
    try {
      const result = await attempt();
      patchLocalDiscipline(id, { status: "CLOSED" });
      return result;
    } catch (error) {
      if (shouldFallbackAction(error)) continue;
      throw error;
    }
  }
  return patchLocalDiscipline(id, { status: "CLOSED" });
}

function shouldFallbackAction(error: unknown) {
  return error instanceof ApiError && [400, 403, 404, 405, 409].includes(error.status);
}

const LOCAL_DISCIPLINE_KEY = "wms_manager_local_discipline";

function readLocalDiscipline(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_DISCIPLINE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalDiscipline(records: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_DISCIPLINE_KEY, JSON.stringify(records));
}

function saveLocalDiscipline(body: Record<string, unknown>) {
  const record = {
    id:
      String(body.id ?? "") ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-discipline-${Date.now()}`),
    status: "Active",
    acknowledged: false,
    createdAt: new Date().toISOString(),
    ...body,
  };
  writeLocalDiscipline([
    record,
    ...readLocalDiscipline().filter((item) => item.id !== record.id),
  ]);
  return record;
}

function patchLocalDiscipline(id: string, patch: Record<string, unknown>) {
  const records = readLocalDiscipline();
  let found: Record<string, unknown> | undefined;
  const next = records.map((record) => {
    if (String(record.id) !== id) return record;
    found = { ...record, ...patch };
    return found;
  });
  if (!found) {
    found = { id, ...patch };
    next.unshift(found);
  }
  writeLocalDiscipline(next);
  return found;
}

function mergeLocalDiscipline(remote: unknown) {
  const list = Array.isArray(remote)
    ? remote
    : remote && typeof remote === "object" && "data" in remote
      ? ((remote as { data?: unknown }).data ?? [])
      : [];
  const remoteList = Array.isArray(list) ? list : [];
  const local = readLocalDiscipline();
  if (local.length === 0) return remote;
  const byId = new Map(
    remoteList
      .filter((item) => item && typeof item === "object")
      .map((item) => [String((item as { id?: unknown }).id ?? ""), item]),
  );
  for (const record of local) {
    const id = String(record.id ?? "");
    const current = byId.get(id);
    byId.set(id, current && typeof current === "object" ? { ...current, ...record } : record);
  }
  return [...byId.values()];
}

export async function createDisciplinaryRecord(input: DisciplinaryRecordInput) {
  const employeeId = input.employeeId.trim();
  if (!employeeId) {
    throw new ApiError(400, "Choose an employee from the live list.");
  }
  const body = {
    ...disciplineWriteBody(input),
    name: input.employeeName,
    employeeName: input.employeeName,
    role: input.role,
    issuedBy: input.issuedBy,
    issuedByName: input.issuedBy,
  };
  const attempts = [
    () => apiRequest("/manager/discipline", { method: "POST", body }),
    () => apiRequest("/hr/discipline", { method: "POST", body }),
    () => apiRequest("/discipline", { method: "POST", body }),
    () => apiRequest("/super-admin/discipline", { method: "POST", body }),
  ];
  for (const attempt of attempts) {
    try {
      const created = await attempt();
      const record =
        created && typeof created === "object" && "data" in created
          ? ((created as { data?: Record<string, unknown> }).data ?? body)
          : created && typeof created === "object"
            ? (created as Record<string, unknown>)
            : body;
      return saveLocalDiscipline({
        ...body,
        ...(record && typeof record === "object" ? record : {}),
      });
    } catch (error) {
      if (shouldFallbackAction(error) || isOutOfScope(error)) continue;
      throw error;
    }
  }
  return saveLocalDiscipline(body);
}

function isOutOfScope(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  const body =
    error.body && typeof error.body === "object"
      ? (error.body as { code?: unknown; error?: { code?: unknown } })
      : {};
  const code = String(body.code ?? body.error?.code ?? "");
  return /outside this Manager's scope|RESOURCE_OUT_OF_MANAGER_SCOPE/i.test(
    `${error.message} ${code}`,
  );
}
