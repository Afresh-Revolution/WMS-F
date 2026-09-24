"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
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
  type AccessFilter,
  type AccessRole,
  type AccessStatus,
} from "@/data/userAccess";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { showCreatedCredentials } from "@/lib/createdCredentials";
import { superAdminApi, unwrapRecord } from "@/lib/api";
import { firstNameFrom, listFrom, mapAccessUser, readTemporaryPassword, str } from "@/lib/api/mappers";
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
    () => superAdminApi.users.statistics(),
    [],
  );

  const { data: usersData, loading: usersLoading, error, refetch } = useAsyncData(
    () => superAdminApi.users.list(),
    [],
  );

  const users = useMemo(
    () => listFrom(usersData ?? undefined).map((record) => mapAccessUser(record)),
    [usersData],
  );

  const stats = useMemo(() => {
    const payload = unwrapRecord(statsData);
    const active = users.filter((user) => user.status === "Active").length;
    const locked = users.filter((user) => user.status === "Locked").length;
    const admins = users.filter((user) =>
      user.role.toLowerCase().includes("admin"),
    ).length;
    return [
      {
        id: "total",
        label: "Total users",
        value: str(payload.total ?? payload.totalUsers, String(users.length)),
        detail: "All roles",
        detailTone: "muted" as const,
      },
      {
        id: "active",
        label: "Active",
        value: str(payload.active ?? payload.activeUsers, String(active)),
        detail: "Signed in",
        detailTone: "orange" as const,
      },
      {
        id: "locked",
        label: "Locked",
        value: str(payload.locked ?? payload.lockedUsers, String(locked)),
        detail: "Blocked",
        detailTone: "red" as const,
      },
      {
        id: "admins",
        label: "Admins",
        value: str(payload.admins ?? payload.adminUsers, String(admins)),
        detail: str(
          payload.superAdmins ? `${payload.superAdmins} super` : "Super Admin included",
        ),
        detailTone: "amber" as const,
      },
    ];
  }, [statsData, users]);

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
          await superAdminApi.users.unlock(userId);
        } else {
          await superAdminApi.users.lock(userId);
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
            await superAdminApi.users.reactivate(userId);
          } else {
            await superAdminApi.users.deactivate(userId);
          }
          refetch();
        },
      );
    },
    [refetch, runAction],
  );

  async function handleCreateAccount(values: Record<string, string>) {
    await runAction("Create account", async () => {
      const created = await superAdminApi.users.create({
        ...values,
        fullName: values.name || values.fullName,
      });
      const temporaryPassword =
        readTemporaryPassword(created) || firstNameFrom(values.name || values.fullName);
      showCreatedCredentials({
        name: (values.name || values.fullName || "").trim(),
        email: values.email.trim(),
        password: temporaryPassword || "No temporary password was returned.",
      });
      refetch();
    });
  }

  async function handleRoleUpdate(values: Record<string, string>) {
    if (!roleEditUser) return;
    await runAction(`Update role for ${roleEditUser.name}`, async () => {
      await superAdminApi.users.patch(roleEditUser.id, { role: values.role });
      refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <PageDateLabel className={styles.dateLabel} />
        <div className={styles.topActions}>
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
            {error}
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
