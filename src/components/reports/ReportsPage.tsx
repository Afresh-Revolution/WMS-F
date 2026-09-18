"use client";

import { useMemo, useState } from "react";
import {
  Clock3,
  Download,
  FileSpreadsheet,
  LineChart,
  Search,
  Upload,
  Users,
} from "lucide-react";
import {
  quickExports,
} from "@/data/reports";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { ApiError, managerApi, superAdminApi, unwrapRecord } from "@/lib/api";
import { downloadApiBlob } from "@/lib/export/downloadBlob";
import { listFrom, nestedStr, num, str } from "@/lib/api/mappers";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./ReportsPage.module.css";

type GrowthPoint = { month: string; value: number };
type DeptPoint = { label: string; value: number; color: string };
type AttendancePoint = { day: string; value: number };

const kpiBadgeClass = {
  up: styles.kpiBadge,
  down: styles.kpiBadgeDown,
  meta: styles.kpiBadgeMeta,
  good: styles.kpiBadge,
} as const;

const deptColors = ["#ed5a28", "#c2410c", "#fdba74", "#9a3412", "#fed7aa"];

const quickExportActions: Record<
  (typeof quickExports)[number],
  () => Promise<Record<string, unknown>>
> = {
  "Full headcount roster": () => superAdminApi.reports.headcount(),
  "This month's attendance": () => superAdminApi.reports.attendance(),
  "Leave balances snapshot": () => superAdminApi.reports.leave(),
  "Payroll summary": () => superAdminApi.reports.payroll(),
};

function flattenExportRow(record: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      row[key] = nestedStr(value);
      continue;
    }
    if (Array.isArray(value)) continue;
    row[key] = value ?? "";
  }
  return row;
}

function exportableRows(payload: unknown) {
  const listed = listFrom(payload as never);
  if (listed.length > 0) return listed.map(flattenExportRow);

  const record = unwrapRecord(payload);
  for (const key of ["employees", "attendance", "leave", "runs", "payroll"]) {
    const nested = listFrom(record[key] as never);
    if (nested.length > 0) return nested.map(flattenExportRow);
  }

  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === "scope") continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [innerKey, innerValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (innerValue !== null && typeof innerValue !== "object") {
          flat[`${key}.${innerKey}`] = innerValue;
        }
      }
      continue;
    }
    if (Array.isArray(value) || value === null || value === undefined) continue;
    flat[key] = value;
  }
  return Object.keys(flat).length > 0 ? [flat] : [];
}

function metricText(value: unknown, keys: string[], suffix = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      const nested = record[key];
      if (nested !== null && nested !== undefined && typeof nested !== "object") {
        return `${nested}${suffix}`;
      }
    }
    return "—";
  }
  if (value === null || value === undefined || typeof value === "object") {
    return "—";
  }
  return `${value}${suffix}`;
}

async function managerQuickExportPayload(
  label: (typeof quickExports)[number],
) {
  switch (label) {
    case "Full headcount roster":
      return managerApi.listEmployees({ limit: 500 });
    case "This month's attendance":
      return managerApi.listAttendance({ period: "current", limit: 500 });
    case "Leave balances snapshot":
      return managerApi.listLeave({ limit: 500 });
    case "Payroll summary":
      try {
        return await managerApi.listPayrollRuns({ limit: 100 });
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.status === 404 || error.status === 405)
        ) {
          return managerApi.getReports();
        }
        throw error;
      }
  }
}

