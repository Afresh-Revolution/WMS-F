"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  superAdminApi,
  systemManagementApi,
  unwrapRecord,
} from "@/lib/api";
import { bool, listFrom, mapAccessUser, str } from "@/lib/api/mappers";
import {
  ArrowRight,
  Bell,
  KeyRound,
  Mail,
  Plug,
  Search,
  Shield,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import styles from "./SystemManagementPage.module.css";

async function settled<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

function countFrom(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
  }
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["total", "count", "value", "size", "length"]) {
      const nested = countFrom(record[key]);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function firstCount(
  record: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    if (record[key] === undefined || record[key] === null) continue;
    const count = countFrom(record[key]);
    if (count !== undefined) return count;
  }
  return undefined;
}

function isMaintenanceOn(
  record: Record<string, unknown>,
): boolean | undefined {
  const keys = [
    "maintenanceMode",
    "maintenance",
    "isMaintenance",
    "maintenanceEnabled",
    "inMaintenance",
  ];
  for (const key of keys) {
    if (record[key] === undefined || record[key] === null) continue;
    const value = record[key];
    if (typeof value === "object") {
      const nested = value as Record<string, unknown>;
      if (nested.enabled !== undefined) return bool(nested.enabled);
      if (nested.active !== undefined) return bool(nested.active);
      if (nested.on !== undefined) return bool(nested.on);
    }
    if (typeof value === "string") {
      const raw = value.toLowerCase();
      if (["on", "enabled", "true", "maintenance", "paused"].includes(raw)) {
        return true;
      }
      if (
        ["off", "disabled", "false", "operational", "live"].includes(raw)
      ) {
        return false;
      }
    }
    return bool(value);
  }

  const status = str(
    record.status ?? record.mode ?? record.health ?? record.state,
  ).toLowerCase();
  if (!status) return undefined;
  if (status.includes("maintenance") || status.includes("paused")) return true;
  if (
    status.includes("operational") ||
    status.includes("live") ||
    status.includes("healthy") ||
    status === "ok"
  ) {
    return false;
  }
  return undefined;
}

const NAV_CARDS = [
  {
    href: "/user-access",
    title: "User Access",
    description: "Provision accounts, manage roles, lock or deactivate users.",
    icon: KeyRound,
  },
  {
    href: "/roles-permissions",
    title: "Roles & Permissions",
    description: "Control what each role can do across the platform.",
    icon: ShieldCheck,
  },
  {
    href: "/security",
    title: "Security",
    description: "Password policy, lockout, sessions, MFA and maintenance mode.",
    icon: Shield,
  },
  {
    href: "/integrations",
    title: "Integrations",
    description: "Connect third-party services and manage API access.",
    icon: Plug,
  },
  {
    href: "/email-configuration",
    title: "Email Configuration",
    description: "Sending identity, SMTP settings and delivery status.",
    icon: Mail,
  },
  {
    href: "/notification-configuration",
    title: "Notification Configuration",
    description: "Channels, digests and quiet hours.",
    icon: Bell,
  },
] as const;

