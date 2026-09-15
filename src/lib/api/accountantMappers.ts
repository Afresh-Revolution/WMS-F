import { avatarColor, initials, num, str } from "@/lib/api/mappers";
import type {
  AccountantBill,
  AccountantPayment,
  AccountantPurchaseReview,
  AccountantStat,
} from "@/data/accountantOverview";
import type {
  AccountantBillItem,
  AccountantBillStatus,
} from "@/data/accountantBills";
import type { AccountantBonus, AccountantBonusType } from "@/data/accountantBonuses";
import type {
  AccountantDeduction,
  AccountantDeductionType,
} from "@/data/accountantDeductions";
import type {
  AccountantExpense,
  AccountantExpenseCategory,
  AccountantExpenseStatus,
} from "@/data/accountantExpenses";
import type {
  AccountantNotification,
  AccountantNotificationKind,
} from "@/data/accountantNotifications";
import type {
  AccountantPaymentCategory,
  AccountantPaymentRecord,
  AccountantPaymentStatus,
} from "@/data/accountantPayments";
import type {
  AccountantPayrollDetail,
  AccountantPayrollPeriod,
  AccountantPayrollStatus,
  AccountantSalaryLine,
} from "@/data/accountantPayroll";
import type {
  AccountantPurchase,
  AccountantPurchaseStatus,
} from "@/data/accountantPurchases";
import type { AccountantSalaryIncrement } from "@/data/accountantSalaryIncrements";
import type {
  AccountantVendor,
  AccountantVendorCategory,
  AccountantVendorStatus,
} from "@/data/accountantVendors";

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function unwrapAccountantData<T = unknown>(payload: unknown): T {
  const root = asRecord(payload);
  if ("data" in root) return root.data as T;
  return payload as T;
}

const LIST_KEYS = [
  "items",
  "records",
  "results",
  "rows",
  "bills",
  "invoices",
  "payments",
  "vendors",
  "expenses",
  "notifications",
  "runs",
  "periods",
  "deductions",
  "bonuses",
  "purchases",
  "purchaseRequests",
  "purchaseOrders",
  "salaryImplementations",
  "articles",
  "topics",
] as const;

export function unwrapAccountantList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  const data = unwrapAccountantData(payload);
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const rec = asRecord(data);
  for (const key of LIST_KEYS) {
    if (Array.isArray(rec[key])) return rec[key] as Record<string, unknown>[];
  }
  const nested = asRecord(rec.data);
  for (const key of LIST_KEYS) {
    if (Array.isArray(nested[key])) return nested[key] as Record<string, unknown>[];
  }
  return [];
}

export function nestedName(record: Record<string, unknown>, key: string): string {
  const nested = record[key];
  if (typeof nested === "string") return nested;
  const rec = asRecord(nested);
  return str(rec.name ?? rec.fullName ?? rec.title ?? rec.email);
}

export function formatAccountantNaira(value: unknown, fallback = "₦ 0"): string {
  if (typeof value === "string" && /[₦N]/.test(value)) return value;
  const amount = num(value, Number.NaN);
  if (!Number.isFinite(amount)) {
    const text = str(value);
    return text || fallback;
  }
  return `₦ ${Math.round(amount).toLocaleString("en-NG")}`;
}

export function amountValue(value: unknown): number {
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return num(value);
}

function formatDateLabel(value: unknown): string {
  const text = str(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function firstValue(
  record: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return undefined;
}

export function withFallback<T>(items: T[], fallback: T[]): T[] {
  return items.length > 0 ? items : fallback;
}

function mapPayrollStatus(value: unknown): AccountantPayrollStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("paid") || raw.includes("complete")) return "Paid";
  if (raw.includes("submit") || raw.includes("pending") || raw.includes("approv")) {
    return "Submitted";
  }
  return "In Preparation";
}

