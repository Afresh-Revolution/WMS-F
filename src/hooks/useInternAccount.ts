"use client";

import { useMemo } from "react";
import {
  nyscAccounts,
  type NyscAccountId,
} from "@/data/nyscOverview";
import { internApi, internSettled } from "@/lib/api";
import { mapInternAccount } from "@/lib/api/internMappers";
import { useAsyncData } from "./useAsyncData";

export function useInternAccount(accountId: NyscAccountId) {
  const fallback = nyscAccounts[accountId];
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [dashboard, placement] = await Promise.all([
      internApi.dashboard({ previewLimit: 5 }),
      internSettled(internApi.placementRecord.get()),
    ]);
    return { dashboard, placement };
  }, []);

  const account = useMemo(
    () => mapInternAccount(data?.dashboard, data?.placement, fallback),
    [data, fallback],
  );

  return {
    account,
    loading,
    error,
    refetch,
    live: Boolean(data?.dashboard),
  };
}