export function SystemManagementPage() {
  const { data, loading, error } = useAsyncData(async () => {
    const [overview, status, health, userStats, saUsers, smUsers] =
      await Promise.all([
        settled(
          superAdminApi.systemManagement
            .overview()
            .catch(() => systemManagementApi.overview()),
        ),
        settled(
          superAdminApi.systemManagement
            .status()
            .catch(() => systemManagementApi.status()),
        ),
        settled(
          superAdminApi.systemManagement
            .health()
            .catch(() => systemManagementApi.health()),
        ),
        settled(superAdminApi.users.statistics()),
        settled(superAdminApi.users.list()),
        settled(systemManagementApi.users.list({ limit: 200 })),
      ]);
    return { overview, status, health, userStats, saUsers, smUsers };
  }, []);

  const stats = useMemo(() => {
    const overview = unwrapRecord(data?.overview);
    const status = unwrapRecord(data?.status);
    const health = unwrapRecord(data?.health);
    const userStats = unwrapRecord(data?.userStats);
    const saUsers = listFrom(data?.saUsers ?? undefined).map(mapAccessUser);
    const smUsers = listFrom(data?.smUsers ?? undefined).map(mapAccessUser);
    const mappedUsers = saUsers.length ? saUsers : smUsers;

    const listAdmins = mappedUsers.filter((user) =>
      user.role.toLowerCase().includes("admin"),
    ).length;
    const listSuper = mappedUsers.filter((user) =>
      user.role.toLowerCase().includes("super"),
    ).length;
    const listLocked = mappedUsers.filter(
      (user) => user.status === "Locked",
    ).length;

    return {
      platformUsers:
        firstCount(overview, [
          "platformUsers",
          "totalUsers",
          "users",
          "userCount",
          "total",
        ]) ??
        firstCount(userStats, [
          "total",
          "totalUsers",
          "users",
          "platformUsers",
        ]) ??
        mappedUsers.length,
      adminAccounts:
        firstCount(overview, [
          "adminAccounts",
          "admins",
          "adminCount",
          "adminUsers",
        ]) ??
        firstCount(userStats, ["admins", "adminUsers", "adminAccounts"]) ??
        listAdmins,
      superAdmins:
        firstCount(overview, ["superAdmins", "superAdminCount"]) ??
        firstCount(userStats, ["superAdmins", "superAdminCount"]) ??
        listSuper,
      lockedAccounts:
        firstCount(overview, [
          "lockedAccounts",
          "lockedUsers",
          "locked",
        ]) ??
        firstCount(userStats, ["locked", "lockedUsers", "lockedAccounts"]) ??
        listLocked,
      maintenance: isMaintenanceOn({ ...health, ...status, ...overview }),
    };
  }, [data]);

  const maintenanceOn = stats.maintenance;
  const maintenanceLabel =
    maintenanceOn === true
      ? "On"
      : maintenanceOn === false
        ? "Operational"
        : loading
          ? "…"
          : "—";
  const maintenanceCaption =
    maintenanceOn === true
      ? "System is paused"
      : maintenanceOn === false
        ? "System is live"
        : loading
          ? "Checking status"
          : "Status unavailable";

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
          <label className={styles.topSearch}>
            <Search size={15} className={styles.topSearchIcon} />
            <input
              placeholder="Search"
              className={styles.topSearchInput}
              readOnly
              aria-label="Search"
            />
            <kbd className={styles.searchShortcut}>⌘K</kbd>
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
        </div>
      </div>

      <div className={styles.header}>
        <p className={styles.eyebrow}>System management</p>
        <h1 className={styles.title}>Platform control centre</h1>
        <p className={styles.subtitle}>
          Super Admin only. Configure the platform, manage access, monitor
          health and control integrations.
        </p>
        {error ? (
          <p className={styles.subtitle} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <aside className={styles.banner} role="note">
        <span className={styles.bannerIcon} aria-hidden>
          <Shield size={16} strokeWidth={2.2} />
        </span>
        <div>
          <p className={styles.bannerTitle}>Super Admin access area</p>
          <p className={styles.bannerCopy}>
            Actions here affect the entire platform. Every change is recorded
            in the technical audit trail. Super Admin is not an ordinary
            approval stage — business requests never route here automatically.
          </p>
        </div>
      </aside>

      <section className={styles.statGrid} aria-label="Platform stats">
        <article className={`${styles.statCard} ${styles.statCardAccent}`}>
          <p className={styles.statLabel}>Platform users</p>
          <div className={styles.statRow}>
            <p className={styles.statValue}>
              {loading ? "…" : String(stats.platformUsers)}
            </p>
            <span className={styles.statMeta}>All roles</span>
          </div>
        </article>

        <article className={styles.statCard}>
          <p className={styles.statLabel}>Admin accounts</p>
          <div className={styles.statRow}>
            <p className={styles.statValue}>
              {loading ? "…" : String(stats.adminAccounts)}
            </p>
            <span className={styles.statMeta}>
              {stats.superAdmins} super
            </span>
          </div>
        </article>

        <article className={styles.statCard}>
          <p className={styles.statLabel}>Locked accounts</p>
          <div className={styles.statRow}>
            <p className={styles.statValue}>
              {loading ? "…" : String(stats.lockedAccounts)}
            </p>
            <span className={styles.statMeta}>Security</span>
          </div>
        </article>

        <article className={styles.statCard}>
          <div className={styles.maintenanceHead}>
            <p className={styles.statLabel}>Maintenance mode</p>
            <span
              className={
                maintenanceOn === true
                  ? styles.maintenanceOn
                  : maintenanceOn === false
                    ? styles.maintenanceOk
                    : styles.statMeta
              }
            >
              {maintenanceLabel}
            </span>
          </div>
          <p className={styles.statCaption}>{maintenanceCaption}</p>
        </article>
      </section>

      <section className={styles.navGrid} aria-label="Configuration areas">
        {NAV_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className={styles.navCard}>
              <span className={styles.navIcon} aria-hidden>
                <Icon size={18} strokeWidth={2} />
              </span>
              <div className={styles.navCopy}>
                <p className={styles.navTitle}>{card.title}</p>
                <p className={styles.navDescription}>{card.description}</p>
              </div>
              <ArrowRight
                size={16}
                strokeWidth={2}
                className={styles.navArrow}
                aria-hidden
              />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
