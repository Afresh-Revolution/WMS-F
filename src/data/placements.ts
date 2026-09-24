export type PlacementFilter = "Active" | "Exiting soon" | "Exited" | "All";
export type PlacementType = "NYSC" | "Intern";

export type PlacementMember = {
  id: string;
  initials: string;
  name: string;
  type: PlacementType;
  school: string;
  institution: string;
  course: string;
  department: string;
  supervisor: string;
  startDate: string;
  endDate: string;
  email: string;
  phone: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  progress: number;
  status: "Active" | "Exiting soon" | "Exited";
};

export const placementStats = [
  { id: "active", label: "Active Members", value: "4", badge: "Current" },
  { id: "exiting", label: "Exiting in 60 Days", value: "0", badge: "Alert" },
  { id: "nysc", label: "NYSC Members", value: "2", badge: "Active" },
  { id: "interns", label: "Interns", value: "2", badge: "Active" },
];

export const placementMembers: PlacementMember[] = [
  {
    id: "1",
    initials: "CE",
    name: "Chidi Eze",
    type: "NYSC",
    school: "Covenant University · Software Engineering",
    institution: "Covenant University",
    course: "Software Engineering",
    department: "Software Engineers",
    supervisor: "Omar Reyes",
    startDate: "Oct 1, 2025",
    endDate: "Sep 30, 2026",
    email: "",
    phone: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    progress: 82,
    status: "Active",
  },
  {
    id: "2",
    initials: "FL",
    name: "Funmi Lawal",
    type: "NYSC",
    school: "OAU Ife · Business Administration",
    institution: "OAU Ife",
    course: "Business Administration",
    department: "HR",
    supervisor: "Maya Chen",
    startDate: "Oct 1, 2025",
    endDate: "Sep 28, 2026",
    email: "",
    phone: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    progress: 91,
    status: "Active",
  },
  {
    id: "3",
    initials: "SA",
    name: "Seun Adeyemi",
    type: "Intern",
    school: "UniLag · Computer Science",
    institution: "UniLag",
    course: "Computer Science",
    department: "Software Engineers",
    supervisor: "Omar Reyes",
    startDate: "Mar 20, 2026",
    endDate: "Sep 30, 2026",
    email: "",
    phone: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    progress: 55,
    status: "Active",
  },
  {
    id: "4",
    initials: "KO",
    name: "Kemi Obi",
    type: "Intern",
    school: "Babcock University · Mass Communication",
    institution: "Babcock University",
    course: "Mass Communication",
    department: "Media/Photography",
    supervisor: "Nina Patel",
    startDate: "Apr 14, 2026",
    endDate: "Oct 14, 2026",
    email: "",
    phone: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    progress: 12,
    status: "Active",
  },
  {
    id: "5",
    initials: "TB",
    name: "Tolu Benson",
    type: "NYSC",
    school: "University of Ibadan · Accounting",
    institution: "University of Ibadan",
    course: "Accounting",
    department: "Admin",
    supervisor: "Ken Salami",
    startDate: "Oct 1, 2024",
    endDate: "Sep 30, 2025",
    email: "",
    phone: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    progress: 85,
    status: "Exited",
  },
];

export function getPlacementMember(id: string) {
  return placementMembers.find((member) => member.id === id);
}
