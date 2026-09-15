export type AccountantVendorStatus = "Active" | "Inactive";

export type AccountantVendorFilter = "All" | "Active" | "Inactive";

export type AccountantVendorCategory =
  | "Statutory"
  | "Utilities"
  | "Equipment"
  | "Professional Services"
  | "Supplies"
  | "Benefits"
  | "Other";

export type AccountantVendor = {
  id: string;
  name: string;
  category: AccountantVendorCategory;
  status: AccountantVendorStatus;
  contactName: string;
  email: string;
  phone: string;
  bankDetails: string;
  totalPaid: string;
  totalPaidValue: number;
  openBills: number;
};

export const accountantVendorCategories: AccountantVendorCategory[] = [
  "Statutory",
  "Utilities",
  "Equipment",
  "Professional Services",
  "Supplies",
  "Benefits",
  "Other",
];

export const accountantVendorFilters: AccountantVendorFilter[] = [
  "All",
  "Active",
  "Inactive",
];

export const accountantVendors: AccountantVendor[] = [
  {
    id: "1",
    name: "ARM Pensions",
    category: "Statutory",
    status: "Active",
    contactName: "Pensions Desk",
    email: "remit@armpensions.com",
    phone: "+234 1 271 5000",
    bankDetails: "GTBank — 0123456789",
    totalPaid: "₦ 22,400,000",
    totalPaidValue: 22400000,
    openBills: 1,
  },
  {
    id: "2",
    name: "IT Infrastructure Ltd",
    category: "Equipment",
    status: "Active",
    contactName: "Ada Nwosu",
    email: "billing@itinfra.ng",
    phone: "+234 802 555 0192",
    bankDetails: "Access Bank — 0789012345",
    totalPaid: "₦ 4,280,000",
    totalPaidValue: 4280000,
    openBills: 0,
  },
  {
    id: "3",
    name: "Prestige Health HMO",
    category: "Professional Services",
    status: "Active",
    contactName: "Funke Adeyemi",
    email: "finance@prestigehmo.com",
    phone: "+234 809 444 7788",
    bankDetails: "Zenith Bank — 2210987654",
    totalPaid: "₦ 6,420,000",
    totalPaidValue: 6420000,
    openBills: 0,
  },
  {
    id: "4",
    name: "Lagos Water Board",
    category: "Utilities",
    status: "Active",
    contactName: "Billing Desk",
    email: "accounts@lagoswater.gov.ng",
    phone: "+234 803 111 2200",
    bankDetails: "UBA — 1029384756",
    totalPaid: "₦ 582,000",
    totalPaidValue: 582000,
    openBills: 1,
  },
  {
    id: "5",
    name: "Office Supplies Co.",
    category: "Supplies",
    status: "Active",
    contactName: "Ibrahim Musa",
    email: "orders@officesupplies.ng",
    phone: "+234 805 667 8890",
    bankDetails: "First Bank — 3098765432",
    totalPaid: "₦ 1,240,000",
    totalPaidValue: 1240000,
    openBills: 0,
  },
  {
    id: "6",
    name: "Prestige Equipment",
    category: "Equipment",
    status: "Inactive",
    contactName: "Tolu A.",
    email: "orders@prestigeequip.ng",
    phone: "+234 802 998 7766",
    bankDetails: "GTBank — 5566778899",
    totalPaid: "₦ 410,000",
    totalPaidValue: 410000,
    openBills: 0,
  },
];

export function formatVendorNaira(amount: number) {
  return `₦ ${amount.toLocaleString("en-NG")}`;
}
