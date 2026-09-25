"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Paperclip, Plus, Search, Upload, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi } from "@/lib/api";
import { listFrom, num, str } from "@/lib/api/mappers";
import type {
  EmployeeExpense,
  EmployeeExpenseStatus,
} from "@/data/employeeHome";
import styles from "./EmployeeExpensesPage.module.css";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

const expenseCategories = [
  "Travel",
  "Transport",
  "Meals",
  "Training",
  "Equipment",
  "Office Supplies",
  "Communication",
  "Other",
] as const;

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

type ExpenseFilter = "All" | EmployeeExpenseStatus;

const filters: ExpenseFilter[] = [
  "All",
  "Submitted",
  "Approved",
  "Reimbursed",
  "Rejected",
];

const emptyForm = {
  description: "",
  category: "Travel",
  amount: "",
  receiptFile: null as File | null,
};

function mapStatus(value: unknown): EmployeeExpenseStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("reject") || raw.includes("declin")) return "Rejected";
  if (raw.includes("reimburse") || raw.includes("paid")) return "Reimbursed";
  if (raw.includes("approv")) return "Approved";
  return "Submitted";
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

function mapExpense(
  record: Record<string, unknown>,
  index: number,
): EmployeeExpense {
  return {
    id: str(record.reference ?? record.id, `EX-${index + 1}`),
    title: str(record.description ?? record.title ?? record.reference),
    status: mapStatus(record.status),
    category: str(record.categoryName ?? record.category ?? record.categoryId),
    date: formatDate(
      record.expenseDate ?? record.expense_date ?? record.date ?? record.createdAt,
    ),
    receipt: Boolean(
      record.hasReceipt ??
        record.receipt ??
        (Array.isArray(record.receipts) && record.receipts.length > 0),
    ),
    amount: formatAmount(record.amount ?? record.total ?? record.totalAmount),
  };
}

function statusClass(status: EmployeeExpenseStatus) {
  if (status === "Approved" || status === "Reimbursed") {
    return styles.statusSuccess;
  }
  if (status === "Rejected") return styles.statusRejected;
  return styles.statusSubmitted;
}

export function EmployeeExpensesPage({
  initialFilter = "All",
}: {
  initialFilter?: ExpenseFilter;
}) {
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [filter, setFilter] = useState<ExpenseFilter>(initialFilter);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const categoryRef = useRef<HTMLDivElement>(null);
  const { data, loading, error, refetch } = useAsyncData(
    () => employeeApi.expenses.list({ limit: 50 }),
    [],
  );

  const expenseItems = useMemo(() => {
    const records = listFrom((data ?? undefined) as never);
    return records
      .filter((record) => {
        const status = str(record.status).toLowerCase();
        return !status.includes("cancel");
      })
      .map((record, index) => mapExpense(record, index));
  }, [data]);

  const visibleExpenses = useMemo(
    () =>
      expenseItems.filter((expense) => {
        if (filter === "All") {
          return expense.status !== "Rejected";
        }
        return expense.status === filter;
      }),
    [expenseItems, filter],
  );

  function closeCreate() {
    setCreateOpen(false);
    setCategoryOpen(false);
    setForm(emptyForm);
  }

  useEffect(() => {
    if (!createOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (categoryOpen) {
        setCategoryOpen(false);
        return;
      }
      closeCreate();
    }
    function onPointer(event: MouseEvent) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointer);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [createOpen, categoryOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await runAction(
        "Submit expense",
        async () => {
          const amount = Number(form.amount);
          if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("Enter a valid amount.");
          }
          const receiptFile = form.receiptFile;
          if (!receiptFile) {
            throw new Error("Attach a receipt. Most categories require one.");
          }
          if (receiptFile.size > MAX_RECEIPT_BYTES) {
            throw new Error("Receipt files must be 10 MB or smaller.");
          }
          await employeeApi.expenses.create({
            description: form.description.trim(),
            category: form.category,
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
        "Expense claim submitted",
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
        {loading ? <p className={styles.empty}>Loading expenses…</p> : null}
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
          <p>My expenses</p>
          <h1>Expense claims</h1>
          <span>Submit expenses with receipts and track their status.</span>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={15} />
          New expense
        </button>
      </div>

      <nav className={styles.filters} aria-label="Expense filters">
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

      <section className={styles.expenseList} aria-label={`${filter} expenses`}>
        {visibleExpenses.length === 0 ? (
          <p className={styles.empty}>No expenses in this view.</p>
        ) : (
          visibleExpenses.map((expense) => (
            <article key={expense.id} className={styles.expenseCard}>
              <div className={styles.expenseBody}>
                <div className={styles.expenseHeading}>
                  <span className={styles.expenseId}>{expense.id}</span>
                  <h2>{expense.title}</h2>
                  <span
                    className={`${styles.status} ${statusClass(expense.status)}`}
                  >
                    {expense.status}
                  </span>
                </div>
                <p>
                  {expense.category} · {expense.date}
                  <span
                    className={
                      expense.receipt ? styles.receipt : styles.noReceipt
                    }
                  >
                    {expense.receipt ? <Paperclip size={11} /> : null}
                    {expense.receipt ? "Receipt" : "No receipt"}
                  </span>
                </p>
              </div>
              <strong>{expense.amount}</strong>
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
                aria-labelledby="new-expense-title"
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
                <h2 id="new-expense-title">New expense</h2>
                <p>Submitted to Accounts for review.</p>
                <form className={styles.expenseForm} onSubmit={handleSubmit}>
                  <label className={styles.formField}>
                    <span>
                      Description <em>*</em>
                    </span>
                    <input
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="e.g. Client lunch"
                      required
                    />
                  </label>
                  <div className={styles.formPair}>
                    <div className={styles.formField}>
                      <span>Category</span>
                      <div className={styles.categorySelect} ref={categoryRef}>
                        <button
                          type="button"
                          className={styles.categoryTrigger}
                          aria-haspopup="listbox"
                          aria-expanded={categoryOpen}
                          onClick={() => setCategoryOpen((open) => !open)}
                        >
                          <span>{form.category}</span>
                          <ChevronDown size={16} />
                        </button>
                        {categoryOpen ? (
                          <ul className={styles.categoryMenu} role="listbox">
                            {expenseCategories.map((category) => (
                              <li key={category}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={form.category === category}
                                  className={
                                    form.category === category
                                      ? styles.categoryOptionActive
                                      : styles.categoryOption
                                  }
                                  onClick={() => {
                                    setForm((current) => ({
                                      ...current,
                                      category,
                                    }));
                                    setCategoryOpen(false);
                                  }}
                                >
                                  {category}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
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
                  </div>
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
                      {submitting ? "Submitting…" : "Submit expense"}
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