export function mapAccountantPayrollPeriod(
  record: Record<string, unknown>,
  index: number,
): AccountantPayrollPeriod {
  const month = str(record.month ?? record.periodMonth ?? record.payMonth);
  const year = str(record.year ?? record.periodYear ?? record.payYear);
  const title = str(
    record.title ?? record.name ?? record.label,
    [month, year, "payroll run"].filter(Boolean).join(" ") || `Payroll run ${index + 1}`,
  );
  const staff = num(record.staff ?? record.employeeCount ?? record.headcount, 0);
  const recorded = num(record.recorded ?? record.preparedCount, staff);
  const readiness =
    str(record.readiness) ||
    (staff > 0 ? `${Math.round((recorded / staff) * 100)}% ready` : "0% ready");

  return {
    id: str(record.id ?? record._id ?? record.runId, `run-${index + 1}`),
    title,
    month: month || title,
    year,
    status: mapPayrollStatus(record.status ?? record.state),
    staff,
    net: formatAccountantNaira(record.net ?? record.netPay ?? record.totalNet ?? record.amount),
    readiness,
  };
}

export function mapAccountantSalaryLine(
  record: Record<string, unknown>,
  index: number,
): AccountantSalaryLine {
  const name = str(
    record.employeeName ??
      record.name ??
      nestedName(record, "employee") ??
      nestedName(record, "staff"),
    `Employee ${index + 1}`,
  );
  const bonusRaw = firstValue(record, ["bonus", "bonuses", "bonusAmount"]);
  const deductionRaw = firstValue(record, [
    "deduction",
    "deductions",
    "deductionAmount",
  ]);
  const bonusAmount = amountValue(bonusRaw);
  const deductionAmount = amountValue(deductionRaw);

  return {
    id: str(record.id ?? record._id ?? record.employeeId, `line-${index + 1}`),
    name,
    role: str(
      record.role ?? record.jobTitle ?? record.department ?? nestedName(record, "department"),
    ),
    initials: str(record.initials, initials(name) || "NA"),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    baseSalary: formatAccountantNaira(record.baseSalary ?? record.base ?? record.gross),
    bonus: bonusAmount > 0 ? formatAccountantNaira(bonusRaw) : null,
    deduction: deductionAmount > 0 ? formatAccountantNaira(deductionRaw) : null,
    netPay: formatAccountantNaira(record.netPay ?? record.net ?? record.takeHome),
  };
}

export function mapAccountantPayrollDetail(
  runPayload: unknown,
  itemsPayload: unknown,
  fallback: AccountantPayrollDetail | null,
): AccountantPayrollDetail | null {
  const run = asRecord(unwrapAccountantData(runPayload));
  const hasRun = Object.keys(run).length > 0;
  const items = unwrapAccountantList(itemsPayload).map(mapAccountantSalaryLine);
  if (!hasRun && items.length === 0) return fallback;

  const mappedPeriod = hasRun ? mapAccountantPayrollPeriod(run, 0) : null;
  if (!mappedPeriod && !fallback) return fallback;

  const summarySource = asRecord(run.summary ?? run.totals ?? run);
  const schedule = items.length > 0 ? items : fallback?.schedule ?? [];
  const staff = mappedPeriod?.staff || schedule.length || fallback?.staff || 0;
  const netValue =
    summarySource.net ??
    summarySource.netPayable ??
    mappedPeriod?.net ??
    fallback?.summary.net;

  return {
    id: mappedPeriod?.id ?? fallback?.id ?? "payroll",
    label: str(
      run.label ??
        run.period ??
        (mappedPeriod ? `${mappedPeriod.month} ${mappedPeriod.year}` : fallback?.label),
      mappedPeriod?.title ?? fallback?.label ?? "Payroll",
    ),
    status: mappedPeriod?.status ?? fallback?.status ?? "In Preparation",
    staff,
    recorded: str(
      run.recorded ?? run.preparedLabel,
      `${schedule.length || staff}/${staff || schedule.length}`,
    ),
    readiness: mappedPeriod?.readiness ?? fallback?.readiness ?? "0% ready",
    summary: {
      gross: formatAccountantNaira(
        summarySource.gross ?? summarySource.grossPayable ?? fallback?.summary.gross,
      ),
      bonuses: formatAccountantNaira(
        summarySource.bonuses ?? summarySource.totalBonuses ?? fallback?.summary.bonuses,
      ),
      deductions: formatAccountantNaira(
        summarySource.deductions ??
          summarySource.totalDeductions ??
          fallback?.summary.deductions,
      ),
      net: formatAccountantNaira(netValue),
    },
    totals: {
      base: formatAccountantNaira(
        summarySource.base ?? summarySource.baseSalary ?? fallback?.totals.base,
      ),
      bonuses: formatAccountantNaira(
        summarySource.bonuses ?? fallback?.totals.bonuses,
      ),
      deductions: formatAccountantNaira(
        summarySource.deductions ?? fallback?.totals.deductions,
      ),
      net: formatAccountantNaira(netValue ?? fallback?.totals.net),
    },
    schedule,
  };
}

