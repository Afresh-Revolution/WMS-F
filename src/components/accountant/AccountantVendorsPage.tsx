"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Landmark,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { AccountantStatusLine } from "@/components/accountant/AccountantStatusLine";
import {
  AddVendorModal,
  type AddVendorValues,
} from "@/components/accountant/AddVendorModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { accountantApi } from "@/lib/api";
import {
  mapAccountantVendor,
  unwrapAccountantList,
  withFallback,
} from "@/lib/api/accountantMappers";
import {
  accountantVendorFilters,
  accountantVendors as fallbackVendors,
  type AccountantVendor,
  type AccountantVendorCategory,
  type AccountantVendorFilter,
} from "@/data/accountantVendors";
import styles from "./AccountantVendorsPage.module.css";

export function AccountantVendorsPage() {
  const [filter, setFilter] = useState<AccountantVendorFilter>("Active");
  const [query, setQuery] = useState("");
  const [localVendors, setLocalVendors] = useState<AccountantVendor[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(
    () => accountantApi.vendors.list(),
    [],
  );

  const vendors = useMemo(() => {
    const mapped = withFallback(
      unwrapAccountantList(data).map(mapAccountantVendor),
      fallbackVendors,
    );
    const merged = [...localVendors, ...mapped];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data, localVendors]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return vendors.filter((vendor) => {
      if (filter !== "All" && vendor.status !== filter) return false;
      if (!term) return true;
      return (
        `${vendor.name} ${vendor.category} ${vendor.contactName} ${vendor.email}`
          .toLowerCase()
          .includes(term)
      );
    });
  }, [filter, query, vendors]);

  async function handleAdd(values: AddVendorValues) {
    if (!values.name) {
      throw new Error("Vendor name is required");
    }

    await runAction(
      "Add vendor",
      async () => {
        const next: AccountantVendor = {
          id: `vendor-${Date.now()}`,
          name: values.name,
          category: values.category as AccountantVendorCategory,
          status: "Active",
          contactName: values.contactName || "—",
          email: values.email || "—",
          phone: values.phone || "—",
          bankDetails: values.bankDetails || "—",
          totalPaid: "₦ 0",
          totalPaidValue: 0,
          openBills: 0,
        };
        setLocalVendors((current) => [next, ...current]);
        refetch();
      },
      `${values.name} added to vendor directory`,
    );
  }

  async function handleToggleStatus(vendor: AccountantVendor) {
    const nextStatus = vendor.status === "Active" ? "Inactive" : "Active";
    await runAction(
      nextStatus === "Active" ? "Activate vendor" : "Deactivate vendor",
      async () => {
        setLocalVendors((current) =>
          current.map((item) =>
            item.id === vendor.id ? { ...item, status: nextStatus } : item,
          ),
        );
      },
      `${vendor.name} marked ${nextStatus.toLowerCase()}`,
    );
  }

  return (
    <div className={styles.page}>
      <AccountantStatusLine loading={loading} error={error} resource="vendors" />
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Tuesday, August 11</p>
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
            />
            <kbd className={styles.searchKbd}>⌘ K</kbd>
          </label>
          <Link
            href="/accountant/notifications"
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <span className={styles.notifDot} aria-hidden />
            <Bell size={16} />
          </Link>
          <Link
            href="/accountant/profile"
            className={styles.avatarChip}
            aria-label="Profile"
          >
            RK
          </Link>
        </div>
      </div>

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Accountant · Vendors</p>
          <h1 className={styles.title}>Vendor directory</h1>
          <p className={styles.subtitle}>
            Manage the vendors and payees the company transacts with.
          </p>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={() => setAddOpen(true)}
        >
          <Plus size={16} />
          Add vendor
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.vendorSearch}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vendors..."
            aria-label="Search vendors"
          />
        </label>
        <div className={styles.tabs} role="tablist" aria-label="Vendor status">
          {accountantVendorFilters.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={`${styles.tab} ${filter === item ? styles.tabActive : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No vendors match this filter.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((vendor) => (
            <article key={vendor.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.vendorIcon} aria-hidden>
                  <Building2 size={18} />
                </span>
                <div className={styles.cardTitleWrap}>
                  <div className={styles.nameRow}>
                    <h2 className={styles.vendorName}>{vendor.name}</h2>
                    <span
                      className={`${styles.status} ${
                        vendor.status === "Active"
                          ? styles.statusActive
                          : styles.statusInactive
                      }`}
                    >
                      {vendor.status}
                    </span>
                  </div>
                  <p className={styles.category}>{vendor.category}</p>
                </div>
              </div>

              <ul className={styles.details}>
                <li>
                  <UserRound size={14} />
                  <span>{vendor.contactName}</span>
                </li>
                <li>
                  <Mail size={14} />
                  <span>{vendor.email}</span>
                </li>
                <li>
                  <Phone size={14} />
                  <span>{vendor.phone}</span>
                </li>
                <li>
                  <Landmark size={14} />
                  <span>{vendor.bankDetails}</span>
                </li>
              </ul>

              <div className={styles.financeRow}>
                <div>
                  <p className={styles.financeLabel}>Total paid</p>
                  <p className={styles.financeValue}>{vendor.totalPaid}</p>
                </div>
                {vendor.openBills > 0 ? (
                  <span className={styles.openBill}>
                    {vendor.openBills} open bill
                    {vendor.openBills === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => void handleToggleStatus(vendor)}
              >
                {vendor.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </article>
          ))}
        </div>
      )}

      <AddVendorModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  );
}
