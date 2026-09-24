export type VendorFilter = "Active" | "All";

export type Vendor = {
  id: string;
  name: string;
  category: string;
  location: string;
  email: string;
  ytdSpend: string;
  openBills: number;
  active: boolean;
};

export const vendorStats = [
  { id: "total", label: "Total vendors", value: "6" },
  { id: "open-bills", label: "Open bills", value: "3" },
  { id: "ytd-spend", label: "Total YTD spend", value: "₦ 62.3M" },
] as const;

export const vendors: Vendor[] = [
  {
    id: "1",
    name: "AWS Cloud Services",
    category: "IT Infrastructure",
    location: "Seattle, USA",
    email: "support@aws.amazon.com",
    ytdSpend: "₦ 9,840,000",
    openBills: 1,
    active: true,
  },
  {
    id: "2",
    name: "ARM Pensions",
    category: "Pension Management",
    location: "Lagos, Nigeria",
    email: "remittance@armpension.com",
    ytdSpend: "₦ 33,396,792",
    openBills: 1,
    active: true,
  },
  {
    id: "3",
    name: "Prestige Health HMO",
    category: "Health Insurance",
    location: "Abuja, Nigeria",
    email: "billing@prestigehmo.ng",
    ytdSpend: "₦ 12,840,000",
    openBills: 1,
    active: true,
  },
  {
    id: "4",
    name: "Office Supplies Co.",
    category: "Office Supplies",
    location: "Lagos, Nigeria",
    email: "orders@officesupplies.ng",
    ytdSpend: "₦ 920,000",
    openBills: 0,
    active: true,
  },
  {
    id: "5",
    name: "IT Infrastructure Ltd",
    category: "Hardware",
    location: "Lagos, Nigeria",
    email: "sales@itinfra.ng",
    ytdSpend: "₦ 4,800,000",
    openBills: 0,
    active: true,
  },
  {
    id: "6",
    name: "Lagos Water Board",
    category: "Utilities",
    location: "Lagos, Nigeria",
    email: "billing@lwb.gov.ng",
    ytdSpend: "₦ 504,000",
    openBills: 0,
    active: true,
  },
];

export function matchesVendorFilter(vendor: Vendor, filter: VendorFilter): boolean {
  if (filter === "All") return true;
  return vendor.active;
}