function mapBillStatus(value: unknown): AccountantBillStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("overdue")) return "Overdue";
  if (raw.includes("paid") || raw.includes("settled")) return "Paid";
  if (raw.includes("schedul")) return "Scheduled";
  return "Unpaid";
}

export function mapAccountantBillItem(
  record: Record<string, unknown>,
  index: number,
): AccountantBillItem {
  const status = mapBillStatus(record.status ?? record.state);
  const amount = amountValue(record.amount ?? record.total ?? record.balance);
  const due = str(record.dueDate ?? record.due ?? record.due_at);
  const invoice = str(record.invoice ?? record.invoiceNumber ?? record.invoiceRef);
  const timing = str(record.timing ?? record.dueLabel);
  const overdue = status === "Overdue" || Boolean(record.overdue);

  return {
    id: str(record.id ?? record._id, `bill-${index + 1}`),
    ref: str(record.ref ?? record.reference ?? record.code, `BL-${index + 1}`),
    vendor: str(
      record.vendor ?? record.vendorName ?? nestedName(record, "vendor"),
      "Vendor",
    ),
    category: str(record.category ?? record.type, "Other"),
    dueDate: due ? (due.toLowerCase().startsWith("due") ? due : `Due ${formatDateLabel(due)}`) : "",
    invoice: invoice || undefined,
    amount: formatAccountantNaira(record.amount ?? record.total ?? amount),
    amountValue: amount,
    status,
    timing: timing || (overdue ? "overdue" : "due soon"),
    paidDate: status === "Paid" ? str(record.paidDate ?? record.paidAt, formatDateLabel(record.updatedAt)) : undefined,
    missingInvoice: Boolean(record.missingInvoice) || !invoice,
    overdue,
    dueSoon: Boolean(record.dueSoon) || str(timing).includes("in "),
  };
}

export function mapOverviewBill(
  record: Record<string, unknown>,
  index: number,
): AccountantBill {
  const item = mapAccountantBillItem(record, index);
  return {
    id: item.id,
    name: item.vendor,
    category: item.category,
    dueDate: item.dueDate,
    amount: item.amount,
    timing: item.timing,
    overdue: item.overdue,
  };
}

function mapPurchaseStatus(value: unknown): AccountantPurchaseStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("paid") || raw.includes("complete")) return "Paid";
  if (raw.includes("await") || raw.includes("payment") || raw.includes("approv")) {
    return "Awaiting Payment";
  }
  if (raw.includes("recommend")) return "Recommended";
  return "Under Review";
}

export function mapAccountantPurchase(
  record: Record<string, unknown>,
  index: number,
): AccountantPurchase {
  return {
    id: str(record.id ?? record._id, `purchase-${index + 1}`),
    ref: str(record.ref ?? record.reference ?? record.code, `PR-${index + 1}`),
    title: str(record.title ?? record.item ?? record.name ?? record.description, "Purchase"),
    department: str(
      record.department ?? nestedName(record, "department") ?? record.unit,
      "—",
    ),
    requester: str(
      record.requester ??
        record.requestor ??
        record.requestedBy ??
        nestedName(record, "requester"),
      "—",
    ),
    date: formatDateLabel(record.date ?? record.submittedAt ?? record.createdAt),
    amount: formatAccountantNaira(record.amount ?? record.total),
    status: mapPurchaseStatus(record.status ?? record.state),
    recommendation: str(record.recommendation || record.notes) || undefined,
  };
}

