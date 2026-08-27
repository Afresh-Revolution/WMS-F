import { Sidebar, type SidebarUser, type SidebarVariant } from "./Sidebar";
import styles from "./AppShell.module.css";

export type AppShellVariant = SidebarVariant;
export type AppShellUser = SidebarUser;

export function AppShell({
  children,
  variant = "manager",
  user,
}: {
  children: React.ReactNode;
  variant?: AppShellVariant;
  user?: AppShellUser;
}) {
  return (
    <div className={styles.shell}>
      <Sidebar variant={variant} user={user} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
