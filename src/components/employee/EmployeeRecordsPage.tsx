"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { asRecord, employeeApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import type { EmployeeRecordItem } from "@/data/employeeHome";
import styles from "./EmployeeExpensesPage.module.css";

type RecordCategory = EmployeeRecordItem["category"];
type RecordFilter = "All" | RecordCategory;

const filters: RecordFilter[] = [
  "All",
  "Contract",
  "Identity",
  "Leave",
  "Performance",
];

function mapCategory(value: unknown): RecordCategory {
  const raw = str(value).toLowerCase();
  if (raw.includes("ident") || raw.includes("id card")) return "Identity";
  if (raw.includes("leave")) return "Leave";
  if (raw.includes("perform") || raw.includes("review")) return "Performance";
  return "Contract";
}

function formatDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapRecord(
  record: Record<string, unknown>,
  index: number,
): EmployeeRecordItem {
  const available = !["pending", "processing", "draft"].includes(
    str(record.status).toLowerCase(),
  );
  return {
    id: str(record.id ?? record.reference, `REC-${index + 1}`),
    title: str(
      record.title ?? record.documentName ?? record.document_name ?? record.name,
    ),
    category: mapCategory(
      record.category ?? record.documentType ?? record.document_type,
    ),
    date: formatDate(
      record.date ?? record.createdAt ?? record.created_at ?? record.issuedAt,
    ),
    status: available ? "Available" : "Pending",
  };
}

export function EmployeeRecordsPage() {
  const { user } = useCurrentUser();
  const [filter, setFilter] = useState<RecordFilter>("All");
  const { showToast } = usePageActions();
  const { data, loading, error } = useAsyncData(
    () => employeeApi.listRecords(),
    [],
  );

  const records = useMemo(() => {
    const payload = asRecord(data) ?? {};
    const documents = listFrom(
      (payload.documents ?? payload.records ?? data) as never,
    );
    const leave = listFrom((payload.leaveHistory ?? []) as never).map(
      (record) => ({
        ...record,
        title: str(
          record.title ?? record.leaveTypeName ?? record.leave_type_name,
          "Leave letter",
        ),
        documentType: "Leave",
      }),
    );
    const performance = listFrom(
      (payload.performanceReviews ?? []) as never,
    ).map((record) => ({
      ...record,
      title: str(record.title ?? record.reviewPeriod, "Performance review"),
      documentType: "Performance",
    }));
    return [...documents, ...leave, ...performance].map((record, index) =>
      mapRecord(record, index),
    );
  }, [data]);

  const visible = useMemo(
    () =>
      records.filter((item) => filter === "All" || item.category === filter),
    [filter, records],
  );

  function handleDownload(item: EmployeeRecordItem) {
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
        {loading ? <p className={styles.empty}>Loading records…</p> : null}
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
          <p>My records</p>
          <h1>Your HR file</h1>
          <span>
            Contracts, identity, leave letters and reviews that belong to you.
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