export function mapOverviewPurchase(
  record: Record<string, unknown>,
  index: number,
): AccountantPurchaseReview {
  const item = mapAccountantPurchase(record, index);
  return {
    id: item.id,
    title: item.title,
    department: item.department,
    requestor: item.requester,
    amount: item.amount,
    action: item.status === "Awaiting Payment" || item.status === "Paid" ? "Pay" : "Review",
  };
}

function mapExpenseStatus(value: unknown): AccountantExpenseStatus {
  const raw = str(value).toLowerCase();
  if (raw.includes("reimburse") || raw.includes("paid")) return "Reimbursed";
  if (raw.includes("return") || raw.includes("reject")) return "Returned";
  if (raw.includes("verif") || raw.includes("approv")) return "Verified";
  return "Pending Review";
}

const expenseCategories: AccountantExpenseCategory[] = [
  "Travel",
  "Meals",
  "Supplies",
  "Equipment",
  "Software",
  "Client Entertainment",
  "Other",
];

function mapExpenseCategory(value: unknown): AccountantExpenseCategory {
  const raw = str(value);
  return (
    expenseCategories.find(
      (item) => item.toLowerCase() === raw.toLowerCase(),
    ) ?? "Other"
  );
}

export function mapAccountantExpense(
  record: Record<string, unknown>,
  index: number,
): AccountantExpense {
  const name = str(
    record.employeeName ?? record.name ?? nestedName(record, "employee"),
    "Employee",
  );
  const amount = amountValue(record.amount ?? record.total);
  return {
    id: str(record.id ?? record._id, `expense-${index + 1}`),
    ref: str(record.ref ?? record.reference ?? record.code, `EX-${index + 1}`),
    employeeId: str(record.employeeId ?? asRecord(record.employee).id, `emp-${index + 1}`),
    name,
    initials: str(record.initials, initials(name) || "NA"),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    department: str(record.department ?? nestedName(record, "department"), "—"),
    category: mapExpenseCategory(record.category ?? record.type),
    note: str(record.note ?? record.description ?? record.title, "Expense"),
    date: formatDateLabel(record.date ?? record.submittedAt ?? record.createdAt),
    amount,
    amountLabel: formatAccountantNaira(record.amount ?? amount),
    status: mapExpenseStatus(record.status ?? record.state),
    hasReceipt: Boolean(record.hasReceipt ?? record.receipt ?? record.receiptUrl),
  };
}

const vendorCategories: AccountantVendorCategory[] = [
  "Statutory",
  "Utilities",
  "Equipment",
  "Professional Services",
  "Supplies",
  "Benefits",
  "Other",
];

export function mapAccountantVendor(
  record: Record<string, unknown>,
  index: number,
): AccountantVendor {
  const categoryRaw = str(record.category ?? record.type);
  const category =
    vendorCategories.find((item) => item.toLowerCase() === categoryRaw.toLowerCase()) ??
    "Other";
  const active = record.active ?? record.isActive ?? record.status;
  const status: AccountantVendorStatus =
    str(active).toLowerCase() === "inactive" || active === false ? "Inactive" : "Active";
  const paid = amountValue(record.totalPaid ?? record.ytdSpend ?? record.totalSpend);

  return {
    id: str(record.id ?? record._id, `vendor-${index + 1}`),
    name: str(record.name ?? record.vendorName, "Vendor"),
    category,
    status,
    contactName: str(record.contactName ?? record.contact ?? nestedName(record, "contact"), "—"),
    email: str(record.email ?? record.contactEmail, "—"),
    phone: str(record.phone ?? record.contactPhone, "—"),
    bankDetails: str(record.bankDetails ?? record.bank ?? record.accountNumber, "—"),
    totalPaid: formatAccountantNaira(record.totalPaid ?? paid),
    totalPaidValue: paid,
    openBills: num(record.openBills ?? record.pendingBills, 0),
  };
}

function mapPaymentCategory(value: unknown): AccountantPaymentCategory {
  const raw = str(value).toLowerCase();
  if (raw.includes("payroll") || raw.includes("salary")) return "Payroll";
  if (raw.includes("bill")) return "Bill";
  if (raw.includes("purchase")) return "Purchase";
  if (raw.includes("reimburse")) return "Reimbursement";
  return "Expense";
}

