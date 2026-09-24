"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import {
  Download,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { managerApi, superAdminApi, unwrapRecord } from "@/lib/api";
import { downloadApiBlob } from "@/lib/export/downloadBlob";
import { listFrom, nestedStr, num, str } from "@/lib/api/mappers";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import styles from "./ReportsPage.module.css";

type GrowthPoint = { month: string; value: number };
type DeptPoint = { label: string; value: number; color: string };

const deptColors = [
  "#ed5a28",
  "#f06a3a",
  "#e24d1c",
  "#c2410c",
  "#ea580c",
  "#9a3412",
  "#fdba74",
  "#fb923c",
];

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

function withPercent(text: string) {
  if (text === "—" || /%/.test(text)) return text;
  return `${text}%`;
}

function formatKpiValue(value: unknown, keys: string[], suffix = "") {
  const text = metricText(value, keys, suffix);
  if (text === "—") return text;
  const numeric = Number(String(text).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric) || String(text).includes("%")) return text;
  return numeric.toLocaleString("en-US");
}

function chartTicks(min: number, max: number) {
  const span = Math.max(max - min, 1);
  const step = span <= 50 ? 10 : span <= 200 ? 50 : 100;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = niceMin; tick <= niceMax; tick += step) {
    ticks.push(tick);
  }
  return ticks.length ? ticks : [min, max];
}

function HeadcountChart({ data }: { data: GrowthPoint[] }) {
  const width = 520;
  const height = 260;
  const padLeft = 48;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 32;
  const values = data.map((d) => d.value);
  if (values.length === 0) {
    return <p className={styles.emptyChart}>No headcount growth data yet.</p>;
  }
  const yTicks = chartTicks(Math.min(...values), Math.max(...values));
  const min = yTicks[0] ?? Math.min(...values);
  const max = yTicks[yTicks.length - 1] ?? Math.max(...values);
  const range = Math.max(max - min, 1);
  const span = Math.max(values.length - 1, 1);

  const points = values.map((value, i) => {
    const x = padLeft + (i * (width - padLeft - padRight)) / span;
    const y =
      height - padBottom - ((value - min) / range) * (height - padTop - padBottom);
    return `${x},${y}`;
  });

  const line = points.join(" ");
  const area = `${padLeft},${height - padBottom} ${line} ${width - padRight},${height - padBottom}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} aria-hidden>
      {yTicks.map((tick) => {
        const y =
          height - padBottom - ((tick - min) / range) * (height - padTop - padBottom);
        return (
          <g key={tick}>
            <line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke="#f3efe9"
              strokeWidth="1"
            />
            <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#c4bdb6">
              {tick}
            </text>
          </g>
        );
      })}
      <polyline points={area} fill="rgba(237, 90, 40, 0.16)" stroke="none" />
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
          fontSize="12"
          fill="#c4bdb6"
        >
          {item.month}
        </text>
      ))}
    </svg>
  );
}

function DepartmentDonut({ data }: { data: DeptPoint[] }) {
  if (data.length === 0) {
    return <p className={styles.emptyChart}>No department headcount yet.</p>;
  }
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 72;
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
      <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden>
        <g transform="rotate(-90 110 110)">
          {slices.map((item) => (
            <circle
              key={item.label}
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="32"
              strokeDasharray={`${item.length} ${circumference - item.length}`}
              strokeDashoffset={-item.offset}
            />
          ))}
        </g>
        <circle cx="110" cy="110" r="48" fill="#fff" />
      </svg>
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
  const { data: savedData } = useAsyncData(
    () => (manager ? Promise.resolve(null) : superAdminApi.reports.saved.list()),
    [manager],
  );

  const reportKpis = useMemo(() => {
    const data = unwrapRecord(overview);
    const headcount = data.headcount;
    return [
      {
        id: "headcount",
        label: "Total Headcount",
        value: formatKpiValue(headcount ?? data.totalHeadcount, [
          "total",
          "active",
          "count",
        ]),
        badge: str(data.headcountChange, ""),
      },
      {
        id: "attrition",
        label: "Attrition Rate",
        value: withPercent(
          metricText(data.attrition ?? data.attritionRate, [
            "rate",
            "value",
            "percent",
          ]),
        ),
        badge: str(data.attritionChange, ""),
      },
      {
        id: "accuracy",
        label: "Report Accuracy",
        value: withPercent(
          metricText(data.accuracy ?? data.reportAccuracy, [
            "value",
            "percent",
            "score",
          ]),
        ),
        badge: str(data.accuracyNote, ""),
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
    })).filter((item) => item.month);
  }, [growthData]);

  const departmentHeadcount = useMemo((): DeptPoint[] => {
    const payload = unwrapRecord(deptData);
    return listFrom(
      (payload.departments ?? payload.breakdown ?? payload.data ?? deptData) as never,
    ).map((record, index) => ({
      label: str(record.label ?? record.name ?? record.department),
      value: num(record.value ?? record.count),
      color: str(record.color, deptColors[index % deptColors.length]),
    })).filter((item) => item.label);
  }, [deptData]);

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

  function runSavedReport(id: string, name: string) {
    if (manager) return;
    void runAction(`Run ${name}`, async () => {
      await superAdminApi.reports.saved.action(id, "run");
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <PageDateLabel className={styles.dateLabel} />
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
              <Download size={15} strokeWidth={2.25} />
              CSV
            </button>
            <button type="button" className={styles.exportButton} onClick={exportFullReport}>
              <Download size={15} strokeWidth={2.25} />
              Export report
            </button>
          </div>
        </div>

        <div className={styles.kpis}>
          {reportKpis.map((kpi) => (
            <article key={kpi.id} className={styles.kpiCard}>
              <p className={styles.kpiLabel}>{kpi.label}</p>
              <div className={styles.kpiRow}>
                <p className={styles.kpiValue}>{kpi.value}</p>
                {kpi.badge ? (
                  <span className={styles.kpiBadge}>{kpi.badge}</span>
                ) : null}
              </div>
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
                <TrendingUp size={16} strokeWidth={2.25} />
                Headcount growth
              </h2>
              <HeadcountChart data={headcountGrowth} />
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Users size={16} strokeWidth={2.25} />
                Headcount by department
              </h2>
              <DepartmentDonut data={departmentHeadcount} />
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
