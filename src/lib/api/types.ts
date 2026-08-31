export type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type ApiListResponse<T> = T[] | PaginatedResponse<T>;

export function unwrapList<T>(response: ApiListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.data ?? [];
}

export type Id = string | number;