export function mapAccountantPaymentRecord(
  record: Record<string, unknown>,
  index: number,
): AccountantPaymentRecord {
  const statusRaw = str(record.status ?? record.state).toLowerCase();
  const status: AccountantPaymentStatus = statusRaw.includes("schedul")
    ? "Scheduled"
    : "Paid";
  const amount = amountValue(record.amount ?? record.total);
  return {
    id: str(record.id ?? record._id, `pay-${index + 1}`),
    ref: str(record.ref ?? record.reference ?? record.code, `PAY-${index + 1}`),
    payee: str(
      record.payee ?? record.vendor ?? record.name ?? nestedName(record, "vendor"),
      "Payee",
    ),
    category: mapPaymentCategory(record.category ?? record.type ?? record.source),
    date: formatDateLabel(record.date ?? record.paidAt ?? record.createdAt),
    amount: formatAccountantNaira(record.amount ?? amount),
    amountValue: amount,
    status,
    evidence: str(record.evidence ?? record.receipt ?? record.attachment) || undefined,
  };
}

export function mapOverviewPayment(
  record: Record<string, unknown>,
  index: number,
): AccountantPayment {
  const item = mapAccountantPaymentRecord(record, index);
  return {
    id: item.id,
    name: item.payee,
    type: item.category === "Purchase" ? "Purchase" : "Bill",
    date: item.date,
    amount: item.amount,
  };
}

const deductionTypes: AccountantDeductionType[] = [
  "PAYE Tax",
  "Pension",
  "Loan Repayment",
  "NHF",
  "Other",
];

export function mapAccountantDeduction(
  record: Record<string, unknown>,
  index: number,
): AccountantDeduction {
  const name = str(
    record.employeeName ?? record.name ?? nestedName(record, "employee"),
    "Employee",
  );
  const typeRaw = str(record.type ?? record.category ?? record.deductionType);
  const type =
    deductionTypes.find((item) => item.toLowerCase() === typeRaw.toLowerCase()) ??
    "Other";
  const amount = amountValue(record.amount ?? record.value);
  return {
    id: str(record.id ?? record._id, `deduction-${index + 1}`),
    employeeId: str(record.employeeId ?? asRecord(record.employee).id, `emp-${index + 1}`),
    name,
    initials: str(record.initials, initials(name) || "NA"),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    type,
    department: str(record.department ?? nestedName(record, "department"), "—"),
    note: str(record.note ?? record.description, "Deduction recorded"),
    date: formatDateLabel(record.date ?? record.createdAt ?? record.appliedAt),
    amount,
    amountLabel: formatAccountantNaira(record.amount ?? amount),
  };
}

const bonusTypes: AccountantBonusType[] = [
  "Performance",
  "Overtime",
  "Referral",
  "Spot",
  "Retention",
];

export function mapAccountantBonus(
  record: Record<string, unknown>,
  index: number,
): AccountantBonus {
  const name = str(
    record.employeeName ?? record.name ?? nestedName(record, "employee"),
    "Employee",
  );
  const typeRaw = str(record.type ?? record.category ?? record.bonusType);
  const type =
    bonusTypes.find((item) => item.toLowerCase() === typeRaw.toLowerCase()) ??
    "Performance";
  const amount = amountValue(record.amount ?? record.value ?? record.bonus);
  return {
    id: str(record.id ?? record._id, `bonus-${index + 1}`),
    employeeId: str(record.employeeId ?? asRecord(record.employee).id, `emp-${index + 1}`),
    name,
    initials: str(record.initials, initials(name) || "NA"),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    type,
    department: str(record.department ?? nestedName(record, "department"), "—"),
    note: str(record.note ?? record.description, "Bonus recorded"),
    date: formatDateLabel(record.date ?? record.createdAt),
    amount,
    amountLabel: formatAccountantNaira(record.amount ?? amount),
  };
}

