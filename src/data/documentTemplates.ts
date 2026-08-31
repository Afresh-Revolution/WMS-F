export type DocumentTemplateStatus = "Active" | "Inactive";

export type DocumentTemplate = {
  id: string;
  name: string;
  status: DocumentTemplateStatus;
  updatedAt: string;
};

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "payslip",
    name: "Payslip",
    status: "Active",
    updatedAt: "Jul 22, 2026",
  },
  {
    id: "offer-letter",
    name: "Offer letter",
    status: "Active",
    updatedAt: "Jul 4, 2026",
  },
  {
    id: "leave-approval",
    name: "Leave approval notice",
    status: "Active",
    updatedAt: "Jul 26, 2026",
  },
  {
    id: "exit-clearance",
    name: "Exit / clearance form",
    status: "Inactive",
    updatedAt: "Jun 19, 2026",
  },
];
