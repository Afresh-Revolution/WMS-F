"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import {
  accountantBills as fallbackBills,
  accountantPayrollSummary as fallbackPayroll,
  accountantPurchaseReviews as fallbackPurchases,
  accountantRecentPayments as fallbackPayments,
  accountantStats as fallbackStats,
  type AccountantStatTone,
} from "@/data/accountantOverview";
import { GpsCheckInCard } from "@/components/attendance/GpsCheckInCard";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import { accountantApi, accountantSettled } from "@/lib/api";
import {
  asRecord,
  mapDashboardPayrollSummary,
  mapOverviewBill,
  mapOverviewPayment,
  mapOverviewPurchase,
  overlayAccountantStats,
  unwrapAccountantData,
  unwrapAccountantList,
  withFallback,
} from "@/lib/api/accountantMappers";
import styles from "./AccountantOverviewPage.module.css";

const toneClass: Record<AccountantStatTone, string> = {
  neutral: styles.metaNeutral,
  info: styles.metaInfo,
  success: styles.metaSuccess,
  warning: styles.metaWarning,
  danger: styles.metaDanger,
  muted: styles.metaMuted,
};

export function AccountantOverviewPage() {
  const { data, loading, error } = useAsyncData(async () => {
    const [dashboard, stats] = await Promise.all([
      accountantApi.dashboard(),
      accountantSettled(accountantApi.dashboardStats()),
    ]);
    return { dashboard, stats };
  }, []);

  const dashboard = asRecord(unwrapAccountantData(data?.dashboard));
  const stats = overlayAccountantStats(fallbackStats, data?.stats ?? dashboard);
  const bills = withFallback(
    unwrapAccountantList(dashboard.bills ?? dashboard.unpaidBills).map(mapOverviewBill),
    fallbackBills,
  );
  const purchases = withFallback(
    unwrapAccountantList(
      dashboard.purchases ?? dashboard.purchaseReviews ?? dashboard.queue,
    ).map(mapOverviewPurchase),
    fallbackPurchases,
  );
  const mappedPayroll = mapDashboardPayrollSummary(dashboard.payroll ?? dashboard);
  const payrollSummary = {
    period: mappedPayroll.period || fallbackPayroll.period,
    status: mappedPayroll.status || fallbackPayroll.status,
    staff: mappedPayroll.staff || fallbackPayroll.staff,
    lines:
      mappedPayroll.lines.length > 0 ? mappedPayroll.lines : fallbackPayroll.lines,
  };
  const payments = withFallback(
    unwrapAccountantList(dashboard.payments ?? dashboard.recentPayments).map(
      mapOverviewPayment,
    ),
    fallbackPayments,
  );

  const heroSubtitle = useMemo(() => {
    const overdue = stats.find((item) => item.id === "overdue")?.value ?? "0";
    const increments = stats.find((item) => item.id === "increments")?.value ?? "0";
    const prep = stats.find((item) => item.id === "prep")?.value ?? "0";
    return `Payroll is ${prep} prepared. ${overdue} overdue bills and ${increments} approved increments need action.`;
  }, [stats]);

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="dashboard" />
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

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Accountant — Finance Desk</p>
          <h1 className={styles.heroTitle}>
            The August 2026 pay cycle is in progress.
          </h1>
          <p className={styles.heroSubtitle}>
            {heroSubtitle}
          </p>
          <Link href="/accountant/payroll" className={styles.heroButton}>
            Open payroll →
          </Link>
        </div>
        <div className={styles.heroDecoration} aria-hidden>
          <div className={styles.heroDecorationInner} />
        </div>
      </section>

      <GpsCheckInCard portal="accountant" />

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <div className={styles.statBody}>
              <p className={styles.statValue}>{stat.value}</p>
              <span
                className={`${styles.statMeta} ${toneClass[stat.tone ?? "muted"]}`}
              >
                {stat.meta}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.columns}>
        <div className={styles.leftColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Bills &amp; obligations</h2>
              <Link href="/accountant/bills" className={styles.cardLink}>
                View all
              </Link>
            </div>
            <ul className={styles.list}>
              {bills.map((bill) => (
                <li key={bill.id} className={styles.listRow}>
                  <div className={styles.listMain}>
                    <p className={styles.listTitle}>{bill.name}</p>
                    <p className={styles.listSub}>
                      {bill.category} · {bill.dueDate}
                    </p>
                  </div>
                  <div className={styles.listAside}>
                    <p className={styles.listAmount}>{bill.amount}</p>
                    <span
                      className={
                        bill.overdue ? styles.timingOverdue : styles.timing
                      }
                    >
                      {bill.timing}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Purchase reviews</h2>
              <Link href="/accountant/purchases" className={styles.cardLink}>
                Open queue
              </Link>
            </div>
            <ul className={styles.list}>
              {purchases.map((item) => (
                <li key={item.id} className={styles.listRow}>
                  <div className={styles.listMain}>
                    <p className={styles.listTitle}>{item.title}</p>
                    <p className={styles.listSub}>
                      {item.department} · {item.requestor}
                    </p>
                  </div>
                  <div className={styles.listAside}>
                    <p className={styles.listAmount}>{item.amount}</p>
                    <span
                      className={
                        item.action === "Pay"
                          ? styles.actionPay
                          : styles.actionReview
                      }
                    >
                      {item.action}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className={styles.rightColumn}>
          <section className={styles.card}>
            <div className={styles.payrollHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  {payrollSummary.period}
                </h2>
                <p className={styles.payrollMeta}>
                  {payrollSummary.status} ·{" "}
                  {payrollSummary.staff} staff
                </p>
              </div>
            </div>
            <ul className={styles.payrollLines}>
              {payrollSummary.lines.map((line) => (
                <li
                  key={line.label}
                  className={`${styles.payrollLine} ${
                    line.emphasize ? styles.payrollLineEmphasized : ""
                  }`}
                >
                  <span>{line.label}</span>
                  <strong>{line.value}</strong>
                </li>
              ))}
            </ul>
            <Link href="/accountant/payroll" className={styles.payrollButton}>
              Open payroll
            </Link>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent payments</h2>
            </div>
            <ul className={styles.list}>
              {payments.map((payment) => (
                <li key={payment.id} className={styles.listRow}>
                  <div className={styles.listMain}>
                    <p className={styles.listTitle}>{payment.name}</p>
                    <p className={styles.listSub}>
                      {payment.type} · {payment.date}
                    </p>
                  </div>
                  <p className={styles.listAmount}>{payment.amount}</p>
                </li>
              ))}
            </ul>
            <Link href="/accountant/payments" className={styles.footerLink}>
              Open payments register →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
