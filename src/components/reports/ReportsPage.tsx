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
  departmentHeadcount as fallbackDeptHeadcount,
  headcountGrowth as fallbackHeadcountGrowth,
  quickExports,
  reportKpis as fallbackKpis,
  weeklyAttendance as fallbackAttendance,
} from "@/data/reports";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { reportsApi } from "@/lib/api";
import { downloadApiBlob } from "@/lib/export/downloadBlob";
import { listFrom, num, str } from "@/lib/api/mappers";
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
  "Full headcount roster": () => reportsApi.headcount(),
  "This month's attendance": () => reportsApi.attendance(),
  "Leave balances snapshot": () => reportsApi.leave(),
  "Payroll summary": () => reportsApi.payroll(),
};

function HeadcountChart({ data }: { data: GrowthPoint[] }) {
  const width = 440;
  const height = 200;
  const padLeft = 44;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 28;
  const values = data.map((d) => d.value);
  const min = 1100;
  const max = 1300;
  const yTicks = [1100, 1150, 1200, 1250, 1300];

  const points = values.map((value, i) => {
    const x =
      padLeft + (i * (width - padLeft - padRight)) / (values.length - 1);
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
          x={padLeft + (i * (width - padLeft - padRight)) / (values.length - 1)}
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
  let offset = 0;

  return (
    <div className={styles.donutWrap}>
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
        <g transform="rotate(-90 80 80)">
          {data.map((item) => {
            const length = (item.value / total) * circumference;
            const circle = (
              <circle
                key={item.label}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="22"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return circle;
          })}
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
  const { runAction, exportRows } = usePageActions();
  const [tab, setTab] = useState<"Overview" | "Saved reports">("Overview");
  const [query, setQuery] = useState("");

  const { data: overview, loading, error } = useAsyncData(
    () => reportsApi.overview(),
    [],
  );
  const { data: growthData } = useAsyncData(
    () => reportsApi.headcountGrowth(),
    [],
  );
  const { data: deptData } = useAsyncData(() => reportsApi.departments(), []);
  const { data: attendanceData } = useAsyncData(
    () => reportsApi.attendance(),
    [],
  );
  const { data: savedData } = useAsyncData(
    () => reportsApi.saved.list(),
    [],
  );

  const reportKpis = useMemo(() => {
    if (!overview) return fallbackKpis;
    const data = overview as Record<string, unknown>;
    return [
      {
        id: "headcount",
        label: "Total Headcount",
        value: str(data.headcount ?? data.totalHeadcount, fallbackKpis[0].value),
        badge: str(data.headcountChange ?? fallbackKpis[0].badge),
        tone: "up" as const,
      },
      {
        id: "attendance",
        label: "Avg Attendance",
        value: str(data.attendance ?? data.avgAttendance, fallbackKpis[1].value),
        badge: fallbackKpis[1].badge,
        tone: "meta" as const,
      },
      {
        id: "attrition",
        label: "Attrition Rate",
        value: str(data.attrition ?? data.attritionRate, fallbackKpis[2].value),
        badge: str(data.attritionChange ?? fallbackKpis[2].badge),
        tone: "down" as const,
      },
      {
        id: "accuracy",
        label: "Report Accuracy",
        value: str(data.accuracy ?? data.reportAccuracy, fallbackKpis[3].value),
        badge: fallbackKpis[3].badge,
        tone: "good" as const,
      },
    ];
  }, [overview]);

  const headcountGrowth = useMemo((): GrowthPoint[] => {
    const payload = growthData as Record<string, unknown> | undefined;
    const records = listFrom(
      (payload?.points ?? payload?.series ?? payload?.data ?? payload) as never,
    );
    if (records.length > 0) {
      return records.map((record) => ({
        month: str(record.month ?? record.label),
        value: num(record.value ?? record.count),
      }));
    }
    return fallbackHeadcountGrowth;
  }, [growthData]);

  const departmentHeadcount = useMemo((): DeptPoint[] => {
    const payload = deptData as Record<string, unknown> | undefined;
    const records = listFrom(
      (payload?.departments ?? payload?.breakdown ?? payload?.data ?? payload) as never,
    );
    if (records.length > 0) {
      return records.map((record, index) => ({
        label: str(record.label ?? record.name ?? record.department),
        value: num(record.value ?? record.count),
        color: str(record.color, deptColors[index % deptColors.length]),
      }));
    }
    return fallbackDeptHeadcount;
  }, [deptData]);

  const weeklyAttendance = useMemo((): AttendancePoint[] => {
    const payload = attendanceData as Record<string, unknown> | undefined;
    const records = listFrom(
      (payload?.days ?? payload?.weekly ?? payload?.data ?? payload) as never,
    );
    if (records.length > 0) {
      return records.map((record) => ({
        day: str(record.day ?? record.label),
        value: num(record.value ?? record.percent),
      }));
    }
    return fallbackAttendance;
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
      await downloadApiBlob("/reports/export", "workforce-report.csv");
    });
  }

  function runQuickExport(label: (typeof quickExports)[number]) {
    void runAction(`Export ${label}`, async () => {
      const payload = await quickExportActions[label]();
      const source = payload as Record<string, unknown>;
      const rows = listFrom(
        (source.data ?? source.rows ?? source.items) as never,
      );
      if (rows.length > 0) {
        exportRows(rows, `${label.toLowerCase().replace(/\s+/g, "-")}.csv`);
        return;
      }
      exportRows([payload as Record<string, unknown>], `${label}.csv`);
    });
  }

  function runSavedReport(id: string, name: string) {
    void runAction(`Run ${name}`, async () => {
      await reportsApi.saved.run(id);
    });
  }

  return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>Monday, August 3</p>
          {loading ? <p className={styles.dateLabel}>Loading reports…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              Using cached reports — {error}
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
