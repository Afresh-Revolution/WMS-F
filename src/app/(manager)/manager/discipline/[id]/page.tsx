import { DisciplinePage } from "@/components/discipline/DisciplinePage";

type DisciplineDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerDisciplineDetailRoute({
  params,
}: DisciplineDetailProps) {
  const { id } = await params;
  return <DisciplinePage viewRecordId={id} />;
}
