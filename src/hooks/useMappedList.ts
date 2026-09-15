"use client";

import { useMemo } from "react";
import { useAsyncData } from "@/hooks/useAsyncData";
import { unwrapList } from "@/lib/api";

export function useMappedList<T>(
  fetcher: () => Promise<unknown>,
  mapper: (record: Record<string, unknown>, index: number) => T,
  deps: unknown[] = [],
) {
  const { data, loading, error, refetch } = useAsyncData(fetcher, deps);
  const items = useMemo(
    () =>
      unwrapList<Record<string, unknown>>(data).map((record, index) =>
        mapper(record, index),
      ),
    [data, mapper],
  );
  return { items, loading, error, refetch, raw: data };
}
