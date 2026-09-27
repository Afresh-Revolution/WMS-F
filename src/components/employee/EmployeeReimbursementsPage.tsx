"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import {
  Car,
  CircleDollarSign,
  Download,
  Monitor,
  Package,
  Plane,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { employeeApi } from "@/lib/api";
import { listFrom, num, str } from "@/lib/api/mappers";
import type { EmployeeExpenseStatus } from "@/data/employeeHome";
import styles from "./EmployeeExpensesPage.module.css";

const claimFields = [
  {
    name: "description",
    label: "Description",
    required: true,
    fullWidth: true,
    placeholder: "What was this expense for?",
  },
  {
    name: "amount",
    label: "Amount (₦)",
    type: "number" as const,
    required: true,
    pair: "amount",
    defaultValue: "0.00",
    min: 0,
    step: "0.01",
  },
  {
    name: "date",
    label: "Date",
    type: "date" as const,
    required: true,
    pair: "amount",
    placeholder: "mm/dd/yyyy",
  },
  {
    name: "category",
    label: "Category",
    type: "select" as const,
    required: true,
    fullWidth: true,
    defaultValue: "Meals",
    options: [
      { label: "Meals", value: "Meals" },
      { label: "Transport", value: "Transport" },
      { label: "Travel", value: "Travel" },
      { label: "Supplies", value: "Supplies" },
      { label: "Equipment", value: "Equipment" },
      { label: "Office Supplies", value: "Office Supplies" },
      { label: "Training", value: "Training" },
      { label: "Communication", value: "Communication" },
      { label: "Other", value: "Other" },
    ],
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea" as const,
    fullWidth: true,
    rows: 2,
    placeholder: "Optional context",
  },
];

type ClaimStatus = "Pending" | "Approved" | "Rejected";
type SectionTab = "My reimbursements" | "Team reimbursements" | "Policies";

type Claim = {
  id: string;
  ref: string;
  title: string;
  status: ClaimStatus;
  rawStatus: EmployeeExpenseStatus;
  category: string;
  month: string;
  day: string;
  dateKey: string;
  amount: number;
};

const categoryIcons: Record<string, typeof UtensilsCrossed> = {
  Meals: UtensilsCrossed,
  Transport: Car,
  Travel: Plane,
  Equipment: Monitor,
  Supplies: Package,
  "Office Supplies": Package,
};

function todayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function mapRawStatus(value: unknown): EmployeeExpenseStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("reject") || raw.includes("declin") || raw.includes("return")) {
    return "Rejected";
  }
  if (raw.includes("reimburse") || raw.includes("paid") || raw.includes("approv")) {
    return "Approved";
  }
  return "Submitted";
}

function displayStatus(status: EmployeeExpenseStatus): ClaimStatus {
  if (status === "Rejected") return "Rejected";
  if (status === "Approved" || status === "Reimbursed") return "Approved";
  return "Pending";
}

function formatMoney(value: number): string {
  return `₦ ${value.toLocaleString("en-NG")}`;
}

function formatCompact(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    const text =
      thousands >= 10
        ? String(Math.round(thousands))
        : thousands.toFixed(1).replace(/\.0$/, "");
    return `₦ ${text}K`;
  }
  return formatMoney(value);
}

function mapClaim(record: Record<string, unknown>, index: number): Claim {
  const rawDate = str(
    record.expenseDate ?? record.expense_date ?? record.date ?? record.createdAt,
  );
  const parsed = new Date(rawDate);
  const valid = !Number.isNaN(parsed.getTime());
  const rawStatus = mapRawStatus(
    record.reimbursementStatus ?? record.reimbursement_status ?? record.status,
  );
  const reference = str(record.reference ?? record.ref ?? record.id, `RB-${index + 1}`);
  return {
    id: str(record.id ?? record.reference, reference),
    ref: reference,
    title: str(record.purpose ?? record.description ?? record.title ?? reference),
    status: displayStatus(rawStatus),
    rawStatus,
    category: str(record.categoryName ?? record.category ?? record.categoryId, "Other"),
    month: valid
      ? parsed.toLocaleDateString("en-US", { month: "short" })
      : "",
    day: valid ? String(parsed.getDate()) : "",
    dateKey: valid ? todayKey(parsed) : rawDate.slice(0, 10),
    amount: num(record.amount ?? record.total ?? record.totalAmount),
  };
}

function statusClass(status: ClaimStatus) {
  if (status === "Approved") return styles.statusApproved;
  if (status === "Rejected") return styles.statusRejected;
  return styles.statusPending;
}

