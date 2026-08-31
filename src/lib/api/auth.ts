import { apiRequest, buildQuery, clearTokens, setTokens } from "./client";

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
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
  mfaRequired?: boolean;
  challengeToken?: string;
};

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
    if (response.accessToken) {
      setTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  login: async (body: LoginPayload) => {
    const response = await apiRequest<LoginResponse>("/api/superadmin/login", {
      method: "POST",
      body,
      auth: false,
      root: true,
    });
    if (response.accessToken) {
      setTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  verifyMfa: async (body: { code: string; challengeToken?: string }) => {
    const response = await apiRequest<LoginResponse>("/auth/mfa/verify", {
      method: "POST",
      body,
      auth: false,
    });
    if (response.accessToken) {
      setTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  refresh: async (refreshToken?: string) => {
    const response = await apiRequest<LoginResponse>("/api/superadmin/refresh", {
      method: "POST",
      body: refreshToken ? { refreshToken } : {},
      auth: false,
      root: true,
    });
    if (response.accessToken) {
      setTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  logout: async () => {
    await apiRequest<void>("/api/superadmin/logout", { method: "POST", root: true });
    clearTokens();
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
