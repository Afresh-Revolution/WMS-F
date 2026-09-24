export type DisciplineFilter = "Active" | "Closed" | "All";

export type DisciplineTagTone =
  | "warning"
  | "unacknowledged"
  | "active"
  | "closed"
  | "acknowledged"
  | "strike";

export type DisciplineCase = {
  id: string;
  ref: string;
  employeeId?: string;
  initials: string;
  name: string;
  role: string;
  date: string;
  issuedBy: string;
  description: string;
  status: "Active" | "Closed";
  acknowledged?: boolean;
  tags: { label: string; tone: DisciplineTagTone }[];
};

export const disciplineStats = [
  { id: "open", label: "Open Cases", value: "2" },
  { id: "pending", label: "Pending Acknowledgement", value: "1" },
  { id: "closed", label: "Closed This Year", value: "1" },
];

export const disciplineCases: DisciplineCase[] = [
  {
    id: "1",
    ref: "DC-0218",
    initials: "TG",
    name: "Theo Grant",
    role: "Fashion",
    date: "Jul 24, 2026",
    issuedBy: "Maya Chen (HR)",
    description:
      "Persistent failure to submit weekly activity reports on time. Third occurrence in Q2.",
    status: "Active",
    tags: [
      { label: "Warning", tone: "warning" },
      { label: "Unacknowledged", tone: "unacknowledged" },
      { label: "Active", tone: "active" },
    ],
  },
  {
    id: "2",
    ref: "DC-0019",
    initials: "BA",
    name: "Bolu Adeyemi",
    role: "Software Engineer",
    date: "Jul 15, 2026",
    issuedBy: "Maya Chen (HR)",
    description:
      "Unauthorised sharing of internal source code with an external party.",
    status: "Active",
    tags: [
      { label: "Strike", tone: "strike" },
      { label: "Active", tone: "active" },
    ],
  },
  {
    id: "3",
    ref: "DC-0014",
    initials: "DM",
    name: "Daniel Musa",
    role: "Media/Photography",
    date: "Jun 20, 2024",
    issuedBy: "Maya Chen (HR)",
    description: "Repeated violations of remote work attendance policy.",
    status: "Closed",
    tags: [
      { label: "Warning", tone: "warning" },
      { label: "Closed", tone: "closed" },
    ],
  },
];

export function getDisciplineCase(id: string) {
  return disciplineCases.find((item) => item.id === id);
}

export const employeeOptions = [
  "Daniel Musa",
  "Theo Grant",
  "Bolu Adeyemi",
  "Nina Patel",
  "Omar Reyes",
  "Maya Chen",
  "Ravi Kapoor",
];

export const actionTypeOptions = [
  "Warning",
  "Written reprimand",
  "Strike",
  "Suspension",
  "Final warning",
];
