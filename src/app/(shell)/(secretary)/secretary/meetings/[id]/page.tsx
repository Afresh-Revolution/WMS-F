import { redirect } from "next/navigation";
import { SecretaryMeetingOpenPage } from "@/components/secretary/SecretaryMeetingOpenPage";

const filterRoutes: Record<string, string> = {
  today: "/secretary/meetings/today",
  admin: "/secretary/meetings/admin",
  hods: "/secretary/meetings/hods",
  all: "/secretary/meetings/all",
};

export default async function SecretaryMeetingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const filterHref = filterRoutes[id];
  if (filterHref) redirect(filterHref);
  return <SecretaryMeetingOpenPage id={id} />;
}
