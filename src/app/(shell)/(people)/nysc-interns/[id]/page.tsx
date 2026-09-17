import { redirect } from "next/navigation";
import { PlacementProfilePage } from "@/components/placements/PlacementProfilePage";

const filterRoutes: Record<string, string> = {
  all: "/nysc-interns/all",
  exiting: "/nysc-interns/exiting",
  exited: "/nysc-interns/exited",
};

export default async function NyscInternProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const filterHref = filterRoutes[id];
  if (filterHref) redirect(filterHref);
  return <PlacementProfilePage id={id} />;
}
