import { SecretaryEmailRequestOpenPage } from "@/components/secretary/SecretaryEmailRequestOpenPage";

type EmailRequestOpenProps = {
  params: Promise<{ id: string }>;
};

export default async function SecretaryEmailRequestOpenRoute({
  params,
}: EmailRequestOpenProps) {
  const { id } = await params;
  return <SecretaryEmailRequestOpenPage requestId={id} />;
}
