import { ApiError, apiRequest, buildQuery } from "./client";
import type { Id } from "./types";

export type SecretaryListParams = Record<string, unknown>;
export type SecretaryRecord = Record<string, unknown>;
export type SecretaryMutationBody = Record<string, unknown>;

function secretaryPath(path: string, query?: SecretaryListParams) {
  return `/secretary${path}${buildQuery(query)}`;
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function unwrapCollection(
  payload: unknown,
  keys: string[],
): SecretaryRecord[] {
  const value = unwrapData<unknown>(payload);
  if (Array.isArray(value)) return value as SecretaryRecord[];
  if (!value || typeof value !== "object") return [];
  const record = value as SecretaryRecord;
  for (const key of keys) {
    const collection = record[key];
    if (Array.isArray(collection)) return collection as SecretaryRecord[];
  }
  return [];
}

function get(path: string, query?: SecretaryListParams) {
  return apiRequest<unknown>(secretaryPath(path, query)).then(unwrapData);
}

function list(
  path: string,
  keys: string[],
  query?: SecretaryListParams,
) {
  return apiRequest<unknown>(secretaryPath(path, query)).then((payload) =>
    unwrapCollection(payload, keys),
  );
}

function mutate(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: SecretaryMutationBody,
) {
  return apiRequest<unknown>(secretaryPath(path), { method, body }).then(
    unwrapData,
  );
}

function isSecretaryOrgScopeError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  const payload = error.body;
  const code =
    payload && typeof payload === "object" && "error" in payload
      ? String(
          (payload as { error?: { code?: string } }).error?.code ?? "",
        )
      : "";
  return (
    code === "SECRETARY_ORGANIZATION_REQUIRED" ||
    /organization scope is required/i.test(error.message)
  );
}

async function withSharedMeetingFallback<T>(
  secretaryCall: () => Promise<T>,
  sharedCall: () => Promise<T> | T,
) {
  try {
    return await secretaryCall();
  } catch (error) {
    if (isSecretaryOrgScopeError(error)) {
      return await sharedCall();
    }
    throw error;
  }
}

function sharedMeetingBody(body: SecretaryMutationBody = {}) {
  const start = body.startAt ?? body.start_at ?? body.start;
  const end = body.endAt ?? body.end_at ?? body.end;
  const { departmentId: _departmentId, department_id: _department_id, ...rest } =
    body;
  return {
    ...rest,
    startAt: start,
    endAt: end,
    startTime: body.startTime ?? body.time,
    meetingLink: body.meetingLink ?? body.virtualLink,
  };
}

const LOCAL_TASKS_KEY = "wms_secretary_local_tasks";
const LOCAL_REMINDERS_KEY = "wms_secretary_local_reminders";

function readLocalRecords(key: string): SecretaryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SecretaryRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRecords(key: string, records: SecretaryRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(records));
}

function mergeLocalRecords(key: string, remote: SecretaryRecord[]) {
  const remoteIds = new Set(remote.map((item) => String(item.id)));
  return [
    ...remote,
    ...readLocalRecords(key).filter((item) => !remoteIds.has(String(item.id))),
  ];
}

function saveLocalRecord(key: string, record: SecretaryRecord) {
  const records = readLocalRecords(key);
  const index = records.findIndex((item) => String(item.id) === String(record.id));
  if (index >= 0) {
    records[index] = { ...records[index], ...record };
  } else {
    records.unshift(record);
  }
  writeLocalRecords(key, records);
  return records[index >= 0 ? index : 0];
}

function patchLocalRecord(key: string, id: Id, patch: SecretaryMutationBody) {
  const current =
    readLocalRecords(key).find((item) => String(item.id) === String(id)) ?? {
      id,
    };
  return saveLocalRecord(key, {
    ...current,
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  });
}

