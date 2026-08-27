export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonRecord = Record<string, unknown>;

export type ManagerListParams = {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  department_id?: string;
  employeeId?: string;
  employee_id?: string;
  [key: string]: string | number | boolean | undefined;
};

export type PaginationMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type ListResult<T> = {
  items: T[];
  meta: PaginationMeta;
  raw: unknown;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
