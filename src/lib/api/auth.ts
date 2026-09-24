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
import { cacheWorkspaceFromPayload } from "@/lib/workspace";

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
  keepMeSignedIn?: boolean;
};

export type LoginOptions = {
  forgotPasswordEnabled: boolean;
  keepMeSignedInEnabled: boolean;
  ssoEnabled: boolean;
};

/** Used until /auth/login-options ships, so the screen keeps its current UI. */
export const DEFAULT_LOGIN_OPTIONS: LoginOptions = {
  forgotPasswordEnabled: true,
  keepMeSignedInEnabled: true,
  ssoEnabled: true,
};

const LOGIN_OPTIONS_CACHE_KEY = "wms_login_options";
const LOGIN_OPTIONS_TTL_MS = 15 * 60 * 1000;
let loginOptionsInFlight: Promise<LoginOptions> | null = null;

function readCachedLoginOptions(): LoginOptions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LOGIN_OPTIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { expiresAt?: number; options?: LoginOptions };
    if (!parsed?.options || !parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      return null;
    }
    return parsed.options;
  } catch {
    return null;
  }
}

function writeCachedLoginOptions(options: LoginOptions) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      LOGIN_OPTIONS_CACHE_KEY,
      JSON.stringify({
        expiresAt: Date.now() + LOGIN_OPTIONS_TTL_MS,
        options,
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export type LoginResponse = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: AuthUser;
  workspace?: {
    roleKey?: string;
    homePath?: string;
    dashboardPath?: string;
  };
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
  cacheWorkspaceFromPayload(response);
}

function readFlag(
  record: Record<string, unknown>,
  keys: string[],
  fallback: boolean,
): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function parseLoginOptions(payload: unknown): LoginOptions {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  return {
    forgotPasswordEnabled: readFlag(
      data,
      ["forgotPasswordEnabled", "forgotPassword", "allowForgotPassword"],
      DEFAULT_LOGIN_OPTIONS.forgotPasswordEnabled,
    ),
    keepMeSignedInEnabled: readFlag(
      data,
      ["keepMeSignedInEnabled", "keepMeSignedIn", "allowKeepMeSignedIn"],
      DEFAULT_LOGIN_OPTIONS.keepMeSignedInEnabled,
    ),
    ssoEnabled: readFlag(
      data,
      ["ssoEnabled", "sso", "allowSso"],
      DEFAULT_LOGIN_OPTIONS.ssoEnabled,
    ),
  };
}

function readMfaChallenge(response: LoginResponse) {
  const nested =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : {};
  const required = Boolean(
    response.mfaRequired ?? nested.mfaRequired ?? nested.mfa_required,
  );
  const challengeToken =
    response.challengeToken ||
    (typeof nested.challengeToken === "string" ? nested.challengeToken : "") ||
    (typeof nested.challenge_token === "string" ? nested.challenge_token : "");
  return { required, challengeToken };
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

  if (readMfaChallenge(response).required) {
    return;
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

async function v1ThenLegacy<T>(
  v1Path: string,
  legacyPath: string,
  options: Parameters<typeof apiRequest>[1] = {},
): Promise<T> {
  try {
    return await apiRequest<T>(v1Path, options);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      return await apiRequest<T>(legacyPath, { ...options, root: true });
    }
    throw err;
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
    v1ThenLegacy<BootstrapStatus>(
      "/auth/bootstrap/status",
      "/api/superadmin/bootstrap/status",
      { auth: false },
    ),

  bootstrap: async (body: BootstrapPayload) => {
    const response = await v1ThenLegacy<LoginResponse>(
      "/auth/bootstrap",
      "/api/superadmin/bootstrap",
      { method: "POST", body, auth: false },
    );
    storeAuthTokens(response);
    return response;
  },

  /** Shared sign-in for every role. Staff users must not use superAdminLogin. */
  login: async ({ email, password, keepMeSignedIn = true }: LoginPayload) => {
    const response = await apiRequest<
      LoginResponse & { success?: boolean; message?: string }
    >("/auth/login", {
      method: "POST",
      body: { email, password, keepMeSignedIn },
      auth: false,
    });
    assertLoginSucceeded(response);
    return response;
  },

  /** Flags for forgot-password, keep-me-signed-in and SSO on the login screen. */
  loginOptions: async (): Promise<LoginOptions> => {
    const cached = readCachedLoginOptions();
    if (cached) return cached;
    if (loginOptionsInFlight) return loginOptionsInFlight;

    loginOptionsInFlight = (async () => {
      try {
        const response = await apiRequest<Record<string, unknown>>(
          "/auth/login-options",
          { auth: false },
        );
        const options = parseLoginOptions(response);
        writeCachedLoginOptions(options);
        return options;
      } catch {
        writeCachedLoginOptions(DEFAULT_LOGIN_OPTIONS);
        return DEFAULT_LOGIN_OPTIONS;
      } finally {
        loginOptionsInFlight = null;
      }
    })();

    return loginOptionsInFlight;
  },

  /** Super Admin-only legacy route. Kept for recovery, not for staff sign-in. */
  superAdminLogin: async (body: LoginPayload) => {
    const response = await apiRequest<
      LoginResponse & { success?: boolean; message?: string }
    >("/auth/login", {
      method: "POST",
      body,
      auth: false,
    });
    assertLoginSucceeded(response);
    const challenge = readMfaChallenge(response);
    return {
      ...response,
      mfaRequired: challenge.required,
      challengeToken: challenge.challengeToken || response.challengeToken,
    };
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
    const response = await v1ThenLegacy<LoginResponse>(
      "/auth/refresh",
      "/api/superadmin/refresh",
      {
        method: "POST",
        body: refreshToken ? { refreshToken } : {},
        auth: false,
      },
    );
    storeAuthTokens(response);
    return response;
  },

  logout: async () => {
    try {
      await v1ThenLegacy<void>("/auth/logout", "/api/superadmin/logout", {
        method: "POST",
      });
    } catch {
      /* Local sign-out still succeeds if the server session is already gone. */
    } finally {
      clearTokens();
    }
  },

  me: async () => {
    try {
      return await apiRequest<AuthUser>("/auth/me");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return await apiRequest<AuthUser>("/api/superadmin/me", { root: true });
      }
      throw err;
    }
  },

  superAdminMe: () =>
    v1ThenLegacy<AuthUser>("/auth/superadmin/me", "/api/superadmin/me"),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    v1ThenLegacy<void>("/auth/change-password", "/api/superadmin/change-password", {
      method: "POST",
      body,
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
    login: (body: LoginPayload) => authApi.superAdminLogin(body),
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
