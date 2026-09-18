"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeProfile } from "@/data/employeeHome";
import styles from "./EmployeeExpensesPage.module.css";

type RecordCategory = "Contract" | "Identity" | "Leave" | "Performance";
type RecordFilter = "All" | RecordCategory;
type EmployeeRecord = {
  id: string;
  title: string;
  category: RecordCategory;
  date: string;
  status: "Available" | "Pending";
};

const filters: RecordFilter[] = [
  "All",
  "Contract",
  "Identity",
  "Leave",
  "Performance",
];

const records: EmployeeRecord[] = [
  {
    id: "REC-0188-01",
    title: "Offer letter",
    category: "Contract",
    date: "4 Mar 2024",
    status: "Available",
  },
  {
    id: "REC-0188-02",
    title: "Employment contract",
    category: "Contract",
    date: "4 Mar 2024",
    status: "Available",
  },
  {
    id: "REC-0188-03",
    title: "Staff identity card",
    category: "Identity",
    date: "4 Mar 2024",
    status: "Available",
  },
  {
    id: "REC-0188-04",
    title: "Leave approval — LV-3987",
    category: "Leave",
    date: "15 Jul 2026",
    status: "Available",
  },
  {
    id: "REC-0188-05",
    title: "Mid-year performance summary",
    category: "Performance",
    date: "12 Dec 2025",
    status: "Pending",
  },
];

export function EmployeeRecordsPage() {
  const [filter, setFilter] = useState<RecordFilter>("All");
  const { showToast } = usePageActions();
  const visible = useMemo(
    () =>
      records.filter((item) => filter === "All" || item.category === filter),
    [filter],
  );

  function handleDownload(item: EmployeeRecord) {
    if (item.status !== "Available") {
      showToast("This record is not ready to download yet.", "info");
      return;
    }
    showToast(`${item.title} will download when HR publishes the file.`, "info");
  }

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
            {employeeProfile.initials}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.heading}>
        <div>
          <p>My records</p>
          <h1>Your HR file</h1>
          <span>
            Contracts, identity, leave letters and reviews that belong to{" "}
            {employeeProfile.name} only.
          </span>
        </div>
      </div>

      <nav className={styles.filters} aria-label="Record filters">
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

      <section className={styles.expenseList} aria-label={`${filter} records`}>
        {visible.length === 0 ? (
          <p className={styles.empty}>No records in this view.</p>
        ) : (
          visible.map((item) => (
            <article key={item.id} className={styles.expenseCard}>
              <div className={styles.expenseBody}>
                <div className={styles.expenseHeading}>
                  <span className={styles.expenseId}>{item.id}</span>
                  <h2>{item.title}</h2>
                  <span
                    className={`${styles.status} ${
                      item.status === "Available"
                        ? styles.statusSuccess
                        : styles.statusSubmitted
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p>
                  {item.category} · {item.date}
                </p>
              </div>
              <button
                type="button"
                className={styles.recordAction}
                onClick={() => handleDownload(item)}
              >
                <Download size={14} />
                Download
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
