import type { Metadata } from "next";
import { DisciplinePage } from "@/components/discipline/DisciplinePage";

export const metadata: Metadata = {
  title: "AfrESH WMS — Disciplinary Record",
};

export default function DisciplineNewRoute() {
  return <DisciplinePage initialFilter="All" viewRecordId="1" />;
}
