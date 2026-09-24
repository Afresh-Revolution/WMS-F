"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  GraduationCap,
  Megaphone,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  listManagerAnnouncements,
  managerApi,
} from "@/lib/api";
import { asRecord, unwrapRecord } from "@/lib/api";
import {
  listFrom,
  mapAnnouncement,
  mapPlacement,
  nestedStr,
  num,
  str,
} from "@/lib/api/mappers";
import styles from "./ManagerHomePage.module.css";

async function settle<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function records(value: unknown) {
  return listFrom(value ?? undefined).map((item) => asRecord(item));
}

function statusOf(record: Record<string, unknown>) {
  return str(record.status ?? record.state ?? record.approvalStatus).toLowerCase();
}

function isPendingStatus(status: string) {
  return /pend|await|review|submit|open|queued|draft|schedul/.test(status);
}

function isExitedStatus(status: string) {
  return /exit|terminat|inactiv|offboard|resign|former|left/.test(status);
}

function isOverdueStatus(record: Record<string, unknown>) {
  const status = statusOf(record);
  if (record.overdue === true || /overdue/.test(status)) return true;
  const due = str(record.dueDate ?? record.due_at ?? record.dueOn);
  if (!due) return false;
  const date = new Date(due);
  return Number.isFinite(date.getTime()) && date.getTime() < Date.now() && !/paid|settled/.test(status);
}

function moneyNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNaira(value: unknown) {
  if (typeof value === "string" && /[₦N]/.test(value)) return value;
  const amount = moneyNumber(value);
  if (!amount) return str(value) || "—";
  return `₦ ${Math.round(amount).toLocaleString("en-NG")}`;
}

