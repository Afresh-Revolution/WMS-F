"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { financeModuleTabs, type FinanceModuleTab } from "@/data/financePayroll";
import { portalHref } from "@/lib/portalPaths";
import styles from "./FinancePayrollPage.module.css";

const moduleRoutes: Partial<Record<FinanceModuleTab, string>> = {
  Payroll: "/finance-payroll",
  Purchases: "/finance-payroll/purchases",
  Bills: "/finance-payroll/bills",
  Expenses: "/finance-payroll/expenses",
  Vendors: "/finance-payroll/vendors",
};

export function FinanceModuleTabs() {
  const pathname = usePathname();

  return (
    <div className={styles.moduleTabs}>
      {financeModuleTabs.map((tab) => {
        const tabHref = moduleRoutes[tab];
        if (!tabHref) {
          return (
            <span key={tab} className={`${styles.moduleTab} ${styles.moduleTabDisabled}`}>
              {tab}
            </span>
          );
        }

        const href = portalHref(pathname, tabHref);
        const active = pathname === href || pathname.endsWith(tabHref);
        return (
          <Link
            key={tab}
            href={href}
            className={`${styles.moduleTab} ${active ? styles.moduleTabActive : ""}`}
          >
            {tab}
          </Link>
        );
      })}
    </div>
  );
}
