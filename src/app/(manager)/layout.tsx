import { ManagerShell } from "@/components/manager/ManagerShell";

export default function ManagerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ManagerShell>{children}</ManagerShell>;
}
