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
        const href = tabHref ? portalHref(pathname, tabHref) : undefined;
        const active = href
          ? pathname === href || pathname.endsWith(tabHref)
          : false;

        if (href) {
          return (
            <Link
              key={tab}
              href={href}
              className={`${styles.moduleTab} ${active ? styles.moduleTabActive : ""}`}
            >
              {tab}
            </Link>
          );
        }

        return (
          <span key={tab} className={`${styles.moduleTab} ${styles.moduleTabDisabled}`}>
            {tab}
          </span>
        );
      })}
    </div>
  );
}
