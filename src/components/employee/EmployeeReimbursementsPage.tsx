"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeProfile } from "@/data/employeeHome";
import styles from "./EmployeeExpensesPage.module.css";

type ReimbursementStatus = "Pending" | "Paid" | "Returned";
type ReimbursementFilter = "All" | ReimbursementStatus;
type Reimbursement = {
  id: string;
  title: string;
  status: ReimbursementStatus;
  category: string;
  date: string;
  amount: string;
};

const filters: ReimbursementFilter[] = ["All", "Pending", "Paid", "Returned"];

const reimbursements: Reimbursement[] = [
  {
    id: "RB-2144",
    title: "Home internet top-up",
    status: "Pending",
    category: "Utilities",
    date: "8 Aug",
    amount: "₦ 15,000",
  },
  {
    id: "RB-2138",
    title: "Design software subscription",
    status: "Paid",
    category: "Software",
    date: "29 Jul",
    amount: "₦ 32,400",
  },
  {
    id: "RB-2119",
    title: "Conference travel",
    status: "Returned",
    category: "Travel",
    date: "12 Jul",
    amount: "₦ 86,000",
  },
];

function statusClass(status: ReimbursementStatus) {
  if (status === "Paid") return styles.statusSuccess;
  if (status === "Returned") return styles.statusRejected;
  return styles.statusSubmitted;
}

export function EmployeeReimbursementsPage() {
  const [filter, setFilter] = useState<ReimbursementFilter>("All");
  const visible = useMemo(
    () =>
      reimbursements.filter(
        (item) => filter === "All" || item.status === filter,
      ),
    [filter],
  );

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <p>Wednesday, August 12</p>
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {employeeProfile.initials}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <div>
          <p>My reimbursements</p>
          <h1>Reimbursement status</h1>
          <span>Track claims that Accounts is processing or has paid.</span>
        </div>
      </div>

      <nav className={styles.filters} aria-label="Reimbursement filters">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            className={filter === item ? styles.filterActive : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <section
        className={styles.expenseList}
        aria-label={`${filter} reimbursements`}
      >
        {visible.length === 0 ? (
          <p className={styles.empty}>No reimbursements in this view.</p>
        ) : (
          visible.map((item) => (
            <article key={item.id} className={styles.expenseCard}>
              <div className={styles.expenseBody}>
                <div className={styles.expenseHeading}>
                  <span className={styles.expenseId}>{item.id}</span>
                  <h2>{item.title}</h2>
                  <span className={`${styles.status} ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p>
                  {item.category} · {item.date}
                </p>
              </div>
              <strong>{item.amount}</strong>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
