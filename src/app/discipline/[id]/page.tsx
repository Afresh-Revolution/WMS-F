import { notFound } from "next/navigation";
import { DisciplinePage } from "@/components/discipline/DisciplinePage";
import { getDisciplineCase } from "@/data/discipline";

type DisciplineDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function DisciplineDetailRoute({
  params,
}: DisciplineDetailProps) {
  const { id } = await params;
  const record = getDisciplineCase(id);

  if (!record) notFound();

  return (
    <DisciplinePage
      initialFilter={record.status === "Closed" ? "Closed" : "Active"}
      viewRecordId={id}
    />
  );
}
