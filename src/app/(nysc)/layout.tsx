import { NyscShell } from "@/components/nysc/NyscShell";

export default function NyscLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <NyscShell>{children}</NyscShell>;
}