function formatNairaCompact(value: unknown) {
  if (typeof value === "string" && /[₦N]/.test(value)) return value;
  const amount = moneyNumber(value);
  if (!amount) return "—";
  if (Math.abs(amount) >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

function timeAgo(value: unknown) {
  const raw = str(value);
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function weeksUntil(value: unknown) {
  const date = new Date(str(value));
  if (!Number.isFinite(date.getTime())) return "";
  const weeks = Math.max(0, Math.round((date.getTime() - Date.now()) / 604_800_000));
  return weeks === 1 ? "in 1 week" : `in ${weeks} weeks`;
}

function overdueLabel(record: Record<string, unknown>) {
  const timing = str(record.timing ?? record.overdueLabel);
  if (timing) return timing;
  const due = str(record.dueDate ?? record.due_at ?? record.dueOn);
  const date = new Date(due);
  if (!Number.isFinite(date.getTime())) return "Overdue";
  const days = Math.max(1, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  return `${days}d overdue`;
}

function departmentName(record: Record<string, unknown>) {
  return nestedStr(
    record.department,
    ["name", "title", "label"],
    str(record.departmentName ?? record.dept),
  );
}

function personName(record: Record<string, unknown>) {
  return str(
    record.employeeName ??
      record.fullName ??
      record.name ??
      record.requestor ??
      record.submittedBy ??
      nestedStr(record.employee ?? record.user ?? record.requestedBy, ["name", "fullName"]),
  );
}

export function ManagerHomePage() {
  const { data, loading, error } = useAsyncData(async () => {
    const limit = { limit: 100 };
    const [
      dashboard,
      stats,
      employees,
      departments,
      leave,
      promotions,
      salary,
      payrollRuns,
      expenses,
      purchases,
      finance,
      meetings,
      nysc,
      announcements,
      audit,
      targets,
      approvals,
    ] = await Promise.all([
      settle(managerApi.getDashboard()),
      settle(managerApi.getDashboardStats()),
      settle(managerApi.listEmployees(limit)),
      settle(managerApi.listDepartments(limit)),
      settle(managerApi.listLeave(limit)),
      settle(managerApi.listPromotions(limit)),
      settle(managerApi.listSalaryRecommendations(limit)),
      settle(managerApi.listPayrollRuns(limit)),
      settle(managerApi.listExpenses(limit)),
      settle(managerApi.listProcurementRequests(limit)),
      settle(managerApi.listFinance(limit)),
      settle(managerApi.listMeetings(limit)),
      settle(managerApi.listNyscInterns({ ...limit, status: "ENDING_SOON" })),
      settle(listManagerAnnouncements(limit)),
      settle(managerApi.listAuditLogs(limit)),
      settle(managerApi.listTargets(limit)),
      settle(managerApi.listApprovals(limit)),
    ]);

    return {
      dashboard,
      stats,
      employees,
      departments,
      leave,
      promotions,
      salary,
      payrollRuns,
      expenses,
      purchases,
      finance,
      meetings,
      nysc,
      announcements,
      audit,
      targets,
      approvals,
    };
  }, []);

  const overview = unwrapRecord(data?.dashboard);
  const metrics = unwrapRecord(
    data?.stats ?? overview.metrics ?? overview.summary ?? overview.counts,
  );
  const finance = asRecord(data?.finance);
  const employees = records(data?.employees);
  const leave = records(data?.leave);
  const promotions = records(data?.promotions);
  const salary = records(data?.salary);
  const payrollRuns = records(data?.payrollRuns);
  const expenses = records(data?.expenses);
  const purchases = records(data?.purchases);
  const bills = records(finance.bills ?? finance.invoices ?? overview.bills);
  const meetings = records(data?.meetings);
  const nysc = records(data?.nysc);
  const announcements = records(data?.announcements);
  const audit = records(data?.audit);
  const targets = records(data?.targets);
  const approvals = records(data?.approvals);

  const reimbursements = expenses.filter((record) =>
    /reimburse/i.test(str(record.category ?? record.type ?? record.title)),
  );

  const pendingLeave = leave.filter((record) => isPendingStatus(statusOf(record))).length;
  const pendingPromotions = promotions.filter((record) =>
    isPendingStatus(statusOf(record)),
  ).length;
  const pendingSalary = salary.filter((record) => isPendingStatus(statusOf(record))).length;
  const pendingPayroll = payrollRuns.filter((record) =>
    isPendingStatus(statusOf(record)),
  ).length;
  const pendingPurchases = purchases.filter((record) =>
    isPendingStatus(statusOf(record)),
  ).length;
  const pendingBills = bills.filter((record) => isPendingStatus(statusOf(record))).length;
  const pendingExpenses = expenses.filter((record) =>
    isPendingStatus(statusOf(record)),
  ).length;
  const pendingReimbursements = reimbursements.filter((record) =>
    isPendingStatus(statusOf(record)),
  ).length;

  const awaiting = [
    { label: "Leave", value: num(metrics.pendingLeave ?? overview.pendingLeave, pendingLeave) },
    {
      label: "Promotions",
      value: num(metrics.pendingPromotions ?? overview.pendingPromotions, pendingPromotions),
    },
    {
      label: "Salary increments",
      value: num(metrics.pendingSalary ?? overview.pendingSalaryIncrements, pendingSalary),
    },
    {
      label: "Payroll schedules",
      value: num(metrics.pendingPayroll ?? overview.pendingPayroll, pendingPayroll),
    },
    {
      label: "Purchases",
      value: num(metrics.pendingPurchases ?? overview.pendingPurchases, pendingPurchases),
    },
    { label: "Bills", value: num(metrics.pendingBills ?? overview.pendingBills, pendingBills) },
    {
      label: "Expenses",
      value: num(metrics.pendingExpenses ?? overview.pendingExpenses, pendingExpenses),
    },
    {
      label: "Reimbursements",
      value: num(
        metrics.pendingReimbursements ?? overview.pendingReimbursements,
        pendingReimbursements,
      ),
    },
  ];

  const awaitingDecisions = awaiting.reduce((sum, item) => sum + item.value, 0);

  const activeEmployees = employees.filter((record) => !isExitedStatus(statusOf(record)));
  const exitedEmployees = employees.filter((record) => isExitedStatus(statusOf(record)));
  const overdueBills = bills.filter((record) => isOverdueStatus(record));

  const monthlySalaryRaw =
    overview.monthlyPayroll ??
    overview.monthlySalary ??
    metrics.monthlyPayroll ??
    metrics.monthlySalary ??
    payrollRuns[0]?.total ??
    payrollRuns[0]?.amount ??
    payrollRuns[0]?.netPay;
  const monthlySalary = formatNairaCompact(monthlySalaryRaw);
  const salaryPeriod = str(
    overview.payrollPeriod ?? metrics.period ?? payrollRuns[0]?.period ?? payrollRuns[0]?.month,
    new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  );

  const headlineStats = [
    {
      label: "Active employees",
      value: str(overview.totalEmployees ?? metrics.totalEmployees, String(activeEmployees.length)),
      meta: "Live",
      urgent: false,
    },
    {
      label: "Exited employees",
      value: str(overview.exitedEmployees ?? metrics.exitedEmployees, String(exitedEmployees.length)),
      meta: "This year",
      urgent: false,
    },
    {
      label: "Monthly salary",
      value: monthlySalary,
      meta: salaryPeriod,
      urgent: false,
    },
    {
      label: "Overdue bills",
      value: str(overview.overdueBills ?? metrics.overdueBills, String(overdueBills.length)),
      meta: overdueBills.length ? "Urgent" : "None",
      urgent: overdueBills.length > 0,
    },
  ];

  const queueItems = useMemo(() => {
    const source =
      approvals.length > 0
        ? approvals
        : [...purchases, ...salary, ...leave, ...promotions].filter((record) =>
            isPendingStatus(statusOf(record)),
          );
    return source.slice(0, 6).map((record) => {
      const title = str(
        record.title ?? record.summary ?? record.description ?? record.type ?? record.leaveType,
        "Approval request",
      );
      const from = moneyNumber(record.currentSalary ?? record.fromAmount);
      const to = moneyNumber(record.proposedSalary ?? record.toAmount ?? record.amount);
      const amount =
        from && to
          ? `${formatNaira(from)} → ${formatNaira(to)}`
          : moneyNumber(record.amount ?? record.total)
            ? formatNaira(record.amount ?? record.total)
            : "";
      return {
        id: str(record.id ?? record._id ?? record.ref, title),
        ref: str(record.ref ?? record.reference ?? record.code),
        status: str(record.status ?? record.state, "Pending"),
        title,
        department: departmentName(record),
        by: personName(record),
        amount,
        href: /salary|increment/i.test(title)
          ? "/manager/salary-increments"
          : /promot/i.test(title)
            ? "/manager/promotions"
            : /leave/i.test(title)
              ? "/manager/leave"
              : "/manager/finance-payroll",
      };
    });
  }, [approvals, leave, promotions, purchases, salary]);

  const overdueBillItems = overdueBills.slice(0, 4).map((record) => ({
    id: str(record.id ?? record._id ?? record.vendor),
    vendor: str(record.vendor ?? record.vendorName ?? record.name, "Vendor"),
    amount: formatNaira(record.amount ?? record.total ?? record.balance),
    timing: overdueLabel(record),
  }));

  const monthSummary = [
    {
      label: "Salary total",
      value: formatNairaCompact(
        overview.salaryTotal ?? metrics.salaryTotal ?? finance.salaryTotal ?? monthlySalaryRaw,
      ),
    },
    {
      label: "Bonus total",
      value: formatNairaCompact(overview.bonusTotal ?? metrics.bonusTotal ?? finance.bonusTotal),
    },
    {
      label: "Company expenses",
      value: formatNairaCompact(
        overview.companyExpenses ??
          metrics.companyExpenses ??
          finance.expensesTotal ??
          expenses.reduce((sum, record) => sum + moneyNumber(record.amount ?? record.total), 0),
      ),
    },
  ];

  const employeesByDepartment = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of records(data?.departments)) {
      const name = str(record.name ?? record.title);
      const count = num(record.employeeCount ?? record.employees ?? record.headcount);
      if (name && count) counts.set(name, count);
    }
    if (counts.size === 0) {
      for (const employee of activeEmployees) {
        const name = departmentName(employee) || "Unassigned";
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    const rows = [...counts.entries()].map(([name, value]) => ({ name, value }));
    const max = Math.max(...rows.map((row) => row.value), 1);
    return rows.map((row) => ({ ...row, max }));
  }, [activeEmployees, data?.departments]);

  const departmentPerformance = useMemo(() => {
    const fromOverview = records(
      overview.departmentPerformance ?? overview.performance ?? metrics.departmentPerformance,
    ).map((record) => ({
      name: str(record.name ?? record.department),
      value: num(record.value ?? record.score ?? record.progress),
    }));
    if (fromOverview.length) return fromOverview.filter((row) => row.name);
    const grouped = new Map<string, number[]>();
    for (const record of targets) {
      const name = departmentName(record);
      if (!name) continue;
      grouped.set(name, [...(grouped.get(name) ?? []), num(record.progress ?? record.value ?? record.score)]);
    }
    return [...grouped.entries()].map(([name, values]) => ({
      name,
      value: Math.round(values.reduce((sum, item) => sum + item, 0) / values.length),
    }));
  }, [metrics.departmentPerformance, overview, targets]);

  const targetsAtRisk = targets
    .filter((record) => num(record.progress ?? record.value ?? record.score, 100) < 70)
    .slice(0, 3)
    .map((record) => ({
      id: str(record.id ?? record._id ?? record.title),
      title: str(record.title ?? record.name, "Target"),
      department: departmentName(record),
      value: `${num(record.progress ?? record.value ?? record.score)}%`,
    }));

  const upcomingMeetings = meetings
    .filter((record) => {
      const date = new Date(str(record.startsAt ?? record.startAt ?? record.date ?? record.scheduledAt));
      return !Number.isFinite(date.getTime()) || date.getTime() >= Date.now() - 86_400_000;
    })
    .slice(0, 3)
    .map((record) => {
      const date = new Date(str(record.startsAt ?? record.startAt ?? record.date ?? record.scheduledAt));
      return {
        id: str(record.id ?? record._id ?? record.title),
        title: str(record.title ?? record.name, "Meeting"),
        when: Number.isFinite(date.getTime())
          ? date.toLocaleString("en-US", {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })
          : str(record.when ?? record.time),
      };
    });

  const exitingInterns = (nysc.length ? nysc : records(overview.nyscExiting))
    .map((record) => mapPlacement(record))
    .filter((item) => item.name)
    .slice(0, 3)
    .map((item) => ({
      id: item.id || item.name,
      name: item.name,
      department: item.department,
      when: weeksUntil(item.endDate) || item.status,
    }));

  const recentAnnouncements = announcements
    .map((record) => mapAnnouncement(record))
    .slice(0, 3)
    .map((item) => ({
      id: item.id || item.title,
      title: item.title,
      when: timeAgo(item.date),
    }));

  const recentActivity = audit.slice(0, 6).map((record, index) => ({
    id: str(record.id ?? record._id, String(index)),
    title: str(record.title ?? record.action ?? record.summary ?? record.message, "Activity"),
    detail: str(
      record.description ??
        record.details ??
        [record.ref ?? record.reference, record.employeeName ?? personName(record)]
          .filter(Boolean)
          .join(" · "),
    ),
    when: timeAgo(record.time ?? record.createdAt ?? record.occurredAt),
  }));

  return (
    <div className={styles.page}>
      <AccountantStatusLine
        loading={loading}
        error={error}
        resource="manager workspace"
      />

      {/* Shared manager navbar lives in ManagerShell. */}

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Admin · Operations control</p>
          <h1 className={styles.heroTitle}>Your workforce is in motion.</h1>
          <p className={styles.heroSubtitle}>
            You are the final operational approver. Review decisions, monitor
            finances and keep every department on track.
          </p>
          <Link href="/manager/leave" className={styles.heroButton}>
            Review approvals <ArrowRight size={14} />
          </Link>
        </div>
        <p className={styles.heroAwaiting}>
          <span>Awaiting you</span>
          <strong>
            {awaitingDecisions} decision{awaitingDecisions === 1 ? "" : "s"}
          </strong>
        </p>
      </section>

      <section className={styles.stats} aria-label="Workforce summary">
        {headlineStats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <div className={styles.statBody}>
              <strong>{stat.value}</strong>
              <span className={stat.urgent ? styles.statMetaUrgent : styles.statMeta}>
                {stat.meta}
              </span>
            </div>
          </article>
        ))}
      </section>

      <p className={styles.sectionEyebrow}>Awaiting approval</p>
      <section className={styles.awaiting} aria-label="Awaiting approval">
        {awaiting.map((item) => (
          <article key={item.label} className={styles.awaitingCard}>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </article>
        ))}
      </section>

      <div className={styles.queueRow}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h2>Your approval queue</h2>
              <p>Final operational decisions waiting on you.</p>
            </div>
            <span className={styles.countBadge}>{queueItems.length}</span>
          </div>
          {queueItems.length === 0 ? (
            <p className={styles.empty}>Nothing is waiting for approval.</p>
          ) : (
            <ul className={styles.queueList}>
              {queueItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className={styles.queueItem}>
                    <div>
                      <p className={styles.queueTitle}>
                        {item.ref ? <span>{item.ref}</span> : null}
                        <em>{item.status}</em>
                        {item.title}
                      </p>
                      <p className={styles.queueMeta}>
                        {[item.department, item.by ? `by ${item.by}` : "", item.amount]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className={styles.sideStack}>
          <section className={styles.card}>
            <h2>Overdue bills</h2>
            {overdueBillItems.length === 0 ? (
              <p className={styles.empty}>No overdue bills.</p>
            ) : (
              <ul className={styles.billList}>
                {overdueBillItems.map((bill) => (
                  <li key={bill.id} className={styles.billRow}>
                    <div>
                      <p>{bill.vendor}</p>
                      <strong>{bill.amount}</strong>
                    </div>
                    <span>{bill.timing}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/manager/finance-payroll/bills" className={styles.cardLink}>
              View all bills <ArrowRight size={13} />
            </Link>
          </section>

          <section className={styles.card}>
            <h2 className={styles.monthTitle}>
              <CalendarDays size={15} />
              This month
            </h2>
            <ul className={styles.monthList}>
              {monthSummary.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <section className={styles.card}>
          <h2 className={styles.cardTitleInline}>
            <Users size={16} />
            Employees by department
          </h2>
          {employeesByDepartment.length === 0 ? (
            <p className={styles.empty}>No department headcount yet.</p>
          ) : (
            <div className={styles.chartList}>
              {employeesByDepartment.map((dept) => (
                <div key={dept.name} className={styles.chartRow}>
                  <span className={styles.chartLabel}>{dept.name}</span>
                  <div className={styles.chartTrack}>
                    <div
                      className={styles.chartFill}
                      style={{ width: `${(dept.value / dept.max) * 100}%` }}
                    />
                  </div>
                  <span className={styles.chartValue}>{dept.value}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitleInline}>
            <TrendingUp size={16} />
            Department performance
          </h2>
          {departmentPerformance.length === 0 ? (
            <p className={styles.empty}>No performance scores yet.</p>
          ) : (
            <div className={styles.chartList}>
              {departmentPerformance.map((dept) => (
                <div key={dept.name} className={styles.chartRow}>
                  <span className={styles.chartLabel}>{dept.name}</span>
                  <div className={styles.chartTrack}>
                    <div
                      className={styles.chartFill}
                      style={{ width: `${Math.min(dept.value, 100)}%` }}
                    />
                  </div>
                  <span className={styles.chartValue}>{dept.value}%</span>
                </div>
              ))}
            </div>
          )}
          <div className={styles.riskBlock}>
            <h3>
              <Target size={14} />
              Targets at risk
            </h3>
            {targetsAtRisk.length === 0 ? (
              <p className={styles.empty}>No at-risk targets.</p>
            ) : (
              <ul className={styles.riskList}>
                {targetsAtRisk.map((item) => (
                  <li key={item.id}>
                    <div>
                      <p>{item.department || item.title}</p>
                      <span>{item.title}</span>
                    </div>
                    <em>{item.value}</em>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className={styles.threeCol}>
        <section className={styles.card}>
          <h2 className={styles.cardTitleInline}>
            <CalendarDays size={16} />
            Upcoming meetings
          </h2>
          {upcomingMeetings.length === 0 ? (
            <p className={styles.empty}>No upcoming meetings.</p>
          ) : (
            <ul className={styles.plainList}>
              {upcomingMeetings.map((item) => (
                <li key={item.id}>
                  <p>{item.title}</p>
                  <span>{item.when}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/manager/meetings" className={styles.cardLink}>
            Manage meetings <ArrowRight size={13} />
          </Link>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitleInline}>
            <GraduationCap size={16} />
            NYSC & interns exiting
          </h2>
          {exitingInterns.length === 0 ? (
            <p className={styles.empty}>No placements exiting soon.</p>
          ) : (
            <ul className={styles.plainList}>
              {exitingInterns.map((item) => (
                <li key={item.id} className={styles.exitRow}>
                  <div>
                    <p>{item.name}</p>
                    <span>{item.department}</span>
                  </div>
                  <em>{item.when}</em>
                </li>
              ))}
            </ul>
          )}
          <Link href="/manager/nysc-interns" className={styles.cardLink}>
            View placements <ArrowRight size={13} />
          </Link>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitleInline}>
            <Megaphone size={16} />
            Recent announcements
          </h2>
          {recentAnnouncements.length === 0 ? (
            <p className={styles.empty}>No announcements yet.</p>
          ) : (
            <ul className={styles.plainList}>
              {recentAnnouncements.map((item) => (
                <li key={item.id}>
                  <p>{item.title}</p>
                  <span>{item.when}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/manager/announcements" className={styles.cardLink}>
            All announcements <ArrowRight size={13} />
          </Link>
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitleInline}>
          <Clock size={16} />
          Recent operational activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className={styles.empty}>No recent activity.</p>
        ) : (
          <ul className={styles.activityList}>
            {recentActivity.map((item) => (
              <li key={item.id}>
                <div>
                  <p>{item.title}</p>
                  {item.detail ? <span>{item.detail}</span> : null}
                </div>
                <em>{item.when}</em>
              </li>
            ))}
          </ul>
        )}
        <Link href="/manager/audit" className={styles.cardLink}>
          View operational audit history <ArrowRight size={13} />
        </Link>
      </section>
    </div>
  );
}
