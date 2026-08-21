export const reportKpis = [
  {
    id: "headcount",
    label: "Total Headcount",
    value: "1,248",
    badge: "+0.8%",
    tone: "up" as const,
  },
  {
    id: "attendance",
    label: "Avg Attendance",
    value: "89.4%",
    badge: "This week",
    tone: "meta" as const,
  },
  {
    id: "attrition",
    label: "Attrition Rate",
    value: "4.2%",
    badge: "-0.3%",
    tone: "down" as const,
  },
  {
    id: "accuracy",
    label: "Report Accuracy",
    value: "94%",
    badge: "Healthy",
    tone: "good" as const,
  },
];

export const headcountGrowth = [
  { month: "Feb", value: 1120 },
  { month: "Mar", value: 1155 },
  { month: "Apr", value: 1185 },
  { month: "May", value: 1215 },
  { month: "Jun", value: 1255 },
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
  { label: "Software Engineers", value: 38, color: "#ed5a28" },
  { label: "Fashion", value: 22, color: "#c2410c" },
  { label: "Hardware", value: 18, color: "#fdba74" },
  { label: "Media/Photography", value: 16, color: "#9a3412" },
  { label: "Model", value: 12, color: "#fed7aa" },
];

export const quickExports = [
  "Full headcount roster",
  "This month's attendance",
  "Leave balances snapshot",
  "Payroll summary",
];
