import { AccountantShell } from "@/components/accountant/AccountantShell";

export default function AccountantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AccountantShell>{children}</AccountantShell>;
}
