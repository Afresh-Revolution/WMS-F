"use client";

import { PageTopBar } from "@/components/layout/PageTopBar";
import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Clock,
  KeyRound,
  Mail,
  Percent,
  PieChart,
  Save,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { GpsCheckInCard } from "@/components/attendance/GpsCheckInCard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import {
  listFrom,
  mapAuditEvent,
  mapTechnicalAuditEvent,
  nestedStr,
  num,
  str,
} from "@/lib/api/mappers";
import styles from "./DashboardPage.module.css";

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function firstValue(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return undefined;
}

function metricText(value: unknown, fallback = "0"): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const text = str(value);
  return text || fallback;
}

function serviceLabel(payload: unknown, fallback: string) {
  const rec = unwrapRecord(payload);
  const hay = `${rec.status ?? ""} ${rec.state ?? ""} ${rec.health ?? ""} ${rec.ok ?? ""}`.toLowerCase();
  if (!payload) return { label: "Unavailable", ok: false };
  if (
    hay.includes("fail") ||
    hay.includes("down") ||
    hay.includes("error") ||
    rec.ok === false
  ) {
    return { label: "Unavailable", ok: false };
  }
  if (
    hay.includes("complete") ||
    hay.includes("success") ||
    hay.includes("operat") ||
    hay.includes("healthy") ||
    hay.includes("ok") ||
    rec.ok === true ||
    hay.trim() === ""
  ) {
    return { label: fallback, ok: true };
  }
  return { label: str(rec.status ?? rec.state, fallback), ok: true };
}

