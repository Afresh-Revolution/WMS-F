import { ApiError, apiRequest } from "./client";
import { listFrom, parseHodOptions, type HodOption } from "./mappers";
import { unwrapRecord } from "./types";
import { departmentsApi } from "./departments";
import { managerApi } from "./manager";

export const lookupsApi = {
  hods: () => apiRequest<Record<string, unknown>>("/lookups/hods"),
  employees: () => apiRequest<Record<string, unknown>>("/lookups/employees"),
  departments: () => apiRequest<Record<string, unknown>>("/lookups/departments"),
  leaveTypes: () => apiRequest<Record<string, unknown>>("/lookups/leave-types"),
  all: () => apiRequest<Record<string, unknown>>("/lookups"),
};

export function readLookupLists(payload: unknown) {
  const root = unwrapRecord(payload);
  return {
    departments: listFrom((root.departments ?? []) as never),
    employees: listFrom((root.employees ?? root.hods ?? []) as never),
    locations: listFrom((root.locations ?? []) as never),
  };
}

export async function loadManagerLookups() {
  const [lookups, employees, departments] = await Promise.all([
    managerApi.getLookups().catch((error) => {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 405)
      ) {
        return lookupsApi.all();
      }
      throw error;
    }),
    managerApi.listEmployees({ limit: 200 }).catch(() => []),
    managerApi.listDepartments().catch(() => []),
  ]);
  const lists = readLookupLists(lookups);
  const directory = Array.isArray(employees)
    ? employees
    : listFrom(employees as never);
  const departmentRows = Array.isArray(departments)
    ? departments
    : listFrom(departments as never);
  if (directory.length) {
    lists.employees = directory;
  }
  if (departmentRows.length) {
    lists.departments = departmentRows;
  }
  return lists;
}

export async function loadHodOptions(): Promise<HodOption[]> {
  const settled = await Promise.allSettled([
    lookupsApi.hods(),
    lookupsApi.employees(),
    departmentsApi.hodOptions(),
    departmentsApi.list(),
  ]);

  const seen = new Set<string>();
  const options: HodOption[] = [];
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const option of parseHodOptions(result.value)) {
      if (seen.has(option.id)) continue;
      seen.add(option.id);
      options.push(option);
    }
  }
  return options;
}
