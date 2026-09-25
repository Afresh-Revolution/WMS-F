"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Paperclip, Plus, Search, Upload, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi } from "@/lib/api";
import { listFrom, num, str } from "@/lib/api/mappers";
import { inferReimbursementCategory } from "@/lib/reimbursementCategory";
import type {
  EmployeeReimbursement,
  EmployeeReimbursementStatus,
} from "@/data/employeeHome";
import styles from "./EmployeeExpensesPage.module.css";

type ReimbursementFilter = "All" | EmployeeReimbursementStatus;

const filters: ReimbursementFilter[] = ["All", "Pending", "Paid", "Returned"];
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

const emptyForm = {
  purpose: "",
  amount: "",
  receiptFile: null as File | null,
};

function todayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "").trim();
      if (!result) {
        reject(new Error("Could not read the receipt file."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () =>
      reject(new Error("Could not read the receipt file."));
    reader.readAsDataURL(file);
  });
}

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
    title: str(
      record.purpose ?? record.description ?? record.title ?? record.reference,
    ),
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
  const { runAction } = usePageActions();
  const [filter, setFilter] = useState<ReimbursementFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { data, loading, error, refetch } = useAsyncData(
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

  function closeCreate() {
    setCreateOpen(false);
    setForm(emptyForm);
  }

  useEffect(() => {
    if (!createOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCreate();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [createOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await runAction(
        "Submit claim",
        async () => {
          const amount = Number(form.amount);
          if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Enter a valid amount.");
          }
          const receiptFile = form.receiptFile;
          if (!receiptFile) {
            throw new Error("Attach a receipt.");
          }
          if (receiptFile.size > MAX_RECEIPT_BYTES) {
            throw new Error("Receipt files must be 10 MB or smaller.");
          }
          const purpose = form.purpose.trim();
          const category = inferReimbursementCategory(purpose);
          await employeeApi.reimbursements.create({
            purpose,
            description: purpose,
            category,
            categoryName: category,
            amount,
            expenseDate: todayKey(),
            currency: "NGN",
            receipts: [
              {
                fileName: receiptFile.name,
                fileUrl: await fileToDataUrl(receiptFile),
                fileType: receiptFile.type || "application/octet-stream",
                fileSize: receiptFile.size,
                receiptDate: todayKey(),
              },
            ],
          });
          await refetch();
        },
        "Reimbursement claim submitted",
      );
      setFilter("All");
      closeCreate();
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
  }

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
          <h1>Reimbursements</h1>
          <span>Claim back money you spent for work.</span>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={15} />
          New claim
        </button>
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

      {createOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className={styles.modalBackdrop}
              role="presentation"
              onClick={closeCreate}
            >
              <section
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-reimbursement-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.modalClose}
                  aria-label="Close"
                  onClick={closeCreate}
                >
                  <X size={17} />
                </button>
                <h2 id="new-reimbursement-title">New reimbursement</h2>
                <p>Reviewed by your HOD, then paid by Accounts.</p>
                <form className={styles.expenseForm} onSubmit={handleSubmit}>
                  <label className={styles.formField}>
                    <span>
                      Purpose <em>*</em>
                    </span>
                    <input
                      value={form.purpose}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          purpose: event.target.value,
                        }))
                      }
                      placeholder="e.g. Taxi to client site"
                      required
                    />
                  </label>
                  <label className={styles.formField}>
                    <span>
                      Amount (₦) <em>*</em>
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={form.amount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="0"
                      required
                    />
                  </label>
                  <label className={styles.uploadField}>
                    <span>Receipt</span>
                    <div className={styles.dropZone}>
                      <span className={styles.uploadIcon}>
                        <Upload size={18} />
                      </span>
                      <strong>
                        {form.receiptFile
                          ? form.receiptFile.name
                          : "Drop a file or click to upload"}
                      </strong>
                      <small>
                        <Paperclip size={12} />
                        PDF, DOCX, JPG or PNG · up to 10 MB
                      </small>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        required
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            receiptFile: event.target.files?.[0] ?? null,
                          }))
                        }
                      />
                    </div>
                  </label>
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.modalCancel}
                      onClick={closeCreate}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.modalSubmit}
                      disabled={submitting}
                    >
                      <Plus size={15} />
                      {submitting ? "Submitting…" : "Submit claim"}
                    </button>
                  </div>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