function relativeTime(value: unknown) {
  const text = str(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatPayrollAmount(value: unknown) {
  if (typeof value === "string" && /[₦N]/.test(value)) return value;
  const amount = num(value, Number.NaN);
  if (!Number.isFinite(amount)) return "—";
  if (Math.abs(amount) >= 1_000_000) {
    return `₦ ${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `₦ ${Math.round(amount).toLocaleString("en-NG")}`;
}

function formatCompactNaira(value: unknown) {
  if (typeof value === "string" && /[₦N]/.test(value)) {
    return value.replace(/^N\s?/, "₦ ");
  }
  const amount = num(value, Number.NaN);
  if (!Number.isFinite(amount)) return "—";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `₦ ${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `₦ ${Math.round(amount / 1_000)}K`;
  return `₦ ${Math.round(amount).toLocaleString("en-NG")}`;
}

function reportMoney(payload: unknown, keys: string[]) {
  const rec = unwrapRecord(payload);
  const nested = unwrapRecord(
    rec.summary ?? rec.totals ?? rec.metrics ?? rec.data ?? rec.stats,
  );
  return formatCompactNaira(firstValue(rec, keys) ?? firstValue(nested, keys));
}

function asRecords(payload: unknown) {
  const rec = unwrapRecord(payload);
  return listFrom(
    (rec.items ??
      rec.records ??
      rec.events ??
      rec.logs ??
      rec.data ??
      payload) as never,
  );
}

function accessHay(record: Record<string, unknown>) {
  return [
    record.action,
    record.event,
    record.module,
    record.area,
    record.category,
    record.target,
    record.resource,
    record.title,
    record.summary,
    record.description,
  ]
    .map((value) => str(value).toLowerCase())
    .join(" ");
}

function changeTitle(record: Record<string, unknown>) {
  const mapped = mapAuditEvent(record);
  const tech = mapTechnicalAuditEvent(record);
  const user = mapped.user !== "System" ? mapped.user : tech.actor;
  const summary = tech.summary;
  if (summary && (summary.includes("→") || summary.includes(":"))) {
    return summary.includes(user) || user === "System" ? summary : `${user}: ${summary}`;
  }
  const action = mapped.action || tech.title;
  const target = mapped.target;
  const reverted = str(mapped.outcome).toLowerCase().includes("revert")
    ? " (reverted)"
    : "";
  if (action.includes("→") || action.includes("->")) {
    return user && user !== "System" ? `${user}: ${action}${reverted}` : `${action}${reverted}`;
  }
  if (target && (target.includes("→") || target.includes("->"))) {
    return user && user !== "System" ? `${user}: ${target}${reverted}` : `${target}${reverted}`;
  }
  if (user && user !== "System" && action && target && action !== target) {
    return `${user}: ${action} → ${target}${reverted}`;
  }
  if (user && user !== "System" && action) return `${user}: ${action}${reverted}`;
  return action || target || summary || "Change";
}

function percentValue(value: unknown) {
  const n = num(value, Number.NaN);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.round(Math.min(n, 100));
}

function permissionCount(payload: unknown) {
  const rec = unwrapRecord(payload);
  const direct = listFrom(
    (rec.permissions ?? rec.items ?? rec.catalog ?? rec.data ?? payload) as never,
  );
  if (direct.length) return direct.length;
  const groups = listFrom(
    (rec.modules ?? rec.groups ?? rec.categories ?? rec.sections) as never,
  );
  const nested = groups.flatMap((group) =>
    listFrom((group.permissions ?? group.items ?? group) as never),
  );
  if (nested.length) return nested.length;
  return num(rec.count ?? rec.total ?? rec.size);
}

function formatShortDate(value: unknown) {
  const text = str(value);
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isPending(record: Record<string, unknown>) {
  const raw = str(record.status ?? record.state).toLowerCase();
  return !raw || raw.includes("pend") || raw.includes("await") || raw.includes("review");
}

function mapApproval(
  record: Record<string, unknown>,
  fallbackType: string,
  index: number,
) {
  const type = str(record.type ?? record.kind ?? record.category, fallbackType);
  const ref = str(
    record.ref ?? record.reference ?? record.code,
    `${fallbackType.slice(0, 2).toUpperCase()}-${index + 1}`,
  );
  const department = nestedStr(record.department) || str(record.department);
  const detailParts = [
    department,
    str(
      record.title ??
        record.reason ??
        record.leaveType ??
        record.item ??
        record.description ??
        record.note,
    ),
  ].filter(Boolean);
  return {
    id: str(record.id ?? record._id, `${fallbackType}-${index}`),
    type,
    detail: detailParts.join(" · ") || "Pending request",
    ref,
  };
}

export function DashboardPage() {
  const { data, loading, error } = useAsyncData(async () => {
    const overview = await superAdminApi.dashboard.overview().catch(() =>
      superAdminApi.dashboard.platformOverview(),
    );
    const [
      stats,
      health,
      security,
      email,
      notifications,
      backupHealth,
      backups,
      auditLogs,
      approvalQueue,
      leave,
      purchases,
      increments,
      expenses,
      payrollReport,
      payrollRuns,
      accessLogs,
      operationalLogs,
      departmentReport,
      purchaseReport,
      billsReport,
      expenseReport,
      permissionCatalog,
      permissionsList,
      departments,
      bills,
    ] = await Promise.all([
      settled(superAdminApi.dashboard.stats()),
      settled(superAdminApi.health()),
      settled(superAdminApi.security.dashboard()),
      settled(superAdminApi.emailConfig.get()),
      settled(superAdminApi.notificationConfig.get()),
      settled(superAdminApi.backups.health()),
      settled(superAdminApi.backups.list({ limit: 1, sortBy: "createdAt" })),
      settled(superAdminApi.technicalAuditLogs.list({ limit: 8 })),
      settled(superAdminApi.hr.approvalQueue({ limit: 8 })),
      settled(superAdminApi.leave.list({ limit: 50 })),
      settled(superAdminApi.purchaseRequests.list({ limit: 50 })),
      settled(superAdminApi.salaryIncrements.list({ limit: 50 })),
      settled(superAdminApi.expenses.list({ limit: 50 })),
      settled(superAdminApi.reports.payroll()),
      settled(superAdminApi.payroll.list({ limit: 1 })),
      settled(superAdminApi.auditLogs.list({ limit: 20 })),
      settled(superAdminApi.auditLogs.operational({ limit: 20 })),
      settled(superAdminApi.reports.departments()),
      settled(superAdminApi.reports.purchases()),
      settled(superAdminApi.reports.bills()),
      settled(superAdminApi.reports.expenses()),
      settled(superAdminApi.permissions.catalog()),
      settled(superAdminApi.permissions.list()),
      settled(superAdminApi.departments.list()),
      settled(superAdminApi.bills.list({ limit: 50 })),
    ]);
    return {
      overview,
      stats,
      health,
      security,
      email,
      notifications,
      backupHealth,
      backups,
      auditLogs,
      approvalQueue,
      leave,
      purchases,
      increments,
      expenses,
      payrollReport,
      payrollRuns,
      accessLogs,
      operationalLogs,
      departmentReport,
      purchaseReport,
      billsReport,
      expenseReport,
      permissionCatalog,
      permissionsList,
      departments,
      bills,
    };
  }, []);

  const overview = useMemo(() => unwrapRecord(data?.overview), [data]);
  const metrics = useMemo(
    () =>
      unwrapRecord(
        overview.metrics ?? overview.summary ?? overview.counts ?? data?.stats,
      ),
    [data, overview],
  );
  const security = useMemo(() => unwrapRecord(data?.security), [data]);

  const dashboardStats = useMemo(() => {
    const merged = {
      ...metrics,
      ...unwrapRecord(data?.stats),
      ...security,
      ...overview,
    };
    return [
      {
        id: "users",
        label: "Total users",
        value: metricText(
          firstValue(merged, [
            "totalUsers",
            "users",
            "userCount",
            "totalEmployees",
            "employees",
          ]),
        ),
        meta: "All roles",
        accent: true,
      },
      {
        id: "active",
        label: "Active users",
        value: metricText(
          firstValue(merged, ["activeUsers", "signedIn", "onlineUsers", "active"]),
        ),
        meta: "Signed in",
      },
      {
        id: "inactive",
        label: "Inactive users",
        value: metricText(
          firstValue(merged, ["inactiveUsers", "dormantUsers", "inactive"]),
        ),
        meta: "Dormant",
      },
      {
        id: "locked",
        label: "Locked accounts",
        value: metricText(
          firstValue(merged, ["lockedAccounts", "lockedUsers", "locked"]),
        ),
        meta: "Security",
      },
      {
        id: "failed",
        label: "Failed logins",
        value: metricText(
          firstValue(merged, [
            "failedLogins",
            "failedLoginAttempts",
            "loginFailures",
          ]),
        ),
        meta: "Today",
      },
      {
        id: "admins",
        label: "Admin accounts",
        value: metricText(
          firstValue(merged, [
            "adminAccounts",
            "admins",
            "superAdmins",
            "adminCount",
          ]),
        ),
        meta: str(firstValue(merged, ["superAdminLabel", "superAdmins"]), "Super"),
      },
    ];
  }, [data, metrics, overview, security]);

  const services = useMemo(() => {
    const backupRoot = unwrapRecord(data?.backupHealth ?? data?.backups);
    const backupItems = listFrom(
      (backupRoot.items ?? backupRoot.records ?? data?.backups) as never,
    );
    const latestBackup = unwrapRecord(backupItems[0]);
    const email = serviceLabel(data?.email, "Operational");
    const notices = serviceLabel(data?.notifications, "Operational");
    const health = serviceLabel(data?.health, "Operational");
    const backup = serviceLabel(
      data?.backupHealth ?? latestBackup,
      latestBackup.status || backupRoot.status ? "Completed" : "Operational",
    );
    return [
      { id: "email", title: "Email service", icon: Mail, meta: "", ...email },
      {
        id: "notifications",
        title: "Notification service",
        icon: Bell,
        meta: "",
        ...notices,
      },
      { id: "health", title: "System health", icon: Activity, meta: "", ...health },
      {
        id: "backup",
        title: "Backup status",
        icon: Save,
        ...backup,
        meta: relativeTime(
          latestBackup.createdAt ??
            latestBackup.completedAt ??
            backupRoot.lastBackupAt ??
            backupRoot.updatedAt,
        ),
      },
    ];
  }, [data]);

  const auditEvents = useMemo(
    () => listFrom(data?.auditLogs ?? undefined).map(mapTechnicalAuditEvent),
    [data],
  );

  const alerts = useMemo(
    () =>
      auditEvents
        .filter((event) => event.severity === "Warning" || event.severity === "Critical")
        .slice(0, 3),
    [auditEvents],
  );

  const pendingApprovals = useMemo(() => {
    const queued = listFrom(data?.approvalQueue ?? undefined)
      .filter(isPending)
      .map((record, index) => mapApproval(record, "Request", index));
    if (queued.length > 0) return queued.slice(0, 4);

    return [
      ...listFrom(data?.leave ?? undefined)
        .filter(isPending)
        .map((record, index) => mapApproval(record, "Leave Request", index)),
      ...listFrom(data?.purchases ?? undefined)
        .filter(isPending)
        .map((record, index) => mapApproval(record, "Purchase Request", index)),
      ...listFrom(data?.increments ?? undefined)
        .filter(isPending)
        .map((record, index) => mapApproval(record, "Salary Increment", index)),
      ...listFrom(data?.expenses ?? undefined)
        .filter(isPending)
        .map((record, index) => mapApproval(record, "Reimbursement", index)),
    ].slice(0, 4);
  }, [data]);

  const payroll = useMemo(() => {
    const report = unwrapRecord(data?.payrollReport);
    const runs = listFrom(data?.payrollRuns ?? undefined);
    const run = unwrapRecord(runs[0] ?? report.current ?? report.latest ?? report);
    const amount =
      firstValue(run, ["net", "netPay", "total", "amount", "gross"]) ??
      firstValue(report, ["net", "total", "payrollTotal", "monthlyPayroll"]);
    const staff =
      firstValue(run, ["employees", "employeeCount", "headcount", "staff"]) ??
      firstValue(report, ["employees", "employeeCount", "headcount"]);
    const period = str(
      run.period ?? run.label ?? run.month ?? report.period ?? report.label,
    );
    const status = str(run.status ?? report.status, "Awaiting Admin approval");
    return {
      amount: formatPayrollAmount(amount),
      runLabel: [period, staff ? `${Number(staff).toLocaleString("en-NG")} employees` : ""]
        .filter(Boolean)
        .join(" · ") || "Current payroll run",
      status,
      nextDate: formatShortDate(
        run.nextDisbursement ??
          run.payDate ??
          run.disbursementDate ??
          report.nextDisbursement,
      ),
    };
  }, [data]);

  const accessChanges = useMemo(() => {
    const records = [
      ...asRecords(data?.accessLogs),
      ...asRecords(data?.operationalLogs),
    ];
    const seen = new Set<string>();
    const unique = records.filter((record, index) => {
      const id = str(record.id ?? record._id, `${index}-${changeTitle(record)}`);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    const toItem = (record: Record<string, unknown>, index: number) => ({
      id: str(record.id ?? record._id, `change-${index}`),
      title: changeTitle(record),
      time: relativeTime(
        record.timestamp ?? record.createdAt ?? record.occurredAt ?? record.updatedAt,
      ),
    });
    const permission = unique
      .filter((record) => accessHay(record).includes("permission"))
      .slice(0, 3)
      .map(toItem);
    const permissionIds = new Set(permission.map((item) => item.id));
    const role = unique
      .filter((record) => {
        const hay = accessHay(record);
        return hay.includes("role") && !permissionIds.has(str(record.id ?? record._id));
      })
      .slice(0, 3)
      .map(toItem);
    return { permission, role };
  }, [data]);

  const departmentPerformance = useMemo(() => {
    const perfKeys = [
      "performance",
      "score",
      "percent",
      "completion",
      "targetPercent",
      "achievement",
    ];
    const toRow = (
      record: Record<string, unknown>,
      index: number,
      prefix: string,
    ) => {
      const explicit = firstValue(record, perfKeys);
      const fallback =
        record.value !== undefined && num(record.value, Number.NaN) <= 100
          ? record.value
          : undefined;
      const source = explicit ?? fallback;
      if (source === undefined) return null;
      const name = str(record.name ?? record.label ?? record.department);
      if (!name) return null;
      return {
        id: str(record.id ?? record._id ?? name, `${prefix}-${index}`),
        name,
        value: percentValue(source),
      };
    };

    const report = unwrapRecord(data?.departmentReport);
    const fromReport = listFrom(
      (report.departments ??
        report.breakdown ??
        report.performance ??
        report.items ??
        report.data ??
        data?.departmentReport) as never,
    )
      .map((record, index) => toRow(record, index, "dept"))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    if (fromReport.length) {
      return fromReport.sort((a, b) => b.value - a.value).slice(0, 6);
    }

    const fromOverview = listFrom(
      (overview.departmentPerformance ?? overview.departments) as never,
    )
      .map((record, index) => toRow(record, index, "ov"))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    if (fromOverview.length) {
      return fromOverview.sort((a, b) => b.value - a.value).slice(0, 6);
    }

    return listFrom(data?.departments ?? undefined)
      .map((record, index) => toRow(record, index, "list"))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [data, overview]);

  const financialSummary = useMemo(() => {
    const pendingPurchaseAmount = listFrom(data?.purchases ?? undefined)
      .filter(isPending)
      .reduce(
        (sum, record) =>
          sum + num(record.amount ?? record.total ?? record.value),
        0,
      );
    const outstandingBills = listFrom(data?.bills ?? undefined)
      .filter((record) => {
        const status = str(record.status ?? record.state).toLowerCase();
        return (
          !status ||
          status.includes("outstand") ||
          status.includes("unpaid") ||
          status.includes("open") ||
          status.includes("pending")
        );
      })
      .reduce(
        (sum, record) =>
          sum + num(record.balance ?? record.outstanding ?? record.amount ?? record.total),
        0,
      );
    const queuedReimbursements = listFrom(data?.expenses ?? undefined)
      .filter(isPending)
      .reduce(
        (sum, record) =>
          sum + num(record.amount ?? record.total ?? record.value),
        0,
      );

    return [
      {
        id: "approved",
        label: "Approved this month",
        value: reportMoney(data?.payrollReport ?? data?.expenseReport, [
          "approvedThisMonth",
          "approved",
          "approvedTotal",
          "monthlyApproved",
          "payrollTotal",
          "total",
        ]),
      },
      {
        id: "purchases",
        label: "Pending purchases",
        value: (() => {
          const fromReport = reportMoney(data?.purchaseReport, [
            "pending",
            "pendingTotal",
            "pendingAmount",
            "outstanding",
            "totalPending",
          ]);
          return fromReport === "—" && pendingPurchaseAmount
            ? formatCompactNaira(pendingPurchaseAmount)
            : fromReport;
        })(),
      },
      {
        id: "bills",
        label: "Outstanding bills",
        value: (() => {
          const fromReport = reportMoney(data?.billsReport, [
            "outstanding",
            "outstandingTotal",
            "unpaid",
            "balance",
            "open",
          ]);
          return fromReport === "—" && outstandingBills
            ? formatCompactNaira(outstandingBills)
            : fromReport;
        })(),
      },
      {
        id: "reimbursements",
        label: "Reimbursements queued",
        value: (() => {
          const fromReport = reportMoney(data?.expenseReport, [
            "queued",
            "pending",
            "pendingTotal",
            "reimbursementsQueued",
            "reimbursements",
          ]);
          return fromReport === "—" && queuedReimbursements
            ? formatCompactNaira(queuedReimbursements)
            : fromReport;
        })(),
      },
    ];
  }, [data]);

  const operationalRecords = useMemo(() => {
    const seen = new Set<string>();
    const records = [
      ...listFrom(data?.approvalQueue ?? undefined),
      ...listFrom(data?.leave ?? undefined),
      ...listFrom(data?.purchases ?? undefined),
      ...listFrom(data?.increments ?? undefined),
      ...listFrom(data?.expenses ?? undefined),
    ].filter((record, index) => {
      const id = str(record.id ?? record._id, `op-${index}`);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const bucket = (record: Record<string, unknown>) => {
      const status = str(record.status ?? record.state).toLowerCase();
      if (status.includes("approv") && !status.includes("unapprov")) return "approved";
      if (status.includes("submit")) return "submitted";
      if (
        status.includes("review") ||
        status.includes("pend") ||
        status.includes("await") ||
        status.includes("queue")
      ) {
        return "review";
      }
      return "";
    };

    const report = unwrapRecord(
      data?.purchaseReport ?? data?.expenseReport ?? data?.payrollReport,
    );
    return {
      inReview:
        num(firstValue(report, ["inReview", "in_review", "reviewCount"])) ||
        records.filter((record) => bucket(record) === "review").length,
      submitted:
        num(firstValue(report, ["submitted", "submittedCount"])) ||
        records.filter((record) => bucket(record) === "submitted").length,
      approved:
        num(firstValue(report, ["approvedCount", "approvedRecords"])) ||
        records.filter((record) => bucket(record) === "approved").length,
      permissions:
        permissionCount(data?.permissionCatalog) ||
        permissionCount(data?.permissionsList),
    };
  }, [data]);

  return (
    <div className={styles.page}>
      <PageTopBar
        status={
          loading ? (
            <p className={styles.dateLabel}>Loading dashboard…</p>
          ) : error ? (
            <p className={styles.dateLabel} role="alert">
              {error}
            </p>
          ) : null
        }
      />

      <GpsCheckInCard portal="me" variant="desk" />

      <div className={styles.metricGrid}>
        {dashboardStats.map((stat) => (
          <article
            key={stat.id}
            className={`${styles.metricCard} ${stat.accent ? styles.metricCardAccent : ""}`}
          >
            <div className={styles.metricCopy}>
              <p className={styles.metricLabel}>{stat.label}</p>
              <p className={styles.metricValue}>{stat.value}</p>
            </div>
            <span className={styles.metricMeta}>{stat.meta}</span>
          </article>
        ))}
      </div>

      <div className={styles.serviceGrid}>
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <article key={service.id} className={styles.serviceCard}>
              <p className={styles.serviceTitle}>
                <Icon size={16} />
                {service.title}
              </p>
              <p
                className={`${styles.serviceStatus} ${
                  service.ok ? "" : styles.serviceStatusWarn
                }`}
              >
                <span className={styles.serviceDot} aria-hidden />
                {service.label}
              </p>
              {service.meta ? (
                <p className={styles.serviceMeta}>{service.meta}</p>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className={styles.board}>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.boardHead}>
              <h2 className={styles.panelTitle}>
                <ShieldAlert size={18} />
                Technical alerts
              </h2>
              <Link href="/technical-audit-logs" className={styles.boardLink}>
                View logs <ArrowRight size={14} />
              </Link>
            </div>
            {alerts.length === 0 ? (
              <p className={styles.empty}>No technical alerts right now.</p>
            ) : (
              alerts.map((alert) => (
                <article key={alert.id} className={styles.row}>
                  <div className={styles.rowLead}>
                    <span
                      className={`${styles.alertIcon} ${
                        alert.severity === "Critical"
                          ? styles.alertIconCritical
                          : styles.alertIconWarning
                      }`}
                      aria-hidden
                    >
                      {alert.severity === "Critical" ? (
                        <ShieldAlert size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                    </span>
                    <div className={styles.rowCopy}>
                      <p className={styles.rowTitle}>{alert.title || "Alert"}</p>
                      <p className={styles.rowMeta}>
                        {alert.summary || alert.actor}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`${styles.severity} ${
                      alert.severity === "Critical"
                        ? styles.severityCritical
                        : styles.severityWarning
                    }`}
                  >
                    {alert.severity}
                  </span>
                </article>
              ))
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.boardHead}>
              <h2 className={styles.panelTitle}>
                <Activity size={18} />
                Recent technical audit events
              </h2>
              <Link href="/technical-audit-logs" className={styles.boardLink}>
                Full audit <ArrowRight size={14} />
              </Link>
            </div>
            {auditEvents.length === 0 ? (
              <p className={styles.empty}>No audit events yet.</p>
            ) : (
              auditEvents.slice(0, 5).map((event) => (
                <article key={event.id} className={styles.row}>
                  <div className={styles.rowCopy}>
                    <p className={styles.rowTitle}>
                      {event.title || "Event"}
                      {event.area ? ` · ${event.area}` : ""}
                    </p>
                    <p className={styles.rowMeta}>
                      {[event.summary, event.actor].filter(Boolean).join(" — ")}
                    </p>
                  </div>
                  <span className={styles.rowTime}>
                    {relativeTime(event.timestamp)}
                  </span>
                </article>
              ))
            )}
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.boardHead}>
              <h2 className={styles.panelTitle}>
                <Clock size={18} />
                Pending operational approvals
              </h2>
            </div>
            <p className={styles.panelNote}>
              Visibility only. Super Admin is not an approval stage — requests never
              route here automatically.
            </p>
            {pendingApprovals.length === 0 ? (
              <p className={styles.empty}>No pending operational requests.</p>
            ) : (
              pendingApprovals.map((item) => (
                <article key={item.id} className={styles.row}>
                  <div className={styles.rowCopy}>
                    <p className={styles.rowTitle}>{item.type}</p>
                    <p className={styles.rowMeta}>{item.detail}</p>
                  </div>
                  <span className={styles.rowRef}>{item.ref}</span>
                </article>
              ))
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.boardHead}>
              <h2 className={styles.panelTitle}>
                <Wallet size={18} />
                Payroll overview
              </h2>
            </div>
            <p className={styles.payrollAmount}>{payroll.amount}</p>
            <p className={styles.payrollRun}>{payroll.runLabel}</p>
            <div className={styles.payrollRow}>
              <span>Status</span>
              <span className={styles.payrollStatus}>{payroll.status}</span>
            </div>
            <div className={styles.payrollRow}>
              <span>Next disbursement</span>
              <span className={styles.payrollDate}>{payroll.nextDate}</span>
            </div>
          </section>
        </div>
      </div>

      <div className={`${styles.board} ${styles.boardLower}`}>
        <div className={styles.stack}>
          <div className={styles.changeGrid}>
            <section className={styles.panel}>
              <div className={styles.boardHead}>
                <h2 className={styles.panelTitle}>
                  <KeyRound size={18} />
                  Permission changes
                </h2>
                <Link href="/user-access" className={styles.boardLink}>
                  Manage <ArrowRight size={14} />
                </Link>
              </div>
              {accessChanges.permission.length === 0 ? (
                <p className={styles.emptyCentered}>No recent changes.</p>
              ) : (
                accessChanges.permission.map((item) => (
                  <article key={item.id} className={styles.changeItem}>
                    <p className={styles.changeTitle}>{item.title}</p>
                    <span className={styles.rowTime}>{item.time}</span>
                  </article>
                ))
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.boardHead}>
                <h2 className={styles.panelTitle}>
                  <Percent size={18} />
                  Role changes
                </h2>
                <Link href="/user-access" className={styles.boardLink}>
                  User access <ArrowRight size={14} />
                </Link>
              </div>
              {accessChanges.role.length === 0 ? (
                <p className={styles.emptyCentered}>No recent changes.</p>
              ) : (
                accessChanges.role.map((item) => (
                  <article key={item.id} className={styles.changeItem}>
                    <p className={styles.changeTitle}>{item.title}</p>
                    <span className={styles.rowTime}>{item.time}</span>
                  </article>
                ))
              )}
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.boardHead}>
              <h2 className={styles.panelTitle}>
                <Building2 size={18} />
                Department performance
              </h2>
              <Link href="/reports" className={styles.boardLink}>
                Reports <ArrowRight size={14} />
              </Link>
            </div>
            {departmentPerformance.length === 0 ? (
              <p className={styles.empty}>No department performance yet.</p>
            ) : (
              <div className={styles.chartBlock}>
                {departmentPerformance.map((row) => (
                  <div key={row.id} className={styles.perfRow}>
                    <span className={styles.perfLabel}>{row.name}</span>
                    <div className={styles.perfTrack}>
                      <div
                        className={styles.perfFill}
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                    <span className={styles.perfValue}>{row.value}%</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.boardHead}>
              <h2 className={styles.panelTitle}>
                <TrendingUp size={18} />
                Financial summary
              </h2>
            </div>
            {financialSummary.map((row) => (
              <div key={row.id} className={styles.financeRow}>
                <span>{row.label}</span>
                <span className={styles.financeValue}>{row.value}</span>
              </div>
            ))}
          </section>

          <section className={styles.panel}>
            <div className={styles.boardHead}>
              <h2 className={styles.panelTitle}>
                <PieChart size={18} />
                Operational records
              </h2>
            </div>
            <div className={styles.opsCounts}>
              <div>
                <p className={styles.opsValue}>{operationalRecords.inReview}</p>
                <p className={styles.opsLabel}>In review</p>
              </div>
              <div>
                <p className={styles.opsValue}>{operationalRecords.submitted}</p>
                <p className={styles.opsLabel}>Submitted</p>
              </div>
              <div>
                <p className={styles.opsValue}>{operationalRecords.approved}</p>
                <p className={styles.opsLabel}>Approved</p>
              </div>
            </div>
            <p className={styles.opsNote}>
              Super Admin retains {operationalRecords.permissions} full platform
              permissions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
