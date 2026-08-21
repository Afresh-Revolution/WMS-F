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
    email: "billing@aws.amazon.com",
    ytdSpend: "₦ 12,450,000",
    openBills: 1,
    active: true,
  },
  {
    id: "2",
    name: "ARM Pensions",
    category: "Pension Management",
    location: "Lagos, Nigeria",
    email: "accounts@armpensions.com",
    ytdSpend: "₦ 18,920,000",
    openBills: 1,
    active: true,
  },
  {
    id: "3",
    name: "Prestige Health HMO",
    category: "Health Insurance",
    location: "Abuja, Nigeria",
    email: "finance@prestigehealth.ng",
    ytdSpend: "₦ 9,840,000",
    openBills: 1,
    active: true,
  },
  {
    id: "4",
    name: "Office Supplies Co.",
    category: "Office Supplies",
    location: "Lagos, Nigeria",
    email: "orders@officesupplies.ng",
    ytdSpend: "₦ 1,280,000",
    openBills: 0,
    active: true,
  },
  {
    id: "5",
    name: "IT Infrastructure Ltd",
    category: "Hardware",
    location: "Lagos, Nigeria",
    email: "billing@itinfra.ng",
    ytdSpend: "₦ 6,450,000",
    openBills: 0,
    active: true,
  },
  {
    id: "6",
    name: "Lagos Water Board",
    category: "Utilities",
    location: "Lagos, Nigeria",
    email: "revenue@lagoswater.gov.ng",
    ytdSpend: "₦ 480,000",
    openBills: 0,
    active: true,
  },
];

export function matchesVendorFilter(vendor: Vendor, filter: VendorFilter): boolean {
  if (filter === "All") return true;
  return vendor.active;
}