function HeadcountChart({ data }: { data: GrowthPoint[] }) {
  const width = 440;
  const height = 200;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 28;
  const values = data.map((d) => d.value);
  if (values.length === 0) {
    return <p className={styles.subtitle}>No headcount growth data yet.</p>;
  }
  const min = Math.min(...values, 0);
  const max = Math.max(...values, min + 1);
  const yTicks = [min, min + (max - min) / 2, max].map((tick) =>
    Math.round(tick),
  );
  const span = Math.max(values.length - 1, 1);

  const points = values.map((value, i) => {
    const x =
      padLeft + (i * (width - padLeft - padRight)) / span;
    const y =
      height -
      padBottom -
      ((value - min) / (max - min)) * (height - padTop - padBottom);
    return `${x},${y}`;
  });

  const line = points.join(" ");
  const area = `${padLeft},${height - padBottom} ${line} ${width - padRight},${height - padBottom}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} aria-hidden>
      {yTicks.map((tick) => {
        const y =
          height -
          padBottom -
          ((tick - min) / (max - min)) * (height - padTop - padBottom);
        return (
          <g key={tick}>
            <line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#f5f5f4"
              strokeWidth="1"
            />
            <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#a8a29e">
              {tick}
            </text>
          </g>
        );
      })}
      <polyline points={area} fill="rgba(237, 90, 40, 0.12)" stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke="#ed5a28"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((item, i) => (
        <text
          key={item.month}
          x={padLeft + (i * (width - padLeft - padRight)) / span}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#a8a29e"
        >
          {item.month}
        </text>
      ))}
    </svg>
  );
}

function DepartmentDonut({ data }: { data: DeptPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const slices = data.map((item, index) => {
    const length = (item.value / total) * circumference;
    const offset = data
      .slice(0, index)
      .reduce((sum, prev) => sum + (prev.value / total) * circumference, 0);
    return { ...item, length, offset };
  });

  return (
    <div className={styles.donutWrap}>
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
        <g transform="rotate(-90 80 80)">
          {slices.map((item) => (
              <circle
                key={item.label}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="22"
                strokeDasharray={`${item.length} ${circumference - item.length}`}
                strokeDashoffset={-item.offset}
              />
            ))}
        </g>
        <circle cx="80" cy="80" r="38" fill="#fff" />
      </svg>
      <div className={styles.legend}>
        {data.map((item) => (
          <span key={item.label} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const manager = useManagerPortal();
  const { runAction, exportRows } = usePageActions();
  const [tab, setTab] = useState<"Overview" | "Saved reports">("Overview");
  const [query, setQuery] = useState("");

  const { data: overview, loading, error } = useAsyncData(
    () => (manager ? managerApi.getReports() : superAdminApi.reports.overview()),
    [manager],
  );
  const { data: growthData } = useAsyncData(
    () =>
      manager ? managerApi.getReports() : superAdminApi.reports.headcountGrowth(),
    [manager],
  );
  const { data: deptData } = useAsyncData(
    () =>
      manager ? managerApi.getReports() : superAdminApi.reports.departments(),
    [manager],
  );
  const { data: attendanceData } = useAsyncData(
    () =>
      manager ? managerApi.getReports() : superAdminApi.reports.attendance(),
    [manager],
  );
  const { data: savedData } = useAsyncData(
    () => (manager ? Promise.resolve(null) : superAdminApi.reports.saved.list()),
    [manager],
  );

  const reportKpis = useMemo(() => {
    const data = unwrapRecord(overview);
    const headcount = data.headcount;
    const attendance = data.attendance;
    return [
      {
        id: "headcount",
        label: "Total Headcount",
        value: metricText(headcount ?? data.totalHeadcount, [
          "total",
          "active",
          "count",
        ]),
        badge: str(data.headcountChange, ""),
        tone: "up" as const,
      },
      {
        id: "attendance",
        label: "Avg Attendance",
        value: metricText(
          attendance ?? data.avgAttendance,
          ["attendanceRate", "rate", "present"],
          typeof attendance === "object" ? "%" : "",
        ),
        badge: str(data.attendanceWindow, ""),
        tone: "meta" as const,
      },
      {
        id: "attrition",
        label: "Attrition Rate",
        value: metricText(data.attrition ?? data.attritionRate, [
          "rate",
          "value",
          "percent",
        ]),
        badge: str(data.attritionChange, ""),
        tone: "down" as const,
      },
      {
        id: "accuracy",
        label: "Report Accuracy",
        value: metricText(data.accuracy ?? data.reportAccuracy, [
          "value",
          "percent",
          "score",
        ]),
        badge: str(data.accuracyNote, ""),
        tone: "good" as const,
      },
    ];
  }, [overview]);

  const headcountGrowth = useMemo((): GrowthPoint[] => {
    const payload = unwrapRecord(growthData);
    return listFrom(
      (payload.points ?? payload.series ?? payload.data ?? growthData) as never,
    ).map((record) => ({
      month: str(record.month ?? record.label),
      value: num(record.value ?? record.count),
    }));
  }, [growthData]);

  const departmentHeadcount = useMemo((): DeptPoint[] => {
    const payload = unwrapRecord(deptData);
    return listFrom(
      (payload.departments ?? payload.breakdown ?? payload.data ?? deptData) as never,
    ).map((record, index) => ({
      label: str(record.label ?? record.name ?? record.department),
      value: num(record.value ?? record.count),
      color: str(record.color, deptColors[index % deptColors.length]),
    }));
  }, [deptData]);

  const weeklyAttendance = useMemo((): AttendancePoint[] => {
    const payload = unwrapRecord(attendanceData);
    return listFrom(
      (payload.days ?? payload.weekly ?? payload.data ?? attendanceData) as never,
    ).map((record) => ({
      day: str(record.day ?? record.label),
      value: num(record.value ?? record.percent),
    }));
  }, [attendanceData]);

  const savedReports = useMemo(() => listFrom(savedData ?? undefined), [savedData]);

  function exportCsvOverview() {
    exportRows(
      reportKpis.map((kpi) => ({
        metric: kpi.label,
        value: kpi.value,
        change: kpi.badge,
      })),
      "reports-overview.csv",
    );
  }

  function exportFullReport() {
    void runAction("Export report", async () => {
      if (manager) {
        const employees = await managerApi.listEmployees({ limit: 500 });
        const rows = exportableRows(employees);
        if (rows.length > 0) {
          exportRows(rows, "workforce-report.csv");
          return;
        }
        const reports = await managerApi.getReports();
        exportRows(exportableRows(reports), "workforce-report.csv");
        return;
      }
      await downloadApiBlob(
        superAdminApi.reports.exportPath(),
        "workforce-report.csv",
      );
    });
  }

  function runQuickExport(label: (typeof quickExports)[number]) {
    void runAction(`Export ${label}`, async () => {
      const payload = manager
        ? await managerQuickExportPayload(label)
        : await quickExportActions[label]();
      const rows = exportableRows(payload);
      exportRows(
        rows,
        `${label.toLowerCase().replace(/\s+/g, "-")}.csv`,
      );
    });
  }

  function runSavedReport(id: string, name: string) {
    if (manager) return;
    void runAction(`Run ${name}`, async () => {
      await superAdminApi.reports.saved.action(id, "run");
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          {loading ? <p className={styles.dateLabel}>Loading reports…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </label>
            <NotificationsLink className={styles.iconButton} />
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Reports &amp; Exports</p>
            <h1 className={styles.title}>See the workforce as a whole</h1>
            <p className={styles.subtitle}>
              Explore trends, build reports, and export the numbers that matter to
              your teams.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.csvButton} onClick={exportCsvOverview}>
              <FileSpreadsheet size={15} strokeWidth={2} />
              CSV
            </button>
            <button type="button" className={styles.exportButton} onClick={exportFullReport}>
              <Upload size={15} strokeWidth={2} />
              Export report
            </button>
          </div>
        </div>

        <div className={styles.kpis}>
          {reportKpis.map((kpi) => (
            <article key={kpi.id} className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <p className={styles.kpiLabel}>{kpi.label}</p>
                <span className={kpiBadgeClass[kpi.tone]}>{kpi.badge}</span>
              </div>
              <p className={styles.kpiValue}>{kpi.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.tabsWrap}>
          <div className={styles.tabs}>
            {(["Overview", "Saved reports"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`${styles.tab} ${tab === item ? styles.tabActive : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {tab === "Overview" ? (
          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <LineChart size={16} strokeWidth={2} />
                Headcount growth
              </h2>
              <HeadcountChart data={headcountGrowth} />
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Clock3 size={16} strokeWidth={2} />
                Weekly attendance %
              </h2>
              <div className={styles.barChart}>
                <div className={styles.barYAxis}>
                  {[100, 75, 50, 25, 0].map((tick) => (
                    <span key={tick} className={styles.barYTick}>
                      {tick}
                    </span>
                  ))}
                </div>
                <div className={styles.bars}>
                  {weeklyAttendance.map((item) => (
                    <div key={item.day} className={styles.barCol}>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.bar}
                          style={{ height: `${item.value}%` }}
                        />
                      </div>
                      <span className={styles.barLabel}>{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Users size={16} strokeWidth={2} />
                Headcount by department
              </h2>
              <DepartmentDonut data={departmentHeadcount} />
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Quick exports</h2>
              <p className={styles.cardHint}>
                Generate a fresh export in one click.
              </p>
              <div className={styles.exportList}>
                {quickExports.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={styles.exportRow}
                    onClick={() => runQuickExport(item)}
                  >
                    {item}
                    <Download size={16} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Saved reports</h2>
            {savedReports.length === 0 ? (
              <p className={styles.cardHint}>No saved reports yet.</p>
            ) : (
              <ul className={styles.savedList}>
                {savedReports.map((report, index) => {
                  const id = str(report.id, String(index));
                  const name = str(report.name ?? report.title);
                  return (
                    <li key={id} className={styles.savedRow}>
                      <span>{name}</span>
                      <button
                        type="button"
                        className={styles.savedRunButton}
                        onClick={() => runSavedReport(id, name)}
                      >
                        Run
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
  );
}
