"use client";

import { useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { ApiListResponse } from "@/lib/api";
import { listFrom } from "@/lib/api/mappers";

type ListApi = {
  list: (params?: Record<string, unknown>) => Promise<ApiListResponse<Record<string, unknown>>>;
};

export function useResourceList<T>(
  api: ListApi,
  mapper: (record: Record<string, unknown>, index: number) => T,
  fallback: T[],
  params?: Record<string, unknown>,
) {
  const { data, loading, error, refetch } = useAsyncData(
    () => api.list(params),
    [JSON.stringify(params ?? {})],
  );

  const items = useMemo(() => {
    const records = listFrom(data ?? undefined);
    return records.length > 0
      ? records.map((record, index) => mapper(record, index))
      : fallback;
  }, [data, fallback, mapper]);

  return { items, loading, error, refetch, raw: data };
}
