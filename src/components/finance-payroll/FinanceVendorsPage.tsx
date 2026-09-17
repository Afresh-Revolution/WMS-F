"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  matchesVendorFilter,
  type Vendor,
  type VendorFilter,
} from "@/data/financeVendors";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { listFrom, mapVendor } from "@/lib/api/mappers";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinanceVendorsPage.module.css";

const vendorFilters: VendorFilter[] = ["Active", "All"];

const createFields = [
  { name: "name", label: "Vendor name", required: true },
  { name: "category", label: "Category", required: true },
  { name: "location", label: "Location", required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
];

export function FinanceVendorsPage() {
  const [activeFilter, setActiveFilter] = useState<VendorFilter>("Active");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { runAction, exportRows } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => superAdminApi.vendors.list(),
    [],
  );

  const vendors = useMemo(() => {
    return listFrom(data ?? undefined).map((record) => mapVendor(record));
  }, [data]);

  const vendorStats = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.active).length;
    const openBills = vendors.reduce((sum, vendor) => sum + vendor.openBills, 0);
    return [
      { id: "total", label: "Total vendors", value: String(vendors.length) },
      { id: "active", label: "Active vendors", value: String(active) },
      { id: "open-bills", label: "Open bills", value: String(openBills) },
      { id: "inactive", label: "Inactive", value: String(vendors.length - active) },
    ];
  }, [vendors]);

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
  }, [activeFilter, query, vendors]);

  async function handleCreate(values: Record<string, string>) {
    await runAction("Add vendor", async () => {
      await superAdminApi.vendors.create({ ...values, active: true });
      refetch();
    });
  }

  async function viewVendor(vendor: Vendor) {
    await runAction(`Vendor — ${vendor.name}`, async () => {
      await superAdminApi.vendors.get(vendor.id);
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  function handleExport() {
    exportRows(
      filteredVendors.map((vendor) => ({
        name: vendor.name,
        category: vendor.category,
        location: vendor.location,
        email: vendor.email,
        ytdSpend: vendor.ytdSpend,
        openBills: vendor.openBills,
        active: vendor.active,
      })),
      "vendors.csv",
    );
  }

  return (
    <>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />
        {loading ? <p>Loading vendors…</p> : null}
        {error ? <p role="alert">{error}</p> : null}

        <div className={payrollStyles.topBar}>
          <p className={payrollStyles.dateLabel}>Tuesday, July 28</p>
          <div className={payrollStyles.topActions}>
            <NotificationsLink className={payrollStyles.iconButton} />
            <button
              type="button"
              aria-label="Refresh"
              className={payrollStyles.iconButton}
              onClick={handleRefresh}
            >
              <RefreshCw size={16} />
            </button>
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
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
          <div className={payrollStyles.headerActions}>
            <button type="button" className={payrollStyles.exportButton} onClick={handleExport}>
              Export
            </button>
            <button type="button" className={styles.addButton} onClick={() => setCreateOpen(true)}>
              <Plus size={16} strokeWidth={2.5} />
              Add vendor
            </button>
          </div>
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
              data-vendor-search
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

                <button
                  type="button"
                  className={styles.detailsButton}
                  onClick={() => void viewVendor(vendor)}
                >
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

      <SimpleModal
        open={createOpen}
        title="Add vendor"
        description="Create a supplier record for bills and purchases."
        fields={createFields}
        submitLabel="Add vendor"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
