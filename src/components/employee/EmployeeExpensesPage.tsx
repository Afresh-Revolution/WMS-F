"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState, type FormEvent } from "react";
import { Paperclip, Plus, Search, Upload, X } from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { employeeProfile } from "@/data/employeeHome";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi } from "@/lib/api";
import { listFrom, num, str } from "@/lib/api/mappers";
import styles from "./EmployeeExpensesPage.module.css";

type ExpenseStatus = "Submitted" | "Approved" | "Reimbursed" | "Rejected";
type ExpenseFilter = "All" | ExpenseStatus;
type Expense = {
  id: string;
  title: string;
  status: ExpenseStatus;
  category: string;
  date: string;
  receipt: boolean;
  amount: string;
};

const filters: ExpenseFilter[] = [
  "All",
  "Submitted",
  "Approved",
  "Reimbursed",
  "Rejected",
];

const initialExpenses: Expense[] = [
  {
    id: "EX-3081",
    title: "Team offsite — planning day",
    status: "Submitted",
    category: "Team",
    date: "7 Aug",
    receipt: true,
    amount: "₦ 24,000",
  },
  {
    id: "EX-3062",
    title: "Udemy course — advanced React",
    status: "Approved",
    category: "Training",
    date: "22 Jul",
    receipt: true,
    amount: "₦ 18,500",
  },
  {
    id: "EX-3040",
    title: "Transport — client workshop",
    status: "Reimbursed",
    category: "Travel",
    date: "10 Jul",
    receipt: true,
    amount: "₦ 9,200",
  },
  {
    id: "EX-3011",
    title: "USB-C hub",
    status: "Rejected",
    category: "Equipment",
    date: "28 Jun",
    receipt: false,
    amount: "₦ 15,000",
  },
];

const emptyForm = {
  description: "",
  category: "Travel",
  amount: "",
  receipt: false,
};

function statusClass(status: ExpenseStatus) {
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
  const [filter, setFilter] = useState<ExpenseFilter>(initialFilter);
  const [createOpen, setCreateOpen] = useState(false);
  const [expenseItems, setExpenseItems] = useState(initialExpenses);
  const [form, setForm] = useState(emptyForm);
  const { runAction } = usePageActions();
  const { data: liveExpenses, refetch } = useAsyncData(
    () => employeeApi.expenses.list({ limit: 50 }).catch(() => []),
    [],
  );
  const catalog = useMemo(() => {
    const rows = listFrom(liveExpenses ?? undefined);
    if (!rows.length) return expenseItems;
    return rows.map((row, index) => ({
      id: str(row.id ?? row.reference, `EX-${index}`),
      title: str(row.description ?? row.title ?? row.category, "Expense"),
      status: str(row.status, "Submitted") as ExpenseStatus,
      category: str(row.category ?? row.categoryName, "General"),
      date: str(row.date ?? row.createdAt, "—"),
      receipt: Boolean(row.receipt || row.hasReceipt),
      amount: `₦ ${num(row.amount).toLocaleString("en-NG")}`,
    }));
  }, [liveExpenses, expenseItems]);
  const visibleExpenses = useMemo(
    () =>
      catalog.filter(
        (expense) => filter === "All" || expense.status === filter,
      ),
    [catalog, filter],
  );

  function closeCreate() {
    setCreateOpen(false);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    await runAction(
      "Submit expense",
      async () => {
        await employeeApi.expenses.create({
          description: form.description.trim(),
          category: form.category,
          amount,
          date: new Date().toISOString().slice(0, 10),
        });
        await refetch();
      },
      "Expense claim submitted",
    );
    setExpenseItems((current) => [
      {
        id: `EX-${3100 + current.length}`,
        title: form.description.trim(),
        status: "Submitted",
        category: form.category,
        date: "12 Aug",
        receipt: form.receipt,
        amount: `₦ ${amount.toLocaleString("en-NG")}`,
      },
      ...current,
    ]);
    setFilter("All");
    closeCreate();
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
        {visibleExpenses.map((expense) => (
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
        ))}
      </section>

      {createOpen ? (
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
              <X size={16} />
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
                <label className={styles.formField}>
                  <span>Category</span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option>Travel</option>
                    <option>Team</option>
                    <option>Training</option>
                    <option>Equipment</option>
                    <option>Meals</option>
                  </select>
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
              </div>
              <label className={styles.uploadField}>
                <span>Receipt</span>
                <div className={styles.dropZone}>
                  <span className={styles.uploadIcon}>
                    <Upload size={17} />
                  </span>
                  <strong>
                    {form.receipt
                      ? "Receipt selected"
                      : "Drop a file or click to upload"}
                  </strong>
                  <small>
                    <Paperclip size={11} />
                    PDF, DOCX, JPG or PNG · up to 10 MB
                  </small>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        receipt: Boolean(event.target.files?.length),
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
                <button type="submit" className={styles.modalSubmit}>
                  <Plus size={15} />
                  Submit expense
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
