import { apiRequest, buildQuery } from "./client";
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
    return list("/meetings", ["meetings", "items", "records"], query);
  },

  createMeeting(body: SecretaryMutationBody) {
    return mutate("/meetings", "POST", body);
  },

  listTodayMeetings(query?: SecretaryListParams) {
    return list("/meetings/today", ["meetings", "items", "records"], query);
  },

  listUpcomingMeetings(query?: SecretaryListParams) {
    return list("/meetings/upcoming", ["meetings", "items", "records"], query);
  },

  getMeeting(id: Id) {
    return get(`/meetings/${id}`);
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
    return list("/tasks", ["tasks", "items", "records"], query);
  },

  createTask(body: SecretaryMutationBody) {
    return mutate("/tasks", "POST", body);
  },

  listOverdueTasks(query?: SecretaryListParams) {
    return list("/tasks/overdue", ["tasks", "items", "records"], query);
  },

  getTask(id: Id) {
    return get(`/tasks/${id}`);
  },

  updateTask(id: Id, body: SecretaryMutationBody) {
    return mutate(`/tasks/${id}`, "PATCH", body);
  },

  replaceTask(id: Id, body: SecretaryMutationBody) {
    return mutate(`/tasks/${id}`, "PUT", body);
  },

  completeTask(id: Id, body: SecretaryMutationBody = {}) {
    return mutate(`/tasks/${id}/complete`, "PATCH", body);
  },

  listReminders(query?: SecretaryListParams) {
    return list("/reminders", ["reminders", "items", "records"], query);
  },

  createReminder(body: SecretaryMutationBody) {
    return mutate("/reminders", "POST", body);
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
    return mutate(`/reminders/${id}`, "PATCH", body);
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
