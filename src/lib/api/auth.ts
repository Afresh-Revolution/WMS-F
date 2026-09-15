import {
  apiRequest,
  buildQuery,
  clearTokens,
  extractErrorMessage,
  getSessionToken,
  setTokens,
  ApiError,
} from "./client";
import { cacheCurrentUserFromPayload } from "@/lib/currentUser";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: AuthUser;
  mfaRequired?: boolean;
  challengeToken?: string;
  data?: Record<string, unknown>;
};

const JWT_PATTERN = /^eyJ[\w-]*\.[\w-]*\.[\w-]*$/i;

function readTokenField(
  source: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function findJwtDeep(value: unknown, depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return "";

  if (typeof value === "string" && JWT_PATTERN.test(value.trim())) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJwtDeep(item, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const found = findJwtDeep(nested, depth + 1);
      if (found) return found;
    }
  }

  return "";
}

function storeAuthTokens(response: LoginResponse) {
  const root = response as Record<string, unknown>;
  const nested =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : {};
  const tokenBucket =
    nested.tokens && typeof nested.tokens === "object"
      ? (nested.tokens as Record<string, unknown>)
      : {};
  const sessionBucket =
    nested.session && typeof nested.session === "object"
      ? (nested.session as Record<string, unknown>)
      : {};
  const authBucket =
    nested.auth && typeof nested.auth === "object"
      ? (nested.auth as Record<string, unknown>)
      : {};

  const accessKeys = [
    "accessToken",
    "access_token",
    "access",
    "token",
    "jwt",
  ];
  const refreshKeys = ["refreshToken", "refresh_token", "refresh"];

  const access =
    readTokenField(root, accessKeys) ||
    readTokenField(nested, accessKeys) ||
    readTokenField(tokenBucket, accessKeys) ||
    readTokenField(sessionBucket, accessKeys) ||
    readTokenField(authBucket, accessKeys) ||
    findJwtDeep(response);

  const refresh =
    readTokenField(root, refreshKeys) ||
    readTokenField(nested, refreshKeys) ||
    readTokenField(tokenBucket, refreshKeys) ||
    readTokenField(sessionBucket, refreshKeys) ||
    readTokenField(authBucket, refreshKeys);

  if (access) {
    setTokens(access, refresh || undefined);
  }

  cacheCurrentUserFromPayload(response);
}

function assertLoginSucceeded(
  response: LoginResponse & { success?: boolean; message?: string },
) {
  if (response.success === false) {
    throw new ApiError(
      401,
      extractErrorMessage(response, "Invalid email or password."),
      response,
    );
  }

  storeAuthTokens(response);

  if (!getSessionToken()) {
    throw new ApiError(
      401,
      "Sign in succeeded but no access token was returned. Contact support if this continues.",
      response,
    );
  }
}

export type BootstrapPayload = {
  email: string;
  password: string;
  name?: string;
};

export type BootstrapStatus = {
  complete?: boolean;
  bootstrapped?: boolean;
};

export const authApi = {
  bootstrapStatus: () =>
    apiRequest<BootstrapStatus>("/api/superadmin/bootstrap/status", {
      auth: false,
      root: true,
    }),

  bootstrap: async (body: BootstrapPayload) => {
    const response = await apiRequest<LoginResponse>("/api/superadmin/bootstrap", {
      method: "POST",
      body,
      auth: false,
      root: true,
    });
    storeAuthTokens(response);
    return response;
  },

  login: async (body: LoginPayload) => {
    const response = await apiRequest<
      LoginResponse & { success?: boolean; message?: string }
    >("/api/superadmin/login", {
      method: "POST",
      body,
      auth: false,
      root: true,
    });
    assertLoginSucceeded(response);
    return response;
  },

  verifyMfa: async (body: { code: string; challengeToken?: string }) => {
    const response = await apiRequest<LoginResponse>("/auth/mfa/verify", {
      method: "POST",
      body,
      auth: false,
    });
    storeAuthTokens(response);
    return response;
  },

  refresh: async (refreshToken?: string) => {
    const response = await apiRequest<LoginResponse>("/api/superadmin/refresh", {
      method: "POST",
      body: refreshToken ? { refreshToken } : {},
      auth: false,
      root: true,
    });
    storeAuthTokens(response);
    return response;
  },

  logout: async () => {
    try {
      await apiRequest<void>("/api/superadmin/logout", { method: "POST", root: true });
    } finally {
      clearTokens();
    }
  },

  me: () => apiRequest<AuthUser>("/api/superadmin/me", { root: true }),

  superAdminMe: () => apiRequest<AuthUser>("/api/superadmin/me", { root: true }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiRequest<void>("/api/superadmin/change-password", {
      method: "POST",
      body,
      root: true,
    }),

  forgotPassword: (body: { email: string }) =>
    apiRequest<void>("/auth/forgot-password", {
      method: "POST",
      body,
      auth: false,
    }),

  resetPassword: (body: { token: string; password: string }) =>
    apiRequest<void>("/auth/reset-password", {
      method: "POST",
      body,
      auth: false,
    }),

  sessions: () =>
    apiRequest<Record<string, unknown>[]>("/auth/sessions"),

  revokeSession: (id: string) =>
    apiRequest<void>(`/auth/sessions/${id}`, { method: "DELETE" }),

  /** @deprecated Use top-level authApi methods — all point to /api/superadmin */
  legacy: {
    bootstrapStatus: () => authApi.bootstrapStatus(),
    bootstrap: (body: BootstrapPayload) => authApi.bootstrap(body),
    login: (body: LoginPayload) => authApi.login(body),
    refresh: (refreshToken?: string) => authApi.refresh(refreshToken),
    logout: () => authApi.logout(),
    me: () => authApi.me(),
    changePassword: (body: {
      currentPassword: string;
      newPassword: string;
    }) => authApi.changePassword(body),
    patchPassword: (body: { password: string }) =>
      apiRequest<void>("/api/superadmin/password", {
        method: "PATCH",
        body,
        root: true,
      }),
  },
};

export const healthApi = {
  liveness: () =>
    apiRequest<Record<string, unknown>>("/health", { auth: false, root: true }),

  database: () =>
    apiRequest<Record<string, unknown>>("/health/database", {
      auth: false,
      root: true,
    }),

  redis: () =>
    apiRequest<Record<string, unknown>>("/health/redis", {
      auth: false,
      root: true,
    }),

  email: () =>
    apiRequest<Record<string, unknown>>("/health/email", {
      auth: false,
      root: true,
    }),

  storage: () =>
    apiRequest<Record<string, unknown>>("/health/storage", {
      auth: false,
      root: true,
    }),

  v1Summary: () => apiRequest<Record<string, unknown>>("/health"),
};

export const dashboardApi = {
  overview: () => apiRequest<Record<string, unknown>>("/dashboard/overview"),

  superAdmin: () =>
    apiRequest<Record<string, unknown>>("/dashboard/super-admin"),
};

export const searchApi = {
  search: (q: string) =>
    apiRequest<Record<string, unknown>>(`/search${buildQuery({ q })}`),

  globalSearch: (q: string) =>
    apiRequest<Record<string, unknown>>(`/global-search${buildQuery({ q })}`),
};
