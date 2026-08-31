"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Lock,
  LockOpen,
  Plus,
  Power,
  Search,
  UserCog,
} from "lucide-react";
import {
  accessFilters,
  accessStats as fallbackStats,
  accessUsers as fallbackUsers,
  type AccessFilter,
  type AccessRole,
  type AccessStatus,
} from "@/data/userAccess";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { usersApi } from "@/lib/api";
import { listFrom, mapAccessUser, str } from "@/lib/api/mappers";
import styles from "./UserAccessPage.module.css";

const statusClass: Record<AccessStatus, string> = {
  Active: styles.statusActive,
  Inactive: styles.statusInactive,
  Locked: styles.statusLocked,
};

const roleClass: Partial<Record<string, string>> = {
  "Super Admin": styles.roleSuper,
  Admin: styles.roleAdmin,
  "HR Manager": styles.roleHr,
  Finance: styles.roleFinance,
  Manager: styles.roleManager,
  Employee: styles.roleEmployee,
};

const detailToneClass = {
  muted: styles.detailMuted,
  orange: styles.detailOrange,
  red: styles.detailRed,
  amber: styles.detailAmber,
} as const;

const roleOptions = (
  [
    "Super Admin",
    "Admin",
    "HR Manager",
    "Finance",
    "Manager",
    "Employee",
  ] as AccessRole[]
).map((role) => ({ label: role, value: role }));

