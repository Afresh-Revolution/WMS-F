export type AccountantPayrollStatus =
  | "In Preparation"
  | "Submitted"
  | "Paid";

export type AccountantPayrollPeriod = {
  id: string;
  title: string;
  month: string;
  year: string;
  status: AccountantPayrollStatus;
  staff: number;
  net: string;
  readiness: string;
};

export const accountantPayrollPeriods: AccountantPayrollPeriod[] = [
  {
    id: "aug-2026",
    title: "August 2026 payroll run",
    month: "August",
    year: "2026",
    status: "In Preparation",
    staff: 12,
    net: "₦ 6,976,000",
    readiness: "100% ready",
  },
  {
    id: "jul-2026",
    title: "July 2026 payroll run",
    month: "July",
    year: "2026",
    status: "Submitted",
    staff: 12,
    net: "₦ 6,890,000",
    readiness: "100% ready",
  },
  {
    id: "jun-2026",
    title: "June 2026 payroll run",
    month: "June",
    year: "2026",
    status: "Paid",
    staff: 12,
    net: "₦ 6,890,000",
    readiness: "100% ready",
  },
];

export const payrollMonthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type AccountantSalaryLine = {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  baseSalary: string;
  bonus: string | null;
  deduction: string | null;
  netPay: string;
};

export type AccountantPayrollDetail = {
  id: string;
  label: string;
  status: AccountantPayrollStatus;
  staff: number;
  recorded: string;
  readiness: string;
  summary: {
    gross: string;
    bonuses: string;
    deductions: string;
    net: string;
  };
  totals: {
    base: string;
    bonuses: string;
    deductions: string;
    net: string;
  };
  schedule: AccountantSalaryLine[];
};

const augustSchedule: AccountantSalaryLine[] = [
  {
    id: "1",
    name: "Tunde Balogun",
    role: "Front End Developer — Software Engineers",
    initials: "TB",
    avatarColor: "#fed7aa",
    baseSalary: "₦ 620,000",
    bonus: null,
    deduction: "₦ 124,000",
    netPay: "₦ 496,000",
  },
  {
    id: "2",
    name: "Nina Patel",
    role: "Lead Designer — Product Design",
    initials: "NP",
    avatarColor: "#fde68a",
    baseSalary: "₦ 940,000",
    bonus: "₦ 140,000",
    deduction: null,
    netPay: "₦ 1,080,000",
  },
  {
    id: "3",
    name: "Omar Reyes",
    role: "Backend Engineer — Software Engineers",
    initials: "OR",
    avatarColor: "#bfdbfe",
    baseSalary: "₦ 710,000",
    bonus: "₦ 60,000",
    deduction: "₦ 40,000",
    netPay: "₦ 730,000",
  },
  {
    id: "4",
    name: "Lena Fisher",
    role: "Hardware Lead — Hardware",
    initials: "LF",
    avatarColor: "#fecdd3",
    baseSalary: "₦ 680,000",
    bonus: null,
    deduction: null,
    netPay: "₦ 680,000",
  },
  {
    id: "5",
    name: "Maya Chen",
    role: "People Ops Manager — HR",
    initials: "MC",
    avatarColor: "#bbf7d0",
    baseSalary: "₦ 590,000",
    bonus: "₦ 25,000",
    deduction: null,
    netPay: "₦ 615,000",
  },
  {
    id: "6",
    name: "Jordan Lee",
    role: "Product Manager — Product",
    initials: "JL",
    avatarColor: "#ddd6fe",
    baseSalary: "₦ 760,000",
    bonus: null,
    deduction: null,
    netPay: "₦ 760,000",
  },
  {
    id: "7",
    name: "Sam Okoro",
    role: "Operations Lead — Operations",
    initials: "SO",
    avatarColor: "#a7f3d0",
    baseSalary: "₦ 540,000",
    bonus: "₦ 15,000",
    deduction: null,
    netPay: "₦ 555,000",
  },
  {
    id: "8",
    name: "Aisha Bello",
    role: "Finance Analyst — Finance",
    initials: "AB",
    avatarColor: "#fbcfe8",
    baseSalary: "₦ 480,000",
    bonus: null,
    deduction: null,
    netPay: "₦ 480,000",
  },
  {
    id: "9",
    name: "Theo Grant",
    role: "Fashion Executive — Fashion",
    initials: "TG",
    avatarColor: "#c7d2fe",
    baseSalary: "₦ 510,000",
    bonus: "₦ 10,000",
    deduction: null,
    netPay: "₦ 520,000",
  },
  {
    id: "10",
    name: "Chidi Nwosu",
    role: "QA Engineer — Software Engineers",
    initials: "CN",
    avatarColor: "#fef08a",
    baseSalary: "₦ 450,000",
    bonus: null,
    deduction: null,
    netPay: "₦ 450,000",
  },
  {
    id: "11",
    name: "Amara Diallo",
    role: "Content Lead — Media",
    initials: "AD",
    avatarColor: "#fdba74",
    baseSalary: "₦ 430,000",
    bonus: null,
    deduction: null,
    netPay: "₦ 430,000",
  },
  {
    id: "12",
    name: "Emeka Obi",
    role: "DevOps Engineer — Software Engineers",
    initials: "EO",
    avatarColor: "#99f6e4",
    baseSalary: "₦ 180,000",
    bonus: null,
    deduction: null,
    netPay: "₦ 180,000",
  },
];

