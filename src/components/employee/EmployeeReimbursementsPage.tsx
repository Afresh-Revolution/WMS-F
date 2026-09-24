"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { employeeApi } from "@/lib/api";
import { listFrom, num, str } from "@/lib/api/mappers";
import type {
  EmployeeReimbursement,
  EmployeeReimbursementStatus,
} from "@/data/employeeHome";
import styles from "./EmployeeExpensesPage.module.css";

type ReimbursementFilter = "All" | EmployeeReimbursementStatus;

const filters: ReimbursementFilter[] = ["All", "Pending", "Paid", "Returned"];

function mapStatus(value: unknown): EmployeeReimbursementStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("paid") || raw.includes("reimburse") || raw.includes("settled")) {
    return "Paid";
  }
  if (raw.includes("return") || raw.includes("reject")) return "Returned";
  return "Pending";
}

function formatAmount(value: unknown): string {
  const amount = num(value);
  return `₦ ${amount.toLocaleString("en-NG")}`;
}

function formatDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function mapReimbursement(
  record: Record<string, unknown>,
  index: number,
): EmployeeReimbursement | null {
  const status = str(
    record.reimbursementStatus ?? record.reimbursement_status ?? record.status,
  );
  if (!status || status.toLowerCase() === "not_required") return null;
  return {
    id: str(record.reference ?? record.id, `RB-${index + 1}`),
    title: str(record.description ?? record.title ?? record.reference),
    status: mapStatus(status),
    category: str(record.categoryName ?? record.category),
    date: formatDate(
      record.expenseDate ?? record.expense_date ?? record.date ?? record.createdAt,
    ),
    amount: formatAmount(record.amount ?? record.total ?? record.totalAmount),
  };
}

function statusClass(status: EmployeeReimbursementStatus) {
  if (status === "Paid") return styles.statusSuccess;
  if (status === "Returned") return styles.statusRejected;
  return styles.statusSubmitted;
}

export function EmployeeReimbursementsPage() {
  const { user } = useCurrentUser();
  const [filter, setFilter] = useState<ReimbursementFilter>("All");
  const { data, loading, error } = useAsyncData(
    () =>
      employeeApi.reimbursements.list({ limit: 50 }).catch(() =>
        employeeApi.expenses.list({ limit: 50 }),
      ),
    [],
  );

  const reimbursements = useMemo(() => {
    const records = listFrom((data ?? undefined) as never);
    return records
      .map((record, index) => mapReimbursement(record, index))
      .filter((item): item is EmployeeReimbursement => Boolean(item));
  }, [data]);

  const visible = useMemo(
    () =>
      reimbursements.filter(
        (item) => filter === "All" || item.status === filter,
      ),
    [filter, reimbursements],
  );

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.empty}>Loading reimbursements…</p> : null}
        {error ? (
          <p className={styles.empty} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input aria-label="Search" placeholder="Search" readOnly />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
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
