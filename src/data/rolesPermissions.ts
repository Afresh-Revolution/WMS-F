export type PermissionRole =
  | "Super Admin"
  | "Admin"
  | "HR"
  | "Accountant"
  | "Secretary"
  | "HOD"
  | "Employee"
  | "NYSC / Intern";

export type PermissionKey =
  | "approveRequests"
  | "managePayroll"
  | "manageStaff"
  | "configureSystem"
  | "manageUsers"
  | "viewReports";

export type PermissionRow = {
  key: PermissionKey;
  label: string;
  grants: Record<PermissionRole, boolean>;
};

export const permissionRoles: PermissionRole[] = [
  "Super Admin",
  "Admin",
  "HR",
  "Accountant",
  "Secretary",
  "HOD",
  "Employee",
  "NYSC / Intern",
];

export const permissionMatrix: PermissionRow[] = [
  {
    key: "approveRequests",
    label: "Approve requests",
    grants: {
      "Super Admin": true,
      Admin: true,
      HR: true,
      Accountant: true,
      Secretary: false,
      HOD: true,
      Employee: false,
      "NYSC / Intern": false,
    },
  },
  {
    key: "managePayroll",
    label: "Manage payroll",
    grants: {
      "Super Admin": true,
      Admin: true,
      HR: false,
      Accountant: true,
      Secretary: false,
      HOD: false,
      Employee: false,
      "NYSC / Intern": false,
    },
  },
  {
    key: "manageStaff",
    label: "Manage staff records",
    grants: {
      "Super Admin": true,
      Admin: true,
      HR: true,
      Accountant: false,
      Secretary: false,
      HOD: false,
      Employee: false,
      "NYSC / Intern": false,
    },
  },
  {
    key: "configureSystem",
    label: "Configure system",
    grants: {
      "Super Admin": true,
      Admin: false,
      HR: false,
      Accountant: false,
      Secretary: false,
      HOD: false,
      Employee: false,
      "NYSC / Intern": false,
    },
  },
  {
    key: "manageUsers",
    label: "Manage users",
    grants: {
      "Super Admin": true,
      Admin: false,
      HR: false,
      Accountant: false,
      Secretary: false,
      HOD: false,
      Employee: false,
      "NYSC / Intern": false,
    },
  },
  {
    key: "viewReports",
    label: "View reports",
    grants: {
      "Super Admin": true,
      Admin: true,
      HR: true,
      Accountant: true,
      Secretary: false,
      HOD: true,
      Employee: false,
      "NYSC / Intern": false,
    },
  },
];
