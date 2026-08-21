export type LeaveTab = "Requests" | "My leave" | "Team calendar";

export type LeaveRequestStatus = "Pending" | "Approved" | "Declined";

export type LeaveBalance = {
  id: string;
  label: string;
  remaining: number;
  used: number;
  total: number;
  icon: "annual" | "sick" | "parental" | "personal";
};

export type LeaveRequest = {
  id: string;
  initials: string;
  name: string;
  avatarColor: string;
  type: string;
  dateRange: string;
  days: number;
  status: LeaveRequestStatus;
};

export const leaveTabs: LeaveTab[] = ["Requests", "My leave", "Team calendar"];

export const leaveBalances: LeaveBalance[] = [
  {
    id: "annual",
    label: "Annual leave",
    remaining: 18,
    used: 12,
    total: 30,
    icon: "annual",
  },
  {
    id: "sick",
    label: "Sick leave",
    remaining: 7,
    used: 3,
    total: 10,
    icon: "sick",
  },
  {
    id: "parental",
    label: "Parental",
    remaining: 30,
    used: 0,
    total: 30,
    icon: "parental",
  },
  {
    id: "personal",
    label: "Personal",
    remaining: 3,
    used: 2,
    total: 5,
    icon: "personal",
  },
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: "1",
    initials: "NP",
    name: "Nina Patel",
    avatarColor: "#fde68a",
    type: "Annual leave",
    dateRange: "Aug 4 - Aug 8",
    days: 5,
    status: "Pending",
  },
  {
    id: "2",
    initials: "OR",
    name: "Omar Reyes",
    avatarColor: "#bfdbfe",
    type: "Annual leave",
    dateRange: "Aug 12 - Aug 14",
    days: 3,
    status: "Pending",
  },
  {
    id: "3",
    initials: "LF",
    name: "Lena Fisher",
    avatarColor: "#fecdd3",
    type: "Sick leave",
    dateRange: "Jul 28 - Jul 29",
    days: 2,
    status: "Approved",
  },
  {
    id: "4",
    initials: "TG",
    name: "Theo Grant",
    avatarColor: "#ddd6fe",
    type: "Personal",
    dateRange: "Jul 15 - Jul 16",
    days: 2,
    status: "Declined",
  },
];
