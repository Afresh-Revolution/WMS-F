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

function mergeLookupRows(
  current: Record<string, unknown>[],
  incoming: unknown,
) {
  const seen = new Set(
    current.map((row) =>
      String(row.id ?? row._id ?? row.email ?? row.name ?? "").toLowerCase(),
    ),
  );
  const next = [...current];
  for (const row of listFrom(incoming as never)) {
    const key = String(
      row.id ?? row._id ?? row.email ?? row.name ?? "",
    ).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(row);
  }
  return next;
}

export async function loadManagerLookups() {
  const [lookups, employees, departments, orgLookups] = await Promise.all([
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
    lookupsApi.all().catch(() => null),
  ]);
  const lists = readLookupLists(lookups);
  lists.employees = mergeLookupRows(
    mergeLookupRows(lists.employees, orgLookups ? readLookupLists(orgLookups).employees : []),
    employees,
  );
  lists.departments = mergeLookupRows(
    mergeLookupRows(
      lists.departments,
      orgLookups ? readLookupLists(orgLookups).departments : [],
    ),
    departments,
  );
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