export function mapAccountantSalaryIncrement(
  record: Record<string, unknown>,
  index: number,
): AccountantSalaryIncrement {
  const name = str(
    record.employeeName ?? record.name ?? nestedName(record, "employee"),
    "Employee",
  );
  const statusRaw = str(record.status ?? record.state).toLowerCase();
  return {
    id: str(record.id ?? record._id, `si-${index + 1}`),
    ref: str(record.ref ?? record.reference ?? record.code, `SI-${index + 1}`),
    name,
    role: str(record.role ?? record.department ?? nestedName(record, "department"), "—"),
    initials: str(record.initials, initials(name) || "NA"),
    avatarColor: str(record.avatarColor, avatarColor(name)),
    percent: str(record.percent ?? record.increasePercent, "+0%"),
    fromSalary: formatAccountantNaira(record.fromSalary ?? record.currentSalary ?? record.from),
    toSalary: formatAccountantNaira(record.toSalary ?? record.newSalary ?? record.to),
    approvedBy: str(record.approvedBy ?? nestedName(record, "approver"), "—"),
    approvedDate: formatDateLabel(record.approvedDate ?? record.approvedAt),
    appliedDate: str(record.appliedDate ?? record.implementedAt)
      ? formatDateLabel(record.appliedDate ?? record.implementedAt)
      : undefined,
    status:
      statusRaw.includes("implement") || statusRaw.includes("complete") || statusRaw.includes("applied")
        ? "implemented"
        : "awaiting",
  };
}

export function mapAccountantNotification(
  record: Record<string, unknown>,
  index: number,
): AccountantNotification {
  const kindRaw = str(record.kind ?? record.type ?? record.category).toLowerCase();
  const kind: AccountantNotificationKind = kindRaw.includes("system")
    ? "System"
    : "Workflow";
  const unread =
    record.read === true || record.isRead === true
      ? false
      : record.unread !== false;
  return {
    id: str(record.id ?? record._id, `notif-${index + 1}`),
    kind,
    message: str(record.message ?? record.title ?? record.body, "Notification"),
    time: str(record.time ?? record.createdAt, formatDateLabel(record.createdAt) || "just now"),
    unread,
  };
}

export function overlayAccountantStats(
  fallback: AccountantStat[],
  payload: unknown,
): AccountantStat[] {
  const data = asRecord(unwrapAccountantData(payload));
  const metrics = asRecord(data.metrics ?? data.stats ?? data);
  if (Object.keys(metrics).length === 0) return fallback;

  const list = unwrapAccountantList(payload);
  if (list.length > 0 && str(list[0]?.label) && str(list[0]?.value)) {
    return list.map((record, index) => ({
      id: str(record.id, fallback[index]?.id ?? `stat-${index + 1}`),
      label: str(record.label ?? record.name, fallback[index]?.label ?? "Metric"),
      value: str(record.value ?? record.count ?? record.total, fallback[index]?.value ?? "0"),
      meta: str(record.meta ?? record.subtitle ?? fallback[index]?.meta ?? ""),
      tone: fallback[index]?.tone,
    }));
  }

  const keyMap: Record<string, string[]> = {
    period: ["currentPayrollPeriod", "payrollPeriod", "period", "payPeriod"],
    prep: ["payrollPreparation", "preparationPercent", "payrollReady"],
    salary: ["totalMonthlySalary", "monthlySalary", "totalSalary"],
    bonuses: ["totalMonthlyBonuses", "bonuses", "totalBonuses"],
    increments: ["incrementsAwaiting", "salaryImplementations", "pendingIncrements"],
    approval: ["payrollAwaitingApproval", "awaitingApproval"],
    "purchases-review": ["purchasesUnderReview", "purchaseReviews"],
    "purchases-pay": ["purchasesAwaitingPayment", "purchasesToPay"],
    "unpaid-bills": ["unpaidBills", "openBills"],
    "bills-soon": ["billsDueSoon", "dueSoon"],
    overdue: ["overdueBills", "overdue"],
    expenses: ["monthlyExpenseTotal", "expenseTotal", "expenses"],
    "expense-reviews": ["pendingExpenseReviews", "pendingExpenses"],
    reimbursements: ["pendingReimbursements", "reimbursements"],
    receipts: ["missingReceipts"],
    invoices: ["missingInvoices"],
  };

  return fallback.map((stat) => {
    const keys = keyMap[stat.id] ?? [];
    const raw = firstValue(metrics, keys);
    if (raw === undefined) return stat;
    const rec = asRecord(raw);
    const value = rec.value ?? rec.count ?? rec.total ?? rec.amount ?? raw;
    const meta = rec.meta ?? rec.label ?? rec.subtitle ?? stat.meta;
    return {
      ...stat,
      value: formatMaybeStat(value, stat.value),
      meta: str(meta, stat.meta),
    };
  });
}

