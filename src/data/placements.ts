export type PlacementFilter = "Active" | "Exiting soon" | "Exited" | "All";
export type PlacementType = "NYSC" | "Intern";

export type PlacementMember = {
  id: string;
  initials: string;
  name: string;
  type: PlacementType;
  school: string;
  department: string;
  supervisor: string;
  endDate: string;
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
    school: "Covenant University | Software Engineering",
    department: "Software Engineers",
    supervisor: "Omar Ross",
    endDate: "Sep 30, 2025",
    progress: 82,
    status: "Active",
  },
  {
    id: "2",
    initials: "FL",
    name: "Funmi Lawal",
    type: "NYSC",
    school: "OAU Ife | Public Administration",
    department: "HR",
    supervisor: "Maya Chen",
    endDate: "Sep 20, 2024",
    progress: 92,
    status: "Active",
  },
  {
    id: "3",
    initials: "SA",
    name: "Seun Adeyemi",
    type: "Intern",
    school: "Unilag | Computer Science",
    department: "Software Engineers",
    supervisor: "Omar Ross",
    endDate: "Sep 20, 2025",
    progress: 22,
    status: "Active",
  },
  {
    id: "4",
    initials: "KO",
    name: "Kemi Obi",
    type: "Intern",
    school: "Babcock University | Mass Communication",
    department: "Media/Photography",
    supervisor: "Musi Paul",
    endDate: "Oct 14, 2024",
    progress: 22,
    status: "Active",
  },
  {
    id: "5",
    initials: "TB",
    name: "Tolu Benson",
    type: "NYSC",
    school: "University of Ibadan | Accounting",
    department: "Admin",
    supervisor: "Ken Salami",
    endDate: "Sep 30, 2025",
    progress: 85,
    status: "Exited",
  },
];
