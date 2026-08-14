export const reportKpis = [
  { id: "headcount", label: "Total Headcount", value: "1,248", badge: "+2.4%", tone: "up" as const },
  { id: "attendance", label: "Avg Attendance", value: "89.4%", badge: "this week", tone: "meta" as const },
  { id: "attrition", label: "Attrition Rate", value: "4.2%", badge: "-0.3%", tone: "down" as const },
  { id: "accuracy", label: "Report Accuracy", value: "94%", badge: "Healthy", tone: "good" as const },
];

export const headcountGrowth = [
  { month: "Jan", value: 1080 },
  { month: "Feb", value: 1120 },
  { month: "Mar", value: 1180 },
  { month: "Apr", value: 1210 },
  { month: "May", value: 1260 },
  { month: "Jun", value: 1290 },
  { month: "Jul", value: 1248 },
];

export const weeklyAttendance = [
  { day: "Mon", value: 91 },
  { day: "Tue", value: 88 },
  { day: "Wed", value: 93 },
  { day: "Thu", value: 90 },
  { day: "Fri", value: 86 },
];

export const departmentHeadcount = [
  { label: "Software Engineers", value: 38, color: "#ff5a1f" },
  { label: "Facilities", value: 18, color: "#7c2d12" },
  { label: "Hardware", value: 16, color: "#fdba74" },
  { label: "Media/Photography", value: 14, color: "#c2410c" },
  { label: "Admin", value: 14, color: "#fed7aa" },
];

export const quickExports = [
  "Full headcount roster",
  "This month's attendance",
  "Leave balances snapshot",
  "Payroll summary",
];