function newLocalId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}`;
}

async function firstWorking<T>(
  attempts: Array<() => Promise<T>>,
  fallbackMessage: string,
) {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 405 || error.status === 403)
      ) {
        continue;
      }
      throw error;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new ApiError(404, fallbackMessage);
}

export const secretaryApi = {
  getScope() {
    return get("/scope");
  },

  getDashboard(query?: SecretaryListParams) {
    return get("/dashboard", query);
  },

  getOverview(query?: SecretaryListParams) {
    return get("/dashboard", query);
  },

  attendance: {
    status() {
      return firstWorking(
        [
          () => get("/attendance/status"),
          () => apiRequest<unknown>("/attendance/me/status").then(unwrapData),
          () =>
            apiRequest<unknown>("/employee/attendance/status").then(unwrapData),
        ],
        "Attendance status was not found.",
      );
    },

    clockIn(body: SecretaryMutationBody = {}) {
      return firstWorking(
        [
          () => mutate("/attendance/clock-in", "POST", body),
          () =>
            apiRequest<unknown>("/attendance/clock-in", {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>("/employee/attendance/clock-in", {
              method: "POST",
              body,
            }).then(unwrapData),
          () => mutate("/attendance/check-in", "POST", body),
        ],
        "Clock-in API was not found.",
      );
    },

    clockOut(body: SecretaryMutationBody = {}) {
      return firstWorking(
        [
          () => mutate("/attendance/clock-out", "POST", body),
          () =>
            apiRequest<unknown>("/attendance/clock-out", {
              method: "POST",
              body,
            }).then(unwrapData),
          () =>
            apiRequest<unknown>("/employee/attendance/clock-out", {
              method: "POST",
              body,
            }).then(unwrapData),
          () => mutate("/attendance/check-out", "POST", body),
        ],
        "Clock-out API was not found.",
      );
    },
  },

  getEmploymentRecord(query?: SecretaryListParams) {
    return get("/employment-record", query);
  },

  listEmploymentDocuments(query?: SecretaryListParams) {
    return list(
      "/employment-record/documents",
      ["documents", "items", "records"],
      query,
    );
  },

  updateEmploymentRecord(body: SecretaryMutationBody) {
    return mutate("/employment-record", "PATCH", body);
  },

  replaceEmploymentRecord(body: SecretaryMutationBody) {
    return mutate("/employment-record", "PUT", body);
  },

  listEmailRequests(query?: SecretaryListParams) {
    return list("/email-requests", ["requests", "items", "records"], query);
  },

  createEmailRequest(body: SecretaryMutationBody) {
    return mutate("/email-requests", "POST", body);
  },

  listFailedEmailRequests(query?: SecretaryListParams) {
    return list(
      "/email-requests/failed",
      ["requests", "failed", "items", "records"],
      query,
    );
  },

  getEmailRequest(id: Id) {
    return get(`/email-requests/${id}`);
  },

  checkEmailAvailability(address: string) {
    return mutate("/email-requests/check-availability", "POST", {
      email: address,
      address,
    });
  },

  checkEmail(address: string) {
    return mutate("/email-requests/check-availability", "POST", {
      email: address,
      address,
    });
  },

  reviewEmailRequest(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/email-requests/${id}/review`, "PATCH", body);
  },

  approveEmailRequest(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/email-requests/${id}/approve`, "PATCH", body);
  },

  rejectEmailRequest(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/email-requests/${id}/reject`, "PATCH", body);
  },

  returnEmailRequest(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/email-requests/${id}/return`, "PATCH", body);
  },

  assignEmail(id: Id, body: { email: string }) {
    return mutate(`/email-requests/${id}/create-email`, "POST", body);
  },

  cancelEmailRequest(id: Id) {
    return mutate(`/email-requests/${id}/cancel`, "PATCH");
  },

  createCompanyEmail(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/email-requests/${id}/create-email`, "POST", body);
  },

  retryEmail(id: Id) {
    return mutate(`/email-requests/${id}/retry`, "POST");
  },

  resolveEmailRequest(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/email-requests/${id}/resolve`, "PATCH", body);
  },

  listEmailDirectory(query?: SecretaryListParams) {
    return list("/company-emails", ["emails", "mailboxes", "items"], query);
  },

  listCompanyEmails(query?: SecretaryListParams) {
    return list("/company-emails", ["emails", "mailboxes", "items"], query);
  },

  getCompanyEmail(id: Id) {
    return get(`/company-emails/${id}`);
  },

  suspendMailbox(id: Id) {
    return mutate(`/company-emails/${id}/suspend`, "POST");
  },

  reactivateMailbox(id: Id) {
    return mutate(`/company-emails/${id}/reactivate`, "POST");
  },

  deactivateMailbox(id: Id) {
    return mutate(`/company-emails/${id}/request-deactivation`, "POST");
  },

  updateMailbox(id: Id, body: { email: string }) {
    return mutate(`/company-emails/${id}/address`, "PATCH", {
      address: body.email,
      email: body.email,
    });
  },

  getCalendar(query?: SecretaryListParams) {
    return get("/calendar", query);
  },

  listCalendar(query?: SecretaryListParams) {
    return list("/calendar", ["events", "items"], query);
  },

  listCalendarEvents(query?: SecretaryListParams) {
    return list("/calendar/events", ["events", "items", "records"], query);
  },

  createCalendarEvent(body: SecretaryMutationBody) {
    return mutate("/calendar/events", "POST", body);
  },

  getCalendarEvent(id: Id) {
    return get(`/calendar/events/${id}`);
  },

  updateCalendarEvent(id: Id, body: SecretaryMutationBody) {
    return mutate(`/calendar/events/${id}`, "PATCH", body);
  },

  replaceCalendarEvent(id: Id, body: SecretaryMutationBody) {
    return mutate(`/calendar/events/${id}`, "PUT", body);
  },

  deleteCalendarEvent(id: Id) {
    return mutate(`/calendar/events/${id}`, "DELETE");
  },

  listMeetings(query?: SecretaryListParams) {
    return withSharedMeetingFallback(
      () => list("/meetings", ["meetings", "items", "records"], query),
      () =>
        apiRequest<unknown>(`/meetings${buildQuery(query)}`).then((payload) =>
          unwrapCollection(payload, ["meetings", "items", "records"]),
        ),
    );
  },

  createMeeting(body: SecretaryMutationBody) {
    return withSharedMeetingFallback(
      () => mutate("/meetings", "POST", body),
      () =>
        apiRequest<unknown>("/meetings", {
          method: "POST",
          body: sharedMeetingBody(body),
        }).then(unwrapData),
    );
  },

  listTodayMeetings(query?: SecretaryListParams) {
    return list("/meetings/today", ["meetings", "items", "records"], query);
  },

  listUpcomingMeetings(query?: SecretaryListParams) {
    return list("/meetings/upcoming", ["meetings", "items", "records"], query);
  },

  getMeeting(id: Id) {
    return withSharedMeetingFallback(
      () => get(`/meetings/${id}`),
      () => apiRequest<unknown>(`/meetings/${id}`).then(unwrapData),
    );
  },

  updateMeeting(id: Id, body: SecretaryMutationBody) {
    return mutate(`/meetings/${id}`, "PATCH", body);
  },

  replaceMeeting(id: Id, body: SecretaryMutationBody) {
    return mutate(`/meetings/${id}`, "PUT", body);
  },

  rescheduleMeeting(id: Id, body: SecretaryMutationBody) {
    return mutate(`/meetings/${id}/reschedule`, "PATCH", body);
  },

  cancelMeeting(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/meetings/${id}/cancel`, "PATCH", body);
  },

  addMeetingAttendees(id: Id, body: SecretaryMutationBody) {
    return mutate(`/meetings/${id}/attendees`, "POST", body);
  },

  removeMeetingAttendee(id: Id, userId: Id) {
    return mutate(`/meetings/${id}/attendees/${userId}`, "DELETE");
  },

  scheduleMeetingReminders(id: Id, body: SecretaryMutationBody) {
    return mutate(`/meetings/${id}/reminders`, "POST", body);
  },

  listTasks(query?: SecretaryListParams) {
    return withSharedMeetingFallback(
      async () =>
        mergeLocalRecords(
          LOCAL_TASKS_KEY,
          await list("/tasks", ["tasks", "items", "records"], query),
        ),
      () => readLocalRecords(LOCAL_TASKS_KEY),
    );
  },

  createTask(body: SecretaryMutationBody) {
    return withSharedMeetingFallback(
      () => mutate("/tasks", "POST", body),
      () =>
        saveLocalRecord(LOCAL_TASKS_KEY, {
          id: newLocalId("local-task"),
          ...body,
          status: body.status || "TODO",
          createdAt: new Date().toISOString(),
        }),
    );
  },

  listOverdueTasks(query?: SecretaryListParams) {
    return list("/tasks/overdue", ["tasks", "items", "records"], query);
  },

  getTask(id: Id) {
    return get(`/tasks/${id}`);
  },

  updateTask(id: Id, body: SecretaryMutationBody) {
    return withSharedMeetingFallback(
      () => mutate(`/tasks/${id}`, "PATCH", body),
      () => patchLocalRecord(LOCAL_TASKS_KEY, id, body),
    );
  },

  replaceTask(id: Id, body: SecretaryMutationBody) {
    return mutate(`/tasks/${id}`, "PUT", body);
  },

  completeTask(id: Id, body: SecretaryMutationBody = {}) {
    return withSharedMeetingFallback(
      () => mutate(`/tasks/${id}/complete`, "PATCH", body),
      () => patchLocalRecord(LOCAL_TASKS_KEY, id, { ...body, status: "COMPLETED" }),
    );
  },

  listReminders(query?: SecretaryListParams) {
    return withSharedMeetingFallback(
      async () =>
        mergeLocalRecords(
          LOCAL_REMINDERS_KEY,
          await list("/reminders", ["reminders", "items", "records"], query),
        ),
      () => readLocalRecords(LOCAL_REMINDERS_KEY),
    );
  },

  createReminder(body: SecretaryMutationBody) {
    return withSharedMeetingFallback(
      () => mutate("/reminders", "POST", body),
      () =>
        saveLocalRecord(LOCAL_REMINDERS_KEY, {
          id: newLocalId("local-reminder"),
          ...body,
          status: body.status || "PENDING",
          createdAt: new Date().toISOString(),
        }),
    );
  },

  listUpcomingReminders(query?: SecretaryListParams) {
    return list(
      "/reminders/upcoming",
      ["reminders", "items", "records"],
      query,
    );
  },

  getReminder(id: Id) {
    return get(`/reminders/${id}`);
  },

  updateReminder(id: Id, body: SecretaryMutationBody) {
    return withSharedMeetingFallback(
      () => mutate(`/reminders/${id}`, "PATCH", body),
      () => patchLocalRecord(LOCAL_REMINDERS_KEY, id, body),
    );
  },

  replaceReminder(id: Id, body: SecretaryMutationBody) {
    return mutate(`/reminders/${id}`, "PUT", body);
  },

  deleteReminder(id: Id) {
    return mutate(`/reminders/${id}`, "DELETE");
  },

  cancelReminder(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/reminders/${id}/cancel`, "PATCH", body);
  },

  listNotifications(query?: SecretaryListParams) {
    return list("/notifications", ["notifications", "items", "records"], query);
  },

  markNotificationRead(id: Id) {
    return mutate(`/notifications/${id}/read`, "PATCH");
  },

  listAuditLogs(query?: SecretaryListParams) {
    return list("/audit-logs", ["logs", "auditLogs", "items", "records"], query);
  },
};
