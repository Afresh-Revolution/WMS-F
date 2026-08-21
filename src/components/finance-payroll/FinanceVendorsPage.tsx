"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import {
  matchesVendorFilter,
  vendorStats,
  vendors,
  type VendorFilter,
} from "@/data/financeVendors";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinanceVendorsPage.module.css";

const vendorFilters: VendorFilter[] = ["Active", "All"];

export function FinanceVendorsPage() {
  const [activeFilter, setActiveFilter] = useState<VendorFilter>("Active");
  const [query, setQuery] = useState("");

  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return vendors.filter((vendor) => {
      if (!matchesVendorFilter(vendor, activeFilter)) return false;
      if (!normalizedQuery) return true;

      return (
        vendor.name.toLowerCase().includes(normalizedQuery) ||
        vendor.category.toLowerCase().includes(normalizedQuery) ||
        vendor.location.toLowerCase().includes(normalizedQuery) ||
        vendor.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeFilter, query]);

  return (
    <AppShell>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />

        <div className={payrollStyles.topBar}>
          <p className={payrollStyles.dateLabel}>Tuesday, July 28</p>
          <div className={payrollStyles.topActions}>
            <button type="button" aria-label="Search" className={payrollStyles.iconButton}>
              <Search size={16} />
            </button>
            <button type="button" aria-label="Notifications" className={payrollStyles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.avatarChip}>
              MC
            </button>
          </div>
        </div>

        <div className={payrollStyles.header}>
          <div>
            <p className={payrollStyles.eyebrow}>Vendor management</p>
            <h1 className={payrollStyles.title}>Every supplier, in one place</h1>
            <p className={payrollStyles.subtitle}>
              Manage vendor records, track spending history, and monitor outstanding
              bills by vendor.
            </p>
          </div>
          <button type="button" className={styles.addButton}>
            <Plus size={16} strokeWidth={2.5} />
            Add vendor
          </button>
        </div>

        <div className={styles.stats}>
          {vendorStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
          ))}
        </div>

        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vendors..."
              className={styles.searchInput}
            />
          </label>

          <div className={styles.filterToggle}>
            {vendorFilters.map((filter) => {
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`${styles.filterButton} ${
                    active ? styles.filterButtonActive : ""
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {filteredVendors.length > 0 ? (
          <div className={styles.grid}>
            {filteredVendors.map((vendor) => (
              <article key={vendor.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.vendorIcon}>
                    <Building2 size={18} strokeWidth={1.75} />
                  </span>
                  {vendor.active && <span className={styles.activeBadge}>Active</span>}
                </div>

                <h2 className={styles.vendorName}>{vendor.name}</h2>
                <p className={styles.vendorCategory}>{vendor.category}</p>

                <div className={styles.metaList}>
                  <p className={styles.metaItem}>
                    <MapPin size={14} strokeWidth={1.75} />
                    {vendor.location}
                  </p>
                  <p className={styles.metaItem}>
                    <Mail size={14} strokeWidth={1.75} />
                    {vendor.email}
                  </p>
                </div>

                <div className={styles.cardFooter}>
                  <p className={styles.ytdSpend}>YTD: {vendor.ytdSpend}</p>
                  {vendor.openBills > 0 && (
                    <span className={styles.openBillBadge}>
                      {vendor.openBills} open bill{vendor.openBills > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <button type="button" className={styles.detailsButton}>
                  View details
                  <ChevronRight size={15} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>No vendors match your search.</div>
        )}
      </div>
    </AppShell>
  );
}
