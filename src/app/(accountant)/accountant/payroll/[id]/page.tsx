import { AccountantPayrollDetailPage } from "@/components/accountant/AccountantPayrollDetailPage";

type AccountantPayrollDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountantPayrollDetailRoute({
  params,
}: AccountantPayrollDetailRouteProps) {
  const { id } = await params;
  return <AccountantPayrollDetailPage periodId={id} />;
}
