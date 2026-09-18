"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import { useMemo } from "react";
import {
  Bell,
  ChartColumn,
  Download,
  FileText,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi, accountantSettled } from "@/lib/api";
import { mapAccountantReports } from "@/lib/api/accountantMappers";
import {
  accountantExpensesByCategory,
  accountantPayrollTrend,
  accountantReportSummary,
  accountantSpendMix,
} from "@/data/accountantReports";
import styles from "./AccountantReportsPage.module.css";

function PayrollTrendChart({
  items,
}: {
  items: { month: string; value: number }[];
}) {
  const max = Math.max(8000000, ...items.map((item) => item.value), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(max * part));

  return (
    <div className={styles.trendChart} role="img" aria-label="Net payroll trend">
      <div className={styles.trendPlot}>
        <div className={styles.trendGrid}>
          {ticks.map((tick) => (
            <div key={tick} className={styles.trendGridLine}>
              <span className={styles.trendTick}>
                {tick === 0 ? "₦ 0" : `₦ ${(tick / 1000000).toFixed(1)}M`}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.trendBars}>
          {items.map((item) => (
            <div key={item.month} className={styles.trendBarCol}>
              <div
                className={styles.trendBar}
                style={{ height: `${(item.value / max) * 100}%` }}
                title={`₦ ${item.value.toLocaleString("en-NG")}`}
              />
              <span className={styles.trendLabel}>{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpendMixDonut({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const slices = items.map((item, index) => {
    const length = (item.value / total) * circumference;
    const offset = items
      .slice(0, index)
      .reduce((sum, prev) => sum + (prev.value / total) * circumference, 0);
    return { ...item, length, offset };
  });

  return (
    <div className={styles.donutWrap}>
      <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden>
        <g transform="rotate(-90 90 90)">
          {slices.map((item) => (
              <circle
                key={item.label}
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="26"
                strokeDasharray={`${item.length} ${circumference - item.length}`}
                strokeDashoffset={-item.offset}
              />
            ))}
        </g>
        <circle cx="90" cy="90" r="40" fill="#fff" />
      </svg>
      <div className={styles.legend}>
        {items.map((item) => (
          <span key={item.label} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExpensesCategoryChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(100000, ...items.map((item) => item.value), 1);

  return (
    <div
      className={styles.categoryChart}
      role="img"
      aria-label="Expenses by category"
    >
      <div className={styles.categoryRows}>
        {items.map((item) => (
          <div key={item.label} className={styles.categoryRow}>
            <span className={styles.categoryLabel}>{item.label}</span>
            <div className={styles.categoryTrack}>
              <div
                className={styles.categoryBar}
                style={{ width: `${(item.value / max) * 100}%` }}
                title={`₦ ${item.value.toLocaleString("en-NG")}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.categoryAxis}>
        <span>₦ 0</span>
        <span>₦ 25K</span>
        <span>₦ 50K</span>
        <span>₦ 75K</span>
        <span>₦ 100K</span>
      </div>
    </div>
  );
}

const summaryIcons = {
  payroll: Wallet,
  paid: TrendingUp,
  bills: FileText,
  expenses: ChartColumn,
} as const;

export function AccountantReportsPage() {
  const { runAction } = usePageActions();
  const { data, loading, error } = useAsyncData(async () => {
    const [reports, summary] = await Promise.all([
      accountantApi.reports.get(),
      accountantSettled(accountantApi.reports.summary()),
    ]);
    return { reports, summary };
  }, []);

  const view = useMemo(
    () =>
      mapAccountantReports(data?.reports, data?.summary, {
        summary: accountantReportSummary,
        trend: accountantPayrollTrend,
        spendMix: accountantSpendMix,
        expensesByCategory: accountantExpensesByCategory,
      }),
    [data],
  );

  async function handleGenerate() {
    await runAction("Generate report", async () => {
      await accountantApi.reports.export();
    });
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="reports" />
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
            />
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </label>
          <Link
            href="/accountant/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <Link
            href="/accountant/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            RK
          </Link>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Accountant · Financial Reports</p>
          <h1 className={styles.title}>Financial reports</h1>
          <p className={styles.subtitle}>
            A consolidated view of payroll, spend, expenses and outstanding
            obligations.
          </p>
        </div>
        <button
          type="button"
          className={styles.generateButton}
          onClick={() => void handleGenerate()}
        >
          <Download size={16} />
          Generate report
        </button>
      </div>

      <div className={styles.summaryGrid}>
        {view.summary.map((item) => {
          const Icon = summaryIcons[item.icon];
          return (
            <article key={item.id} className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <span className={styles.summaryIcon} aria-hidden>
                  <Icon size={16} />
                </span>
                <p className={styles.summaryLabel}>{item.label}</p>
              </div>
              <p className={styles.summaryValue}>{item.value}</p>
            </article>
          );
        })}
      </div>

      <div className={styles.chartsRow}>
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Net payroll trend</h2>
          <PayrollTrendChart items={view.trend} />
        </section>
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Spend mix</h2>
          <SpendMixDonut items={view.spendMix} />
        </section>
      </div>

      <section className={styles.chartCard}>
        <div className={styles.chartTitleRow}>
          <span className={styles.chartTitleIcon} aria-hidden>
            <ChartColumn size={16} />
          </span>
          <h2 className={styles.chartTitle}>Expenses by category</h2>
        </div>
        <ExpensesCategoryChart items={view.expensesByCategory} />
      </section>
    </div>
  );
}
