"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronRight,
  Megaphone,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeHome } from "@/data/employeeHome";
import styles from "./EmployeeHomePage.module.css";

function statusClass(status: string) {
  if (status === "Overdue" || status === "Returned") return styles.statusDanger;
  if (status === "Approved" || status === "Paid" || status === "Reimbursed") {
    return styles.statusSuccess;
  }
  if (status === "Pending" || status === "Submitted") return styles.statusPending;
  return styles.statusNeutral;
}

function SectionTitle({
  icon: Icon,
  children,
  href,
}: {
  icon: typeof CheckSquare2;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <h2>
        <Icon size={15} />
        {children}
      </h2>
      <Link href={href}>View all</Link>
    </div>
  );
}

export function EmployeeHomePage() {
  const data = employeeHome;

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {data.employee.initials}
          </ProfileLink>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Employee · Personal workspace</p>
          <h1>Good morning, {data.employee.firstName}.</h1>
          <p>{data.employee.role}</p>
          <p>{data.employee.email}</p>
          <Link href="/employee/leave" className={styles.heroButton}>
            Apply for leave <ChevronRight size={14} />
          </Link>
        </div>
        <span className={styles.heroOrb} aria-hidden />
      </section>

      <section className={styles.stats} aria-label="Employee summary">
        {data.stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <strong>{stat.value}</strong>
            <h2>{stat.label}</h2>
            <p>{stat.hint}</p>
          </article>
        ))}
      </section>

      <div className={styles.dashboardGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <SectionTitle icon={CheckSquare2} href="/employee/tasks">
              My tasks
            </SectionTitle>
            <div className={styles.rows}>
              {data.tasks.map((task) => (
                <article key={task.title} className={styles.row}>
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.meta}</p>
                  </div>
                  <span className={`${styles.status} ${statusClass(task.status)}`}>
                    {task.status}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <SectionTitle icon={CalendarDays} href="/employee/meetings">
              Upcoming meetings
            </SectionTitle>
            <div className={styles.rows}>
              {data.meetings.map((meeting) => (
                <article key={meeting.title} className={styles.row}>
                  <div>
                    <h3>{meeting.title}</h3>
                    <p>{meeting.meta}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className={styles.splitCards}>
            <section className={styles.card}>
              <SectionTitle icon={ReceiptText} href="/employee/expenses">
                Expense status
              </SectionTitle>
              <div className={styles.rows}>
                {data.expenses.map((item) => (
                  <article key={item.title} className={styles.compactRow}>
                    <span>{item.title}</span>
                    <span className={`${styles.status} ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <SectionTitle icon={WalletCards} href="/employee/reimbursements">
                Reimbursement status
              </SectionTitle>
              <div className={styles.rows}>
                {data.reimbursements.map((item) => (
                  <article key={item.title} className={styles.compactRow}>
                    <span>{item.title}</span>
                    <span className={`${styles.status} ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.card}>
            <SectionTitle icon={CalendarDays} href="/employee/leave">
              Recent leave request
            </SectionTitle>
            <div className={styles.leaveRequest}>
              <div className={styles.leaveRequestHeader}>
                <div>
                  <h3>{data.leaveRequest.type}</h3>
                  <p>{data.leaveRequest.dates}</p>
                </div>
                <span className={`${styles.status} ${styles.statusPending}`}>
                  {data.leaveRequest.status}
                </span>
              </div>
              <Link href="/employee/leave">Track status →</Link>
            </div>
          </section>

          <section className={styles.card}>
            <SectionTitle icon={CalendarDays} href="/employee/leave">
              Leave balance
            </SectionTitle>
            <div className={styles.balanceList}>
              {data.leaveBalances.map((balance) => (
                <div key={balance.label} className={styles.balance}>
                  <div>
                    <span>{balance.label}</span>
                    <strong>{balance.value} left</strong>
                  </div>
                  <div className={styles.meter}>
                    <span style={{ width: `${(balance.value / balance.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <SectionTitle icon={Megaphone} href="/employee/announcements">
              Announcements
            </SectionTitle>
            <div className={styles.rows}>
              {data.announcements.map((item) => (
                <article key={item.title} className={styles.row}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.meta}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <SectionTitle icon={Bell} href="/employee/notifications">
              Notifications
            </SectionTitle>
            <div className={styles.rows}>
              {data.notifications.map((item) => (
                <article key={item.message} className={styles.notification}>
                  <span aria-hidden />
                  <p>{item.message}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
