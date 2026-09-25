export type EmployeeStatCard = {
  value: string;
  label: string;
  hint: string;
};

export const employeeStatCards: Array<Omit<EmployeeStatCard, "value">> = [
  { label: "leave days remaining", hint: "Current balance" },
  { label: "assigned tasks", hint: "Currently open" },
  { label: "overdue tasks", hint: "Needs attention" },
  { label: "upcoming meetings", hint: "Next 7 days" },
  { label: "expenses in progress", hint: "Awaiting attention" },
  { label: "open reimbursements", hint: "Being processed" },
];

export type EmployeeTaskStatus =
  | "Not Started"
  | "In Progress"
  | "In Review"
  | "Overdue"
  | "Completed";

export type EmployeeTask = {
  id: string;
  title: string;
  priority: string;
  status: EmployeeTaskStatus;
  description: string;
  assignedBy: string;
  due: string;
  timing: string;
  progress: number;
};

export type EmployeeMeeting = {
  id: string;
  title: string;
  date: string;
  duration: string;
  location: string;
  organiser: string;
  due: string;
};

export type EmployeeExpenseStatus =
  | "Submitted"
  | "Approved"
  | "Reimbursed"
  | "Rejected";

export type EmployeeExpense = {
  id: string;
  title: string;
  status: EmployeeExpenseStatus;
  category: string;
  date: string;
  receipt: boolean;
  amount: string;
};

export type EmployeeReimbursementStatus = "Pending" | "Paid" | "Returned";

export type EmployeeReimbursement = {
  id: string;
  title: string;
  status: EmployeeReimbursementStatus;
  category: string;
  date: string;
  amount: string;
};

export type EmployeeRecordCategory =
  | "Documents"
  | "Promotions"
  | "Salary Increments"
  | "Disciplinary";

export type EmployeeRecordItem = {
  id: string;
  title: string;
  category: EmployeeRecordCategory;
  kind: string;
  date: string;
  fileUrl: string;
  status: "Available" | "Pending";
};
