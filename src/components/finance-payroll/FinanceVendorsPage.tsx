"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useMemo, useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { FinanceModuleTabs } from "@/components/finance-payroll/FinanceModuleTabs";
import { HideOnManager } from "@/components/layout/HideOnManager";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import {
  matchesVendorFilter,
  type Vendor,
  type VendorFilter,
} from "@/data/financeVendors";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { managerApi, superAdminApi } from "@/lib/api";
import { listFrom, mapVendor } from "@/lib/api/mappers";
import payrollStyles from "./FinancePayrollPage.module.css";
import styles from "./FinanceVendorsPage.module.css";

const vendorFilters: VendorFilter[] = ["Active", "All"];

function amountNumber(value: string) {
  return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

function formatCompactNaira(total: number) {
  if (total >= 1_000_000) {
    const millions = total / 1_000_000;
    return `₦ ${millions.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (total >= 1_000) return `₦ ${Math.round(total / 1_000)}K`;
  return `₦ ${Math.round(total).toLocaleString("en-NG")}`;
}

const createFields = [
  {
    name: "name",
    label: "Vendor name",
    required: true,
    fullWidth: true,
  },
  {
    name: "category",
    label: "Category",
    fullWidth: true,
    placeholder: "e.g. IT, Insurance, Utilities",
  },
  {
    name: "email",
    label: "Contact email",
    type: "email" as const,
    fullWidth: true,
  },
  {
    name: "phone",
    label: "Phone",
    fullWidth: true,
  },
];

export function FinanceVendorsPage() {
  const manager = useManagerPortal();
  const [activeFilter, setActiveFilter] = useState<VendorFilter>("Active");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdRecords, setCreatedRecords] = useState<
    Record<string, unknown>[]
  >([]);
  const { runAction } = usePageActions();

  const { data, loading, error, refetch } = useAsyncData(
    () => (manager ? managerApi.listVendors() : superAdminApi.vendors.list()),
    [manager],
  );

  const vendors = useMemo(() => {
    const remote = listFrom(data ?? undefined);
    const seen = new Set<string>();
    const mapped = [...createdRecords, ...remote]
      .filter((record) => {
        const key = String(record.id ?? record.email ?? record.name ?? "");
        if (key && seen.has(key)) return false;
        if (key) seen.add(key);
        return true;
      })
      .map((record) => mapVendor(record));
    return mapped;
  }, [createdRecords, data]);

  const vendorStats = useMemo(() => {
    const openBills = vendors.reduce((sum, vendor) => sum + vendor.openBills, 0);
    const ytdSpend = vendors.reduce(
      (sum, vendor) => sum + amountNumber(vendor.ytdSpend),
      0,
    );
    return [
      { id: "total", label: "Total vendors", value: String(vendors.length) },
      { id: "open-bills", label: "Open bills", value: String(openBills) },
      { id: "ytd-spend", label: "Total YTD spend", value: formatCompactNaira(ytdSpend) },
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
      const name = values.name.trim();
      const category = values.category.trim();
      const email = values.email.trim();
      const phone = values.phone.trim();
      if (!name) {
        throw new Error("Enter a vendor name.");
      }
      const body = {
        name,
        vendorName: name,
        category,
        email,
        phone,
        phoneNumber: phone,
        status: "active",
      };
      const created = await (manager
        ? managerApi.createVendor(body)
        : superAdminApi.vendors.create({ ...body, active: true }));
      if (created && typeof created === "object") {
        setCreatedRecords((current) => [
          created as Record<string, unknown>,
          ...current,
        ]);
      }
      refetch();
    });
  }

  async function viewVendor(vendor: Vendor) {
    await runAction(`Vendor — ${vendor.name}`, async () => {
      await (manager
        ? managerApi.getVendor(vendor.id)
        : superAdminApi.vendors.get(vendor.id));
    });
  }

  function handleRefresh() {
    void runAction("Refresh", async () => {
      refetch();
    });
  }

  return (
    <>
      <div className={payrollStyles.page}>
        <FinanceModuleTabs />
        {loading ? <p>Loading vendors…</p> : null}
        {error ? <p role="alert">{error}</p> : null}

        <HideOnManager>
        <div className={payrollStyles.topBar}>
          <PageDateLabel className={payrollStyles.dateLabel} />
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
        </HideOnManager>

        <div className={payrollStyles.header}>
          <div>
            <p className={payrollStyles.eyebrow}>Vendor management</p>
            <h1 className={payrollStyles.title}>Every supplier, in one place</h1>
            <p className={payrollStyles.subtitle}>
              Manage vendor records, track spending history, and monitor outstanding
              bills by vendor.
            </p>
          </div>
          <button type="button" className={styles.addButton} onClick={() => setCreateOpen(true)}>
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
        fields={createFields}
        submitLabel="Add vendor"
        showClose
        appearance="soft"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