function formatMaybeStat(value: unknown, fallback: string): string {
  if (typeof value === "number") {
    if (Math.abs(value) >= 1000) return formatAccountantNaira(value);
    return String(value);
  }
  const text = str(value);
  return text || fallback;
}

export function mapDashboardPayrollSummary(payload: unknown) {
  const data = asRecord(unwrapAccountantData(payload));
  const payroll = asRecord(data.payroll ?? data.payrollSummary ?? data);
  const linesSource = unwrapAccountantList(
    payroll.lines ?? payroll.breakdown ?? payroll.items,
  );
  return {
    period: str(payroll.period ?? payroll.title ?? payroll.label),
    status: str(payroll.status ?? payroll.state),
    staff: num(payroll.staff ?? payroll.employeeCount),
    lines: linesSource.map((line) => ({
      label: str(line.label ?? line.name),
      value: formatAccountantNaira(line.value ?? line.amount),
      emphasize: Boolean(line.emphasize ?? line.net),
    })),
  };
}

export type AccountantMappedProfile = {
  initials: string;
  name: string;
  jobTitle: string;
  department: string;
  status: "Active" | "Inactive";
  employeeId: string;
  annualLeaveDays: number;
  personal: {
    companyEmail: string;
    personalEmail: string;
    phone: string;
    location: string;
  };
  employment: {
    role: string;
    department: string;
    startDate: string;
    type: string;
    reportsTo: string;
  };
};

export function mapAccountantProfile(
  profilePayload: unknown,
  employmentPayload: unknown,
  fallback: AccountantMappedProfile,
): AccountantMappedProfile {
  const profile = asRecord(unwrapAccountantData(profilePayload));
  const employmentRoot = asRecord(unwrapAccountantData(employmentPayload));
  const employee = asRecord(profile.employee ?? profile.linkedEmployee ?? profile);
  const personal = asRecord(profile.personal ?? employee.personal ?? employee);
  const employment = asRecord(
    employmentRoot.employment ?? employmentRoot ?? profile.employment ?? employee,
  );
  const name = str(
    profile.name ?? employee.name ?? employee.fullName ?? fallback.name,
    fallback.name,
  );
  const merged = { ...profile, ...employee, ...employment };
  if (Object.keys(profile).length === 0 && Object.keys(employmentRoot).length === 0) {
    return fallback;
  }

  return {
    initials: str(merged.initials, initials(name) || fallback.initials),
    name,
    jobTitle: str(merged.jobTitle ?? merged.role ?? merged.title, fallback.jobTitle),
    department: str(
      merged.department ?? nestedName(merged, "department"),
      fallback.department,
    ),
    status: str(merged.status).toLowerCase().includes("inact") ? "Inactive" : "Active",
    employeeId: str(merged.employeeId ?? merged.staffId ?? merged.code, fallback.employeeId),
    annualLeaveDays: num(
      merged.annualLeaveDays ?? asRecord(merged.leave).annual,
      fallback.annualLeaveDays,
    ),
    personal: {
      companyEmail: str(
        personal.companyEmail ?? personal.email ?? merged.email,
        fallback.personal.companyEmail,
      ),
      personalEmail: str(
        personal.personalEmail ?? personal.alternateEmail,
        fallback.personal.personalEmail,
      ),
      phone: str(personal.phone ?? personal.mobile ?? merged.phone, fallback.personal.phone),
      location: str(
        personal.location ?? personal.address ?? personal.city,
        fallback.personal.location,
      ),
    },
    employment: {
      role: str(employment.role ?? employment.jobTitle, fallback.employment.role),
      department: str(
        employment.department ?? nestedName(employment, "department"),
        fallback.employment.department,
      ),
      startDate: str(
        employment.startDate ?? employment.joinedAt,
        fallback.employment.startDate,
      ),
      type: str(employment.type ?? employment.employmentType, fallback.employment.type),
      reportsTo: str(
        employment.reportsTo ?? nestedName(employment, "manager"),
        fallback.employment.reportsTo,
      ),
    },
  };
}

