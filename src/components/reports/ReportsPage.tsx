"use client";

import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Clock3,
  Download,
  FileSpreadsheet,
  LineChart,
  Search,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  departmentHeadcount,
  headcountGrowth,
  quickExports,
  reportKpis,
  weeklyAttendance,
} from "@/data/reports";
import styles from "./ReportsPage.module.css";

const kpiBadgeClass = {
  up: styles.kpiBadge,
  down: styles.kpiBadgeDown,
  meta: styles.kpiBadgeMeta,
  good: styles.kpiBadge,
} as const;

function HeadcountChart() {
  const width = 420;
  const height = 180;
  const pad = 28;
  const values = headcountGrowth.map((d) => d.value);
  const min = 1000;
  const max = 1400;
  const points = values.map((value, i) => {
    const x = pad + (i * (width - pad * 2)) / (values.length - 1);
    const y = height - pad - ((value - min) / (max - min)) * (height - pad * 2);
    return `${x},${y}`;
  });
  const line = points.join(" ");
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;
  const labels = ["Jan", "Mar", "May", "Jul"];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} aria-hidden>
      <polyline points={area} fill="rgba(255, 90, 31, 0.12)" stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke="#ff5a1f"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {labels.map((label, i) => (
        <text
          key={label}
          x={pad + (i * (width - pad * 2)) / (labels.length - 1)}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#a8a29e"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function DepartmentDonut() {
  const total = departmentHeadcount.reduce((sum, item) => sum + item.value, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={styles.donutWrap}>
      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
        <g transform="rotate(-90 80 80)">
          {departmentHeadcount.map((item) => {
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
        {departmentHeadcount.map((item) => (
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
  const [tab, setTab] = useState<"Overview" | "Saved reports">("Overview");
  const [query, setQuery] = useState("");

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.eyebrow}>Reports &amp; Analytics</p>
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>See the workforce as a whole</h1>
            <p className={styles.subtitle}>
              Get insights, build reports, and export the numbers that matter to
              your teams.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.csvButton}>
              CSV
            </button>
            <button type="button" className={styles.exportButton}>
              <Download size={15} />
              Export report
            </button>
          </div>
        </div>

        <div className={styles.kpis}>
          {reportKpis.map((kpi) => (
            <div key={kpi.id} className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <p className={styles.kpiLabel}>{kpi.label}</p>
                <span className={kpiBadgeClass[kpi.tone]}>{kpi.badge}</span>
              </div>
              <p className={styles.kpiValue}>{kpi.value}</p>
            </div>
          ))}
        </div>

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

        {tab === "Overview" ? (
          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <LineChart size={16} />
                Headcount growth
              </h2>
              <HeadcountChart />
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Clock3 size={16} />
                Weekly attendance %
              </h2>
              <div className={styles.bars}>
                {weeklyAttendance.map((item) => (
                  <div key={item.day} className={styles.barCol}>
                    <div className={styles.barTrack}>
                      <div className={styles.bar} style={{ height: `${item.value}%` }} />
                    </div>
                    <span className={styles.barLabel}>{item.day}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Users size={16} />
                Headcount by department
              </h2>
              <DepartmentDonut />
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <FileSpreadsheet size={16} />
                Quick exports
              </h2>
              <p className={styles.cardHint}>Generate a fresh report in one click.</p>
              <div className={styles.exportList}>
                {quickExports.map((item) => (
                  <button key={item} type="button" className={styles.exportRow}>
                    {item}
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Saved reports</h2>
            <p className={styles.cardHint}>No saved reports yet.</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
