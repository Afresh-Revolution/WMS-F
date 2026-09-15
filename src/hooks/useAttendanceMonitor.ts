"use client";

import { useMemo } from "react";
import {
  attendanceEmployees,
  attendanceStats,
  departmentAttendance,
  type AttendanceEmployee,
  type AttendanceException,
  type AttendanceStat,
  type DepartmentAttendance,
} from "@/data/attendance";
import { employeesApi, reportsApi, attendanceApi, attendanceSettled, auditLogsApi } from "@/lib/api";
import {
  buildAttendanceStats,
  buildDepartmentBreakdown,
  firstSchedule,
  liveAuditLogsOrFallback,
  liveExceptionsOrFallback,
  mapAttendanceLocation,
  mapRecordsToReportRows,
  mergeCompanyRoster,
  unwrapAttendanceList,
  type AttendanceReportRow,
  type MappedAttendanceLocation,
  type MappedAttendanceSchedule,
} from "@/lib/api/attendanceMappers";
import { mappedOrFallback } from "@/lib/api/internMappers";
import { useAsyncData } from "./useAsyncData";

export function useAttendanceMonitor() {
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const [records, summary, employees, schedules, locations, reports, audits] =
      await Promise.all([
        attendanceSettled(attendanceApi.records.list({ limit: 100 })),
        attendanceSettled(attendanceApi.reports.summary({ period: "current" })),
        attendanceSettled(employeesApi.list({ limit: 100 })),
        attendanceSettled(attendanceApi.schedules.list({ limit: 50 })),
        attendanceSettled(attendanceApi.locations.list({ limit: 50 })),
        attendanceSettled(reportsApi.attendance()),
        attendanceSettled(auditLogsApi.list({ q: "attendance", limit: 50 })),
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
  }, []);

  const roster = useMemo((): AttendanceEmployee[] => {
    if (data?.employees == null && data?.records == null) {
      return attendanceEmployees;
    }
    return mergeCompanyRoster(data.employees, data.records);
  }, [data]);

  const stats = useMemo((): AttendanceStat[] => {
    if (data?.employees == null && data?.records == null && data?.summary == null) {
      return attendanceStats;
    }
    return buildAttendanceStats(roster, data?.summary);
  }, [data, roster]);

  const departments = useMemo((): DepartmentAttendance[] => {
    if (data?.employees == null && data?.records == null) {
      return departmentAttendance;
    }
    return buildDepartmentBreakdown(roster);
  }, [data, roster]);

  const exceptions = useMemo((): AttendanceException[] => {
    return liveExceptionsOrFallback(data?.records);
  }, [data]);

  const reportRows = useMemo((): AttendanceReportRow[] => {
    return mappedOrFallback(
      data?.records,
      mapRecordsToReportRows(data?.records),
      [],
    );
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
    live: data?.records != null || data?.employees != null,
    loading,
    error,
    refetch,
    roster,
    stats,
    departments,
    exceptions,
    reportRows,
    auditLogs,
    schedule,
    locations,
    reportsPayload: data?.reports,
  };
}