export const accountantPayrollDetails: Record<string, AccountantPayrollDetail> = {
  "aug-2026": {
    id: "aug-2026",
    label: "August 2026",
    status: "In Preparation",
    staff: 12,
    recorded: "12/12",
    readiness: "100% ready",
    summary: {
      gross: "₦ 7,140,000",
      bonuses: "₦ 250,000",
      deductions: "₦ 164,000",
      net: "₦ 6,976,000",
    },
    totals: {
      base: "₦ 6,890,000",
      bonuses: "₦ 250,000",
      deductions: "₦ 164,000",
      net: "₦ 6,976,000",
    },
    schedule: augustSchedule,
  },
  "jul-2026": {
    id: "jul-2026",
    label: "July 2026",
    status: "Submitted",
    staff: 12,
    recorded: "12/12",
    readiness: "100% ready",
    summary: {
      gross: "₦ 7,054,000",
      bonuses: "₦ 164,000",
      deductions: "₦ 164,000",
      net: "₦ 6,890,000",
    },
    totals: {
      base: "₦ 6,890,000",
      bonuses: "₦ 164,000",
      deductions: "₦ 164,000",
      net: "₦ 6,890,000",
    },
    schedule: augustSchedule.map((row) => ({
      ...row,
      bonus:
        row.id === "2"
          ? "₦ 80,000"
          : row.id === "3"
            ? "₦ 40,000"
            : row.id === "5"
              ? "₦ 25,000"
              : row.id === "7"
                ? "₦ 19,000"
                : null,
      netPay:
        row.id === "2"
          ? "₦ 1,020,000"
          : row.id === "3"
            ? "₦ 710,000"
            : row.netPay,
    })),
  },
  "jun-2026": {
    id: "jun-2026",
    label: "June 2026",
    status: "Paid",
    staff: 12,
    recorded: "12/12",
    readiness: "100% ready",
    summary: {
      gross: "₦ 7,054,000",
      bonuses: "₦ 164,000",
      deductions: "₦ 164,000",
      net: "₦ 6,890,000",
    },
    totals: {
      base: "₦ 6,890,000",
      bonuses: "₦ 164,000",
      deductions: "₦ 164,000",
      net: "₦ 6,890,000",
    },
    schedule: augustSchedule,
  },
};

export function getAccountantPayrollDetail(
  id: string,
): AccountantPayrollDetail | null {
  if (accountantPayrollDetails[id]) {
    return accountantPayrollDetails[id];
  }

  const period = accountantPayrollPeriods.find((item) => item.id === id);
  if (period) {
    return {
      id: period.id,
      label: `${period.month} ${period.year}`,
      status: period.status,
      staff: period.staff,
      recorded: "0/12",
      readiness: period.readiness,
      summary: {
        gross: "₦ 0",
        bonuses: "₦ 0",
        deductions: "₦ 0",
        net: period.net,
      },
      totals: {
        base: "₦ 0",
        bonuses: "₦ 0",
        deductions: "₦ 0",
        net: period.net,
      },
      schedule: [],
    };
  }

  const match = id.match(/^([a-z]{3})-(\d{4})$/i);
  if (!match) return null;

  const [, monthKey, year] = match;
  const month =
    payrollMonthOptions.find(
      (name) => name.slice(0, 3).toLowerCase() === monthKey.toLowerCase(),
    ) ?? monthKey;

  return {
    id,
    label: `${month} ${year}`,
    status: "In Preparation",
    staff: 12,
    recorded: "0/12",
    readiness: "0% ready",
    summary: {
      gross: "₦ 0",
      bonuses: "₦ 0",
      deductions: "₦ 0",
      net: "₦ 0",
    },
    totals: {
      base: "₦ 0",
      bonuses: "₦ 0",
      deductions: "₦ 0",
      net: "₦ 0",
    },
    schedule: [],
  };
}