const createAccountFields = [
  { name: "name", label: "Full name", required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
  {
    name: "role",
    label: "Role",
    type: "select" as const,
    required: true,
    defaultValue: "Employee",
    options: roleOptions,
  },
  { name: "department", label: "Department", required: true },
];

export function UserAccessPage() {
  const { runAction } = usePageActions();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<AccessFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [roleEditUser, setRoleEditUser] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);

  const { data: statsData, loading: statsLoading } = useAsyncData(
    () => usersApi.statistics(),
    [],
  );

  const { data: usersData, loading: usersLoading, error, refetch } = useAsyncData(
    () => usersApi.list(),
    [],
  );

  const users = useMemo(() => {
    const records = listFrom(usersData ?? undefined);
    if (records.length === 0 && !usersData) return fallbackUsers;
    return records.length > 0
      ? records.map((record) => mapAccessUser(record))
      : fallbackUsers;
  }, [usersData]);

  const stats = useMemo(() => {
    if (!statsData) return fallbackStats;
    return [
      {
        id: "total",
        label: "Total users",
        value: str(statsData.total ?? statsData.totalUsers, fallbackStats[0].value),
        detail: "All roles",
        detailTone: "muted" as const,
      },
      {
        id: "active",
        label: "Active",
        value: str(statsData.active ?? statsData.activeUsers, fallbackStats[1].value),
        detail: "Signed in",
        detailTone: "orange" as const,
      },
      {
        id: "locked",
        label: "Locked",
        value: str(statsData.locked ?? statsData.lockedUsers, fallbackStats[2].value),
        detail: "Blocked",
        detailTone: "red" as const,
      },
      {
        id: "admins",
        label: "Admins",
        value: str(statsData.admins ?? statsData.adminUsers, fallbackStats[3].value),
        detail: str(statsData.superAdmins ? `${statsData.superAdmins} super` : "1 super"),
        detailTone: "amber" as const,
      },
    ];
  }, [statsData]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesFilter =
        activeFilter === "All" || user.status === activeFilter;
      const haystack =
        `${user.name} ${user.email} ${user.role} ${user.department}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeFilter, query, users]);

  const handleLockToggle = useCallback(
    async (userId: string, locked: boolean, name: string) => {
      await runAction(locked ? `Unlock ${name}` : `Lock ${name}`, async () => {
        if (locked) {
          await usersApi.unlock(userId);
        } else {
          await usersApi.lock(userId);
        }
        refetch();
      });
    },
    [refetch, runAction],
  );

  const handleActivateToggle = useCallback(
    async (userId: string, inactive: boolean, name: string) => {
      await runAction(
        inactive ? `Activate ${name}` : `Deactivate ${name}`,
        async () => {
          if (inactive) {
            await usersApi.reactivate(userId);
          } else {
            await usersApi.deactivate(userId);
          }
          refetch();
        },
      );
    },
    [refetch, runAction],
  );

  async function handleCreateAccount(values: Record<string, string>) {
    await runAction("Create account", async () => {
      await usersApi.create(values);
      refetch();
    });
  }

  async function handleRoleUpdate(values: Record<string, string>) {
    if (!roleEditUser) return;
    await runAction(`Update role for ${roleEditUser.name}`, async () => {
      await usersApi.patch(roleEditUser.id, { role: values.role });
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Monday, August 3</p>
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
        <div>
          <p className={styles.eyebrow}>System · Access</p>
          <h1 className={styles.title}>User access</h1>
          <p className={styles.subtitle}>
            Provision accounts, manage roles and control who can sign in to Afresh.
          </p>
          {(statsLoading || usersLoading) && (
            <p className={styles.subtitle}>Loading users…</p>
          )}
          {error ? (
            <p className={styles.subtitle} role="alert">
              Showing cached users — {error}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          Create account
        </button>
      </div>

      <div className={styles.statsRow}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
            <span className={`${styles.statDetail} ${detailToneClass[stat.detailTone]}`}>
              {stat.detail}
            </span>
          </article>
        ))}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.listSearch}>
          <Search size={16} className={styles.listSearchIcon} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or role..."
            className={styles.listSearchInput}
          />
        </label>
        <div className={styles.filters}>
          {accessFilters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`${styles.filterChip} ${
                  active ? styles.filterChipActive : ""
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.list}>
        {filteredUsers.map((user) => (
          <article key={user.id} className={styles.row}>
            <div
              className={styles.rowAvatar}
              style={{ background: user.avatarColor }}
            >
              {user.initials}
            </div>

            <div className={styles.rowIdentity}>
              <div className={styles.rowNameLine}>
                <h2 className={styles.rowName}>{user.name}</h2>
                <span
                  className={`${styles.roleBadge} ${roleClass[user.role as AccessRole] ?? ""}`}
                >
                  {user.role}
                </span>
              </div>
              <p className={styles.rowEmail}>{user.email}</p>
            </div>

            <div className={styles.rowMeta}>
              <span className={styles.metaDept}>• {user.department}</span>
              <span className={styles.metaActive}>{user.lastActive}</span>
            </div>

            <span className={`${styles.statusBadge} ${statusClass[user.status]}`}>
              <span className={styles.statusDot} aria-hidden />
              {user.status}
            </span>

            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => setRoleEditUser(user)}
              >
                <UserCog size={15} strokeWidth={1.85} />
                Role
              </button>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() =>
                  void handleLockToggle(
                    user.id,
                    user.status === "Locked",
                    user.name,
                  )
                }
              >
                {user.status === "Locked" ? (
                  <>
                    <LockOpen size={15} strokeWidth={1.85} />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock size={15} strokeWidth={1.85} />
                    Lock
                  </>
                )}
              </button>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() =>
                  void handleActivateToggle(
                    user.id,
                    user.status === "Inactive",
                    user.name,
                  )
                }
              >
                <Power size={15} strokeWidth={1.85} />
                {user.status === "Inactive" ? "Activate" : "Deactivate"}
              </button>
            </div>
          </article>
        ))}

        {filteredUsers.length === 0 && (
          <div className={styles.empty}>No accounts match this view.</div>
        )}
      </div>

      <SimpleModal
        open={createOpen}
        title="Create account"
        description="Provision a new user with role and department access."
        fields={createAccountFields}
        submitLabel="Create account"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateAccount}
      />

      <SimpleModal
        open={Boolean(roleEditUser)}
        title={roleEditUser ? `Change role — ${roleEditUser.name}` : "Change role"}
        fields={[
          {
            name: "role",
            label: "Role",
            type: "select",
            required: true,
            defaultValue: roleEditUser?.role ?? "Employee",
            options: roleOptions,
          },
        ]}
        submitLabel="Save role"
        onClose={() => setRoleEditUser(null)}
        onSubmit={handleRoleUpdate}
      />
    </div>
  );
}
