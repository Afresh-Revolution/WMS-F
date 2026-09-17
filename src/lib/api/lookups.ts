import { apiRequest } from "./client";
import { parseHodOptions, type HodOption } from "./mappers";
import { departmentsApi } from "./departments";

export const lookupsApi = {
  hods: () => apiRequest<Record<string, unknown>>("/lookups/hods"),
  employees: () => apiRequest<Record<string, unknown>>("/lookups/employees"),
  departments: () => apiRequest<Record<string, unknown>>("/lookups/departments"),
};

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
