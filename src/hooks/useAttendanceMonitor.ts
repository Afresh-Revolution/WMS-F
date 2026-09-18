"use client";

import { useMemo } from "react";
import type {
  AttendanceCorrection,
  AttendanceEmployee,
  AttendanceException,
  AttendanceStat,
  DepartmentAttendance,
} from "@/data/attendance";
import {
  employeesApi,
  reportsApi,
  attendanceApi,
  attendanceSettled,
  auditLogsApi,
  managerApi,
} from "@/lib/api";
import {
  buildAttendanceStats,
  buildDepartmentBreakdown,
  firstSchedule,
  liveAuditLogsOrFallback,
  mapRecordsToCorrections,
  mapRecordsToExceptions,
  mapRecordsToReportRows,
  mergeCompanyRoster,
  unwrapAttendanceList,
  mapAttendanceLocation,
  type AttendanceReportRow,
  type MappedAttendanceLocation,
  type MappedAttendanceSchedule,
} from "@/lib/api/attendanceMappers";
import { useAsyncData } from "./useAsyncData";

export function useAttendanceMonitor(source: "admin" | "manager" = "admin") {
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [records, summary, employees, schedules, locations, reports, audits] =
      await Promise.all([
        attendanceSettled(
          source === "manager"
            ? attendanceApi.manager.list({ limit: 100 })
            : attendanceApi.records.list({ limit: 100 }),
        ),
        attendanceSettled(attendanceApi.reports.summary({ period: "current" })),
        attendanceSettled(
          source === "manager"
            ? managerApi.listEmployees({ limit: 100 })
            : employeesApi.list({ limit: 100 }),
        ),
        attendanceSettled(attendanceApi.schedules.list({ limit: 50 })),
        attendanceSettled(attendanceApi.locations.list({ limit: 50 })),
        attendanceSettled(
          source === "manager"
            ? managerApi.getReports()
            : reportsApi.attendance(),
        ),
        attendanceSettled(
          source === "manager"
            ? managerApi.listAuditLogs({ q: "attendance", limit: 50 })
            : auditLogsApi.list({ q: "attendance", limit: 50 }),
        ),
      ]);
    return {
      records,
      summary,
      employees,
      schedules,
      locations,
      reports,
      audits,
    };
  }, [source]);

  const roster = useMemo((): AttendanceEmployee[] => {
    return mergeCompanyRoster(data?.employees, data?.records);
  }, [data]);

  const stats = useMemo((): AttendanceStat[] => {
    return buildAttendanceStats(roster, data?.summary);
  }, [data, roster]);

  const departments = useMemo((): DepartmentAttendance[] => {
    return buildDepartmentBreakdown(roster);
  }, [roster]);

  const exceptions = useMemo((): AttendanceException[] => {
    return mapRecordsToExceptions(data?.records);
  }, [data]);

  const corrections = useMemo((): AttendanceCorrection[] => {
    return mapRecordsToCorrections(data?.records);
  }, [data]);

  const reportRows = useMemo((): AttendanceReportRow[] => {
    return mapRecordsToReportRows(data?.records);
  }, [data]);

  const auditLogs = useMemo(
    () => liveAuditLogsOrFallback(data?.audits),
    [data],
  );

  const schedule = useMemo(
    (): MappedAttendanceSchedule | null => firstSchedule(data?.schedules),
    [data],
  );

  const locations = useMemo((): MappedAttendanceLocation[] => {
    return unwrapAttendanceList(data?.locations).map(mapAttendanceLocation);
  }, [data]);

  return {
    live: data != null,
    loading,
    error,
    refetch,
    roster,
    stats,
    departments,
    exceptions,
    corrections,
    reportRows,
    auditLogs,
    schedule,
    locations,
    reportsPayload: data?.reports,
  };
}
