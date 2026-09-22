const API_ROOT_URL = (
  process.env.NEXT_PUBLIC_API_ROOT_URL?.trim() ||
  "https://wms-b.onrender.com"
).replace(/\/$/, "");
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

const ACCESS_TOKEN_KEY = "wms_access_token";
const REFRESH_TOKEN_KEY = "wms_refresh_token";
export const CURRENT_USER_KEY = "wms_current_user";
export const WORKSPACE_KEY = "wms_workspace";

function envAccessToken(): string | null {
  const token = process.env.NEXT_PUBLIC_JWT_TOKEN?.trim();
  if (!token) return null;
  // Only use env token if it looks like a JWT (three base64 segments)
  if (!/^eyJ[\w-]*\.[\w-]*\.[\w-]*$/i.test(token)) {
    return null;
  }
  return token;
}

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Token from a real sign-in (localStorage only). Used for login redirects. */
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Token for API Authorization headers.
 * Prefers a signed-in session; falls back to NEXT_PUBLIC_JWT_TOKEN if set.
 * Env JWT must not be used for "are you logged in?" checks.
 */
export function getAccessToken(): string | null {
  return getSessionToken() ?? envAccessToken();
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(WORKSPACE_KEY);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  /** Use root API path without /api/v1 prefix (e.g. /health, /api/superadmin) */
  root?: boolean;
};

