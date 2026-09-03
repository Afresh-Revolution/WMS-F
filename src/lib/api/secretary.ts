import { apiRequest, buildQuery } from "./client";
import { unwrapList, type ApiListResponse, type Id } from "./types";

export type SecretaryListParams = Record<string, unknown>;

function secretaryPath(path: string, query?: SecretaryListParams) {
  return `/secretary${path}${buildQuery(query)}`;
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export const secretaryApi = {
  getDashboard(query?: SecretaryListParams) {
    return apiRequest<unknown>(secretaryPath("/dashboard", query)).then(
      unwrapData,
    );
  },

  getOverview(query?: SecretaryListParams) {
    return apiRequest<unknown>(secretaryPath("/overview", query)).then(
      unwrapData,
    );
  },

  listEmailRequests(query?: SecretaryListParams) {
    return apiRequest<ApiListResponse<Record<string, unknown>>>(
      secretaryPath("/email-requests", query),
    ).then(unwrapList);
  },

  retryEmail(id: Id) {
    return apiRequest<unknown>(secretaryPath(`/email-requests/${id}/retry`), {
      method: "POST",
    }).then(unwrapData);
  },
};