export function EmployeeReimbursementsPage() {
  const { user } = useCurrentUser();
  const { runAction, exportRows } = usePageActions();
  const [section, setSection] = useState<SectionTab>("My reimbursements");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { data, loading, error, refetch } = useAsyncData(
    () => employeeApi.reimbursements.list({ limit: 50 }),
    [],
  );

  const claims = useMemo(() => {
    return listFrom((data ?? undefined) as never)
      .filter((record) => {
        const status = str(
          record.reimbursementStatus ?? record.reimbursement_status ?? record.status,
        ).toLowerCase();
        return status !== "not_required" && !status.includes("cancel");
      })
      .map((record, index) => mapClaim(record, index));
  }, [data]);

  const monthClaims = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return claims.filter((claim) => claim.dateKey.startsWith(prefix));
  }, [claims]);

  const visibleClaims = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return monthClaims.filter((claim) => {
      if (!needle) return true;
      return `${claim.ref} ${claim.title} ${claim.category}`
        .toLowerCase()
        .includes(needle);
    });
  }, [monthClaims, query]);

  const monthLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const monthBadge = new Date().toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const submittedTotal = monthClaims.reduce((sum, claim) => sum + claim.amount, 0);
  const approvedTotal = monthClaims
    .filter((claim) => claim.status === "Approved")
    .reduce((sum, claim) => sum + claim.amount, 0);
  const pendingCount = monthClaims.filter((claim) => claim.status === "Pending").length;
  const rejectedCount = monthClaims.filter((claim) => claim.status === "Rejected").length;

  async function handleSubmit(values: Record<string, string>) {
    const amount = Number(String(values.amount ?? "").replace(/[^\d.]/g, ""));
    const notes = values.notes.trim();
    const description = values.description.trim();
    await runAction(
      "Submit claim",
      async () => {
        if (!description) {
          throw new Error("Enter a description.");
        }
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Enter a valid amount.");
        }
        if (!values.date.trim()) {
          throw new Error("Choose a date.");
        }
        await employeeApi.reimbursements.create({
          purpose: description,
          description,
          category: values.category.trim() || "Meals",
          categoryName: values.category.trim() || "Meals",
          amount,
          expenseDate: values.date,
          date: values.date,
          currency: "NGN",
          notes,
          note: notes,
        });
        await refetch();
      },
      "Reimbursement claim submitted",
    );
  }

  async function deleteClaim(claim: Claim) {
    await runAction(`Delete ${claim.ref}`, async () => {
      await employeeApi.reimbursements.cancel(claim.id);
      await refetch();
    });
  }

  function handleExport() {
    exportRows(
      visibleClaims.map((claim) => ({
        ref: claim.ref,
        description: claim.title,
        category: claim.category,
        date: claim.dateKey,
        amount: claim.amount,
        status: claim.status,
      })),
      "reimbursements.csv",
    );
  }

  const tabs: SectionTab[] = ["My reimbursements", "Team reimbursements", "Policies"];

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <PageDateLabel />
        {loading ? <p className={styles.statusLine}>Loading reimbursements…</p> : null}
        {error ? (
          <p className={styles.statusLine} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={14} />
            <input
              aria-label="Search"
              placeholder="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.profileButton}>
            {user?.initials || "—"}
          </ProfileLink>
        </div>
      </header>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Reimbursements</p>
          <h1 className={styles.title}>Spend tracked, team covered</h1>
          <p className={styles.subtitle}>
            Submit claims, review receipts, and keep every reimbursement within
            policy — quickly and cleanly.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.exportButton} onClick={handleExport}>
            <Download size={15} />
            Export
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            Submit claim
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <p>Submitted this month</p>
            <span>{monthBadge}</span>
          </div>
          <strong>{formatCompact(submittedTotal)}</strong>
        </article>
        <article className={`${styles.statCard} ${styles.statCardAccent}`}>
          <div className={styles.statTop}>
            <p>Approved</p>
          </div>
          <div className={styles.statValueRow}>
            <strong>{formatCompact(approvedTotal)}</strong>
            <em>Reimbursable</em>
          </div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <p>Pending review</p>
            <span>Awaiting</span>
          </div>
          <strong>{pendingCount}</strong>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statTop}>
            <p>Rejected</p>
            <span>{monthBadge}</span>
          </div>
          <strong>{rejectedCount}</strong>
        </article>
      </div>

      <div className={styles.filters}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSection(tab)}
            className={section === tab ? styles.filterActive : ""}
          >
            {tab}
          </button>
        ))}
      </div>

      {section === "My reimbursements" ? (
        <section className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h2>My claims — {monthLabel}</h2>
            <p>All reimbursement submissions for the current month.</p>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th aria-label="Delete" />
                </tr>
              </thead>
              <tbody>
                {visibleClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      No reimbursement claims this month.
                    </td>
                  </tr>
                ) : (
                  visibleClaims.map((claim) => {
                    const Icon = categoryIcons[claim.category] ?? Package;
                    const [prefix, suffix] = claim.ref.includes("-")
                      ? [
                          claim.ref.slice(0, claim.ref.indexOf("-") + 1),
                          claim.ref.slice(claim.ref.indexOf("-") + 1),
                        ]
                      : [claim.ref, ""];
                    return (
                      <tr key={claim.id}>
                        <td className={styles.refCell}>
                          <span>{prefix}</span>
                          {suffix ? <span>{suffix}</span> : null}
                        </td>
                        <td className={styles.descriptionCell}>{claim.title}</td>
                        <td>
                          <span className={styles.category}>
                            <Icon size={14} />
                            {claim.category}
                          </span>
                        </td>
                        <td className={styles.dateCell}>
                          <span>{claim.month}</span>
                          <span>{claim.day}</span>
                        </td>
                        <td className={styles.amountCell}>
                          {formatMoney(claim.amount)}
                        </td>
                        <td>
                          <span className={`${styles.status} ${statusClass(claim.status)}`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className={styles.receiptCell}>
                          <button
                            type="button"
                            aria-label={`Delete ${claim.ref}`}
                            onClick={() => void deleteClaim(claim)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h2>{section}</h2>
            <p>
              {section === "Team reimbursements"
                ? "Review reimbursement claims submitted by your team."
                : "Company expense policies and reimbursement limits."}
            </p>
          </div>
          <p className={styles.empty}>
            {section === "Team reimbursements"
              ? "No team reimbursements to review."
              : "No expense policies published yet."}
          </p>
        </section>
      )}

      <SimpleModal
        open={createOpen}
        title="Submit expense claim"
        fields={claimFields}
        submitLabel="Submit claim"
        submitIcon={<CircleDollarSign size={16} strokeWidth={2.25} />}
        showClose
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