function resolveUrl(path: string, root?: boolean) {
  if (path.startsWith("http")) return path;
  if (root) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    // Browser: same-origin path so Next.js rewrites proxy to the backend
    if (typeof window !== "undefined") {
      return normalized;
    }
    return `${API_ROOT_URL}${normalized}`;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, root, headers, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(path, root), {
      ...rest,
      headers: requestHeaders,
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      `Cannot reach the API at ${API_ROOT_URL}. Check that the backend is running.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
    const message = extractErrorMessage(payload, response.statusText);
    const passwordChangeRequired = /password change required/i.test(message);
    if (
      response.status === 401 &&
      getSessionToken() &&
      !passwordChangeRequired
    ) {
      clearTokens();
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const signingOut = path === "/sign-out" || path.startsWith("/sign-out/");
        if (!signingOut && path !== "/") {
          window.location.assign("/");
        }
      }
    }
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

const ERROR_CODE_MESSAGES: Record<string, string> = {
  DEPARTMENT_NOT_FOUND:
    "That department was not found or is inactive. Pick a department from the list.",
  OUTSIDE_ATTENDANCE_LOCATION:
    "You are outside the approved work location.",
  STALE_LOCATION_READING: "Your GPS reading is too old. Try check-in again.",
  LOW_LOCATION_ACCURACY:
    "GPS accuracy is too low. Move to an open area and try again.",
  ATTENDANCE_NOT_OPEN: "Attendance is not open yet.",
  ATTENDANCE_CLOSED: "Attendance is closed for this schedule.",
  ALREADY_CHECKED_IN: "You have already checked in for this schedule today.",
  NO_ASSIGNED_ATTENDANCE_SCHEDULE:
    "No active attendance schedule is assigned to you.",
  NO_ASSIGNED_ATTENDANCE_LOCATION:
    "No active attendance location is assigned to you.",
  LOCATION_TIMESTAMP_REQUIRED: "A GPS timestamp is required.",
  INVALID_LATITUDE: "Latitude is out of range.",
  INVALID_LONGITUDE: "Longitude is out of range.",
  INVALID_LOCATION_ACCURACY: "GPS accuracy is missing or invalid.",
  INVALID_ATTENDANCE_RADIUS: "Location radius is outside the allowed range.",
  INVALID_SCHEDULE_TIME: "Schedule time must be in HH:mm format.",
  INVALID_TIMEZONE: "Timezone must be a valid IANA name.",
  ATTENDANCE_LOCATION_NAME_REQUIRED: "Location name is required.",
  ATTENDANCE_SCHEDULE_NAME_REQUIRED: "Schedule name is required.",
  EMPLOYEE_CHECK_IN_ROLE_REQUIRED: "This account cannot GPS check in.",
  ATTENDANCE_CHECK_IN_FORBIDDEN: "You do not have permission to check in.",
  NO_ACTIVE_EMPLOYEE_PROFILE:
    "Your employee profile is still being set up. Wait a few seconds and try again.",
  EMPLOYEE_PROFILE_REQUIRED:
    "Your employee profile is still being set up. Wait a few seconds and try again.",
  CHECK_IN_ACCOUNT_INACTIVE: "This account is not eligible to check in.",
  ATTENDANCE_MONITOR_FORBIDDEN: "You cannot monitor attendance records.",
  ATTENDANCE_MANAGE_FORBIDDEN:
    "You cannot manage attendance locations or schedules.",
  ATTENDANCE_SCOPE_REQUIRED:
    "Assign a branch, department, or employee before saving.",
  ATTENDANCE_SCOPE_FORBIDDEN: "That scope is outside your team.",
  ATTENDANCE_LOCATION_NOT_FOUND: "Attendance location was not found.",
  ATTENDANCE_SCHEDULE_NOT_FOUND: "Attendance schedule was not found.",
  ATTENDANCE_RECORD_NOT_FOUND: "Attendance record was not found.",
  HOD_NOT_FOUND: "That person is not a current user. Choose a live HOD.",
  EMPLOYEE_NOT_FOUND:
    "That employee was not found. Choose someone from the live employee list.",
  EMPLOYEE_ALREADY_EXISTS:
    "An employee with those details already exists. Refresh the directory to see them.",
  EMAIL_ALREADY_EXISTS:
    "An employee with that email already exists. Refresh the directory to see them.",
  DUPLICATE_EMAIL:
    "An employee with that email already exists. Refresh the directory to see them.",
  USER_ALREADY_EXISTS:
    "A user with that email already exists. Refresh the directory to see them.",
  MEETING_TYPE_NOT_FOUND:
    "Meeting type was not found. Create the meeting without a meeting type.",
  PASSWORD_CHANGE_REQUIRED:
    "Change your password before updating other account details.",
  ANNOUNCEMENT_REQUIRED_FIELDS: "Title and message are required.",
  ANNOUNCEMENT_AUDIENCE_REQUIRED: "Choose who should receive this announcement.",
  ANNOUNCEMENT_DEPARTMENT_REQUIRED: "Pick a department for this audience.",
  ANNOUNCEMENT_EMPLOYEE_REQUIRED: "Pick at least one employee for this audience.",
  ANNOUNCEMENT_ALREADY_PUBLISHED: "This announcement is already published.",
  ANNOUNCEMENT_NOT_PUBLISHABLE:
    "This announcement cannot be published in its current status.",
  ANNOUNCEMENT_NOT_SCHEDULABLE: "Only drafts can be scheduled.",
  ANNOUNCEMENT_SCHEDULE_REQUIRED: "A schedule date is required.",
  ANNOUNCEMENT_INVALID_SCHEDULE: "That schedule date is not valid.",
  ANNOUNCEMENT_SCHEDULE_IN_PAST: "Schedule a time in the future.",
  ANNOUNCEMENT_NOT_FOUND: "That announcement was not found.",
  LEAVE_TYPE_NOT_FOUND: "That leave type was not found. Choose a type from the list.",
  LEAVE_TYPE_INACTIVE: "That leave type is not active.",
  INVALID_LEAVE_DURATION:
    "Those dates have no working days. Choose a range that includes a weekday.",
  LEAVE_DATES_OVERLAP: "Those dates overlap an existing leave request.",
  LEAVE_ALREADY_ACTIVE:
    "This person already has pending or approved leave. Extend that request instead.",
  LEAVE_NOT_EXTENDABLE: "Only pending or approved leave can be extended.",
  LEAVE_EXTENSION_NOT_PENDING: "There is no pending leave extension to review.",
  INSUFFICIENT_LEAVE_BALANCE: "There is not enough leave balance for those dates.",
  NOTICE_REQUIRED: "This leave type needs more notice before the start date.",
  MAXIMUM_LEAVE_EXCEEDED: "That stretch is longer than the leave policy allows.",
  LEAVE_NOT_PENDING: "Only pending leave can be approved, rejected, or withdrawn.",
  LEAVE_NOT_APPROVED: "Only approved leave can be cancelled.",
  LEAVE_REQUEST_NOT_FOUND: "That leave request was not found.",
  REJECTION_REASON_REQUIRED: "A rejection reason is required.",
  ACTIVE_PLACEMENT_EXISTS:
    "This person already has an active NYSC or intern placement.",
  VENDOR_NAME_REQUIRED: "Enter a vendor name.",
  FULL_NAME_REQUIRED: "Enter the member's full name.",
  CATEGORY_NOT_FOUND: "Pick a category from the list.",
  SUPERVISOR_NOT_FOUND:
    "That supervisor was not found. Choose someone from the directory.",
  INVALID_PLACEMENT_DATES: "End date must be after the start date.",
  EXPENSE_LIMIT_EXCEEDED: "This claim is over the allowed expense limit.",
};

const GENERIC_ERROR_MESSAGES = new Set([
  "operation failed",
  "request failed",
  "error",
  "bad request",
]);

function isUsefulErrorMessage(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !GENERIC_ERROR_MESSAGES.has(trimmed.toLowerCase());
}

function friendlyForbiddenMessage(value: string): string | null {
  if (/^forbidden\.?$/i.test(value.trim())) {
    return "Access denied. You do not have permission to do that.";
  }
  return null;
}

function rewriteKnownApiMessage(value: string, code = ""): string {
  const trimmed = value.trim();
  if (
    /not linked to an employee/i.test(trimmed) ||
    /no active employee profile/i.test(trimmed)
  ) {
    return "Your employee profile is still being set up. Wait a few seconds and try again.";
  }
  if (/^not founded?\.?$/i.test(trimmed)) {
    return (
      (code && ERROR_CODE_MESSAGES[code]) ||
      "That record was not found. Pick a department, supervisor, or category from the list."
    );
  }
  const mapped = code ? ERROR_CODE_MESSAGES[code] : undefined;
  const isAllCaps =
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed) &&
    trimmed.length > 20;
  if (mapped && (isAllCaps || GENERIC_ERROR_MESSAGES.has(trimmed.toLowerCase()))) {
    return mapped;
  }
  return friendlyForbiddenMessage(trimmed) ?? trimmed;
}

/** Parse API error payloads (superadmin + /api/v1/auth formats). */
export function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    if (payload.toLowerCase().includes("internal server error")) {
      return "The API returned an internal server error. Check that the backend is running and configured correctly.";
    }
    return rewriteKnownApiMessage(payload);
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const nestedError = record.error;

    if (typeof nestedError === "object" && nestedError !== null) {
      const errObj = nestedError as Record<string, unknown>;
      const code = typeof errObj.code === "string" ? errObj.code : "";
      const details = errObj.details;

      if (code === "RATE_LIMIT_EXCEEDED") {
        const retryAfter =
          typeof details === "object" &&
          details !== null &&
          typeof (details as Record<string, unknown>).retryAfterSeconds ===
            "number"
            ? Math.ceil(
                (details as Record<string, unknown>).retryAfterSeconds as number,
              )
            : null;
        return retryAfter
          ? `Too many sign-in attempts. Please wait ${retryAfter} seconds and try again.`
          : "Too many sign-in attempts. Please wait a few minutes and try again.";
      }

      if (code === "CORS_ORIGIN_NOT_ALLOWED") {
        return "Unable to reach the sign-in service from this address. Use http://localhost:3000 or the deployed app URL.";
      }

      if (code === "FORBIDDEN" || code === "ACCESS_DENIED") {
        if (typeof details === "object" && details !== null) {
          const detailMessage = (details as Record<string, unknown>).message;
          if (isUsefulErrorMessage(detailMessage)) {
            return rewriteKnownApiMessage(detailMessage, code);
          }
        }
        return "Access denied. You do not have permission to do that.";
      }

      if (code && ERROR_CODE_MESSAGES[code]) {
        if (typeof details === "object" && details !== null) {
          const detailMessage = (details as Record<string, unknown>).message;
          if (
            isUsefulErrorMessage(detailMessage) &&
            detailMessage !== detailMessage.toUpperCase()
          ) {
            return rewriteKnownApiMessage(detailMessage, code);
          }
        }
        return ERROR_CODE_MESSAGES[code];
      }

      if (typeof details === "object" && details !== null) {
        const detailMessage = (details as Record<string, unknown>).message;
        if (isUsefulErrorMessage(detailMessage)) {
          return rewriteKnownApiMessage(detailMessage, code);
        }
      }
      if (isUsefulErrorMessage(errObj.message)) {
        return rewriteKnownApiMessage(errObj.message, code);
      }
    }

    if (isUsefulErrorMessage(nestedError)) {
      if (/unable to reach the backend api/i.test(nestedError)) {
        return "The backend could not be reached. Wait a few seconds and try again.";
      }
      return rewriteKnownApiMessage(nestedError);
    }

    const candidates = [record.detail, record.title, record.message];
    for (const candidate of candidates) {
      if (isUsefulErrorMessage(candidate)) {
        return rewriteKnownApiMessage(candidate);
      }
    }
  }

  if (fallback.toLowerCase().includes("internal server error")) {
    return "The API returned an internal server error. Check backend logs for details.";
  }

  if (responseLooksLikeAuthFailure(payload)) {
    return "Invalid email or password.";
  }

  if (fallback.toLowerCase() === "forbidden") {
    return "Access denied. Check your credentials and try again.";
  }

  if (
    fallback.toLowerCase() === "bad gateway" ||
    fallback.toLowerCase() === "service unavailable"
  ) {
    return "The sign-in service is temporarily unavailable. Please try again in a moment.";
  }

  if (
    fallback.toLowerCase().includes("internal server error") ||
    fallback.toLowerCase() === "internal server error"
  ) {
    return "The sign-in service returned an error. If this continues, redeploy the frontend on Render.";
  }

  if (/^not founded?\.?$/i.test(fallback.trim())) {
    return "That record was not found. Pick a department, supervisor, or category from the list.";
  }

  const lowerFallback = fallback.trim().toLowerCase();
  if (!lowerFallback || GENERIC_ERROR_MESSAGES.has(lowerFallback)) {
    return "Sign in failed. Check your email and password, then try again.";
  }

  return fallback;
}

function responseLooksLikeAuthFailure(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) return false;
  const record = payload as Record<string, unknown>;
  const nestedError = record.error;
  if (typeof nestedError !== "object" || nestedError === null) return false;
  const code = (nestedError as Record<string, unknown>).code;
  return code === "INVALID_CREDENTIALS";
}

export function buildQuery(params?: Record<string, unknown>) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
