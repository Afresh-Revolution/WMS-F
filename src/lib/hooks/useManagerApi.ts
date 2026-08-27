"use client";

import { useCallback, useEffect, useState } from "react";
import { auditEvents } from "@/data/audit";
import {
  companyResources,
  departmentPerformance,
  employeesByDepartment,
  leaveRequests as dashboardLeaveRequests,
  overviewItems,
  recentActivity,
  stats as dashboardStats,
} from "@/data/dashboard";
import { departments } from "@/data/departments";
import { disciplineCases } from "@/data/discipline";
import { employees } from "@/data/employees";
import { events } from "@/data/events";
import { expenseClaims } from "@/data/financeExpenses";
import { purchaseRequests } from "@/data/financePurchases";
import { leaveRequests } from "@/data/leave";
import { meetings } from "@/data/meetings";
import { notifications } from "@/data/notifications";
import { promotions } from "@/data/promotions";
import { reportKpis } from "@/data/reports";
import { salaryIncrements } from "@/data/salaryIncrements";
import { performanceReviews } from "@/data/targets";
import { tasks } from "@/data/tasks";
import { isLiveApiEnabled } from "@/lib/api/client";
import { managerApi } from "@/lib/api/manager";
import {
  mapAuditEvent,
  mapDashboard,
  mapDepartment,
  mapDisciplineCase,
  mapEmployee,
  mapEvent,
  mapExpense,
  mapLeaveRequest,
  mapMeeting,
  mapNotification,
  mapPerformanceReview,
  mapProcurementRequest,
  mapPromotion,
  mapReportKpis,
  mapSalaryIncrement,
  mapTask,
  type MappedDashboard,
} from "@/lib/api/mappers";
import type { ListResult, ManagerListParams } from "@/lib/api/types";

type ListFetcher = (params?: ManagerListParams) => Promise<ListResult<unknown>>;

export function useManagerList<T>(options: {
  fetcher: ListFetcher;
  mapItem: (item: unknown) => T;
  fallback: T[];
  params?: ManagerListParams;
}) {
  const { fetcher, mapItem, fallback, params } = options;
  const [items, setItems] = useState<T[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const paramsKey = JSON.stringify(params ?? {});

  const refresh = useCallback(async () => {
    if (!isLiveApiEnabled()) {
      setLoading(false);
      setIsLive(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const result = await fetcher(params);
      setItems(result.items.map(mapItem));
      setIsLive(true);
      setError(null);
    } catch (err) {
      setItems(fallback);
      setIsLive(false);
      setError(err instanceof Error ? err.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, [fallback, fetcher, mapItem, params, paramsKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, setItems, loading, error, isLive, refresh };
}

export function useManagerEmployees(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listEmployees,
    mapItem: mapEmployee,
    fallback: employees,
    params,
  });
}

export function useManagerDepartments(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listDepartments,
    mapItem: mapDepartment,
    fallback: departments,
    params,
  });
}

export function useManagerLeave(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listLeave,
    mapItem: mapLeaveRequest,
    fallback: leaveRequests,
    params,
  });
}

export function useManagerPromotions(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listPromotions,
    mapItem: mapPromotion,
    fallback: promotions,
    params,
  });
}

export function useManagerSalaryRecommendations(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listSalaryRecommendations,
    mapItem: mapSalaryIncrement,
    fallback: salaryIncrements,
    params,
  });
}

export function useManagerMeetings(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listMeetings,
    mapItem: mapMeeting,
    fallback: meetings,
    params,
  });
}

export function useManagerTasks(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listTasks,
    mapItem: mapTask,
    fallback: tasks,
    params,
  });
}

export function useManagerTargets(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listTargets,
    mapItem: mapPerformanceReview,
    fallback: performanceReviews,
    params,
  });
}

export function useManagerExpenses(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listExpenses,
    mapItem: mapExpense,
    fallback: expenseClaims,
    params,
  });
}

export function useManagerProcurementRequests(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listProcurementRequests,
    mapItem: mapProcurementRequest,
    fallback: purchaseRequests,
    params,
  });
}

export function useManagerEvents(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listEvents,
    mapItem: mapEvent,
    fallback: events,
    params,
  });
}

export function useManagerDiscipline(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listDiscipline,
    mapItem: mapDisciplineCase,
    fallback: disciplineCases,
    params,
  });
}

export function useManagerNotifications(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listNotifications,
    mapItem: mapNotification,
    fallback: notifications,
    params,
  });
}

export function useManagerAuditLogs(params?: ManagerListParams) {
  return useManagerList({
    fetcher: managerApi.listAuditLogs,
    mapItem: mapAuditEvent,
    fallback: auditEvents,
    params,
  });
}

const dashboardFallback: MappedDashboard = {
  stats: dashboardStats.map((stat) => ({ label: stat.label, value: stat.value })),
  leaveRequests: dashboardLeaveRequests,
  overviewItems,
  employeesByDepartment,
  departmentPerformance,
  recentActivity,
};

export function useManagerDashboard() {
  const [data, setData] = useState<MappedDashboard>(dashboardFallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLiveApiEnabled()) {
      setData(dashboardFallback);
      setLoading(false);
      setIsLive(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const payload = await managerApi.getDashboard();
      setData(mapDashboard(payload, dashboardFallback));
      setIsLive(true);
      setError(null);
    } catch (err) {
      setData(dashboardFallback);
      setIsLive(false);
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, isLive, refresh, companyResources };
}

export function useManagerReports() {
  const [kpis, setKpis] = useState(reportKpis);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isLiveApiEnabled()) {
      setKpis(reportKpis);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const payload = await managerApi.getReports();
      setKpis(mapReportKpis(payload, reportKpis));
      setError(null);
    } catch (err) {
      setKpis(reportKpis);
      setError(err instanceof Error ? err.message : "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { kpis, loading, error, refresh };
}
