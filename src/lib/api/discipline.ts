import { ApiError, apiRequest, buildQuery } from "./client";

export type DisciplinaryRecordInput = {
  employeeId: string;
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

export function listDisciplinaryRecords(params?: Record<string, unknown>) {
  const query = buildQuery(params);
  return firstSuccessful(
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
}

export function createDisciplinaryRecord(input: DisciplinaryRecordInput) {
  const employeeId = input.employeeId.trim();
  if (!employeeId) {
    throw new ApiError(400, "Choose an employee from the live list.");
  }
  const body = disciplineWriteBody(input);
  return firstSuccessful(
    [
      () =>
        apiRequest("/manager/discipline", { method: "POST", body }),
      () =>
        apiRequest("/super-admin/discipline", { method: "POST", body }),
      () =>
        apiRequest("/api/super-admin/discipline", {
          method: "POST",
          body,
          root: true,
        }),
      () => apiRequest("/hr/discipline", { method: "POST", body }),
      () =>
        apiRequest("/super-admin/hr/discipline", { method: "POST", body }),
      () => apiRequest("/discipline", { method: "POST", body }),
    ],
    "Could not create the disciplinary record. Choose a live employee and try again.",
  );
}