export type AccountantHelpItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
};

export function mapAccountantHelpItems(payload: unknown): AccountantHelpItem[] {
  return unwrapAccountantList(payload).map((record, index) => ({
    id: str(record.id ?? record.slug, `help-${index + 1}`),
    title: str(record.title ?? record.name ?? record.label, "Help topic"),
    description: str(record.description ?? record.body ?? record.summary),
    href: str(record.href ?? record.route ?? record.url) || undefined,
  }));
}

export type AccountantSettingsRecord = {
  emailAlerts: boolean;
  payrollReminders: boolean;
  digest: string;
};

export function mapAccountantSettings(
  payload: unknown,
  fallback: AccountantSettingsRecord,
): AccountantSettingsRecord {
  const data = asRecord(unwrapAccountantData(payload));
  if (Object.keys(data).length === 0) return fallback;
  return {
    emailAlerts: data.emailAlerts !== false && data.email !== false,
    payrollReminders: data.payrollReminders !== false,
    digest: str(data.digest ?? data.emailDigest, fallback.digest),
  };
}

export type AccountantReportView = {
  summary: { id: string; label: string; value: string; icon: "payroll" | "paid" | "bills" | "expenses" }[];
  trend: { month: string; value: number }[];
  spendMix: { label: string; value: number; color: string }[];
  expensesByCategory: { label: string; value: number }[];
};

export function mapAccountantReports(
  reportsPayload: unknown,
  summaryPayload: unknown,
  fallback: AccountantReportView,
): AccountantReportView {
  const reports = asRecord(unwrapAccountantData(reportsPayload));
  const summaryRoot = asRecord(unwrapAccountantData(summaryPayload));
  const merged = { ...reports, ...summaryRoot };
  if (Object.keys(merged).length === 0) return fallback;

  const summaryList = unwrapAccountantList(merged.summary ?? merged.totals ?? summaryRoot);
  const summary =
    summaryList.length > 0
      ? fallback.summary.map((item, index) => ({
          ...item,
          value: formatAccountantNaira(
            summaryList[index]?.value ??
              summaryList[index]?.amount ??
              summaryList[index]?.total ??
              item.value,
            item.value,
          ),
          label: str(summaryList[index]?.label, item.label),
        }))
      : fallback.summary.map((item) => {
          const raw = firstValue(merged, [
            item.id,
            `${item.id}Total`,
            `${item.id}Value`,
          ]);
          return raw === undefined
            ? item
            : { ...item, value: formatAccountantNaira(raw, item.value) };
        });

  const trend = unwrapAccountantList(merged.trend ?? merged.payrollTrend).map((row) => ({
    month: str(row.month ?? row.label),
    value: amountValue(row.value ?? row.amount ?? row.net),
  }));
  const spendMix = unwrapAccountantList(merged.spendMix ?? merged.mix).map((row, index) => ({
    label: str(row.label ?? row.category),
    value: amountValue(row.value ?? row.amount),
    color: str(row.color, fallback.spendMix[index]?.color ?? "#ed5a28"),
  }));
  const expensesByCategory = unwrapAccountantList(
    merged.expensesByCategory ?? merged.expenseCategories,
  ).map((row) => ({
    label: str(row.label ?? row.category),
    value: amountValue(row.value ?? row.amount),
  }));

  return {
    summary,
    trend: trend.length > 0 ? trend : fallback.trend,
    spendMix: spendMix.length > 0 ? spendMix : fallback.spendMix,
    expensesByCategory:
      expensesByCategory.length > 0 ? expensesByCategory : fallback.expensesByCategory,
  };
}
