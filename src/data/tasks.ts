export type TaskFilter = "All" | "In Progress" | "Overdue" | "Completed";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskStatus =
  | "In Progress"
  | "Not Started"
  | "Overdue"
  | "Completed";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  dueDate: string;
  department: string;
};

export const taskStats = [
  { id: "total", label: "Total tasks", value: "6", badge: "Active" },
  { id: "pending", label: "Pending", value: "1", badge: "Urgent" },
  { id: "in-progress", label: "In progress", value: "3", badge: "Active" },
  { id: "completed", label: "Completed", value: "1", badge: "Done" },
] as const;

export const taskFilters: TaskFilter[] = [
  "All",
  "In Progress",
  "Overdue",
  "Completed",
];

export const tasks: Task[] = [
  {
    id: "1",
    title: "Redesign onboarding flow",
    description: "Refresh the new-hire journey with clearer steps and updated branding.",
    priority: "High",
    status: "In Progress",
    assignee: "Maya Chen",
    assigneeInitials: "MC",
    assigneeColor: "#fde68a",
    dueDate: "Jan 10",
    department: "Design/Photography",
  },
  {
    id: "2",
    title: "Update employee handbook",
    description: "Incorporate remote-work policy changes and refresh the benefits section.",
    priority: "High",
    status: "In Progress",
    assignee: "Maya Chen",
    assigneeInitials: "MC",
    assigneeColor: "#fde68a",
    dueDate: "Jan 20",
    department: "HR",
  },
  {
    id: "3",
    title: "Q3 fashion campaign assets",
    description: "Coordinate lookbook photography and social cutdowns for the fall launch.",
    priority: "Medium",
    status: "Not Started",
    assignee: "Nina Patel",
    assigneeInitials: "NP",
    assigneeColor: "#fecdd3",
    dueDate: "Aug 21",
    department: "Marketing/Production",
  },
  {
    id: "4",
    title: "Submit July timesheet",
    description: "Complete and submit timesheet entries before payroll cutoff.",
    priority: "High",
    status: "Overdue",
    assignee: "Maya Chen",
    assigneeInitials: "MC",
    assigneeColor: "#fde68a",
    dueDate: "Jul 31",
    department: "HR",
  },
  {
    id: "5",
    title: "New hire training completion",
    description: "Finish compliance modules and schedule the team orientation session.",
    priority: "Medium",
    status: "In Progress",
    assignee: "Ravi Kapoor",
    assigneeInitials: "RK",
    assigneeColor: "#fed7aa",
    dueDate: "Aug 10",
    department: "Software Engineering",
  },
  {
    id: "6",
    title: "Q2 vendor review summary",
    description: "Compile spend analysis and renewal recommendations for finance review.",
    priority: "Low",
    status: "Not Started",
    assignee: "Theo Grant",
    assigneeInitials: "TG",
    assigneeColor: "#ddd6fe",
    dueDate: "Jul 30",
    department: "Finance",
  },
  {
    id: "7",
    title: "Review updated leave policy",
    description: "Sign off on revised parental leave guidelines before company-wide rollout.",
    priority: "Medium",
    status: "Completed",
    assignee: "Maya Chen",
    assigneeInitials: "MC",
    assigneeColor: "#fde68a",
    dueDate: "Jan 10",
    department: "HR",
  },
];
