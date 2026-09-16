"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Info, Search } from "lucide-react";
import {
  type PermissionKey,
  type PermissionRole,
  type PermissionRow,
} from "@/data/rolesPermissions";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { superAdminApi } from "@/lib/api";
import { listFrom, mapAccessRole, str } from "@/lib/api/mappers";
import styles from "./RolesPermissionsPage.module.css";

export function RolesPermissionsPage() {
  const { runAction } = usePageActions();
  const { data: rolesData, loading, error } = useAsyncData(
    () => superAdminApi.roles.list(),
    [],
  );

  const { data: permissionsData } = useAsyncData(
    () => superAdminApi.permissions.catalog(),
    [],
  );

  const roles = useMemo((): PermissionRole[] => {
    return listFrom(rolesData ?? undefined).map(
      (record) => mapAccessRole(record.name ?? record.slug) as PermissionRole,
    );
  }, [rolesData]);

  const [matrix, setMatrix] = useState<PermissionRow[]>([]);

  useEffect(() => {
    const catalog = permissionsData as Record<string, unknown> | null;
    const permissions = listFrom(
      (catalog?.permissions ?? catalog?.data ?? permissionsData) as never,
    );
    if (permissions.length === 0) return;

    const roleRecords = listFrom(rolesData ?? undefined);
    const grantsByRole = new Map<string, Record<string, boolean>>();
    for (const role of roleRecords) {
      grantsByRole.set(str(role.id), (role.permissions ?? {}) as Record<string, boolean>);
    }

    setMatrix(
      permissions.map((permission) => {
        const key = str(permission.key ?? permission.slug ?? permission.id);
        const grants = {} as Record<PermissionRole, boolean>;
        for (const roleName of roles) {
          const roleRecord = roleRecords.find(
            (r) => mapAccessRole(r.name ?? r.slug) === roleName,
          );
          const rolePerms = roleRecord
            ? ((roleRecord.permissions ?? {}) as Record<string, boolean>)
            : {};
          grants[roleName] = Boolean(rolePerms[key]);
        }
        return {
          key: key as PermissionKey,
          label: str(permission.label ?? permission.name ?? key),
          grants,
        };
      }),
    );
  }, [permissionsData, rolesData, roles]);

  const togglePermission = useCallback(
    async (key: PermissionKey, role: PermissionRole) => {
      if (role === "Super Admin") return;

      const roleRecords = listFrom(rolesData ?? undefined);
      const roleRecord = roleRecords.find(
        (r) => mapAccessRole(r.name ?? r.slug) === role,
      );
      const roleId = roleRecord ? str(roleRecord.id) : "";

      const row = matrix.find((item) => item.key === key);
      const nextValue = row ? !row.grants[role] : true;

      setMatrix((current) =>
        current.map((rowItem) =>
          rowItem.key === key
            ? {
                ...rowItem,
                grants: {
                  ...rowItem.grants,
                  [role]: nextValue,
                },
              }
            : rowItem,
        ),
      );

      if (roleId) {
        await runAction(`Update ${key} for ${role}`, async () => {
          await superAdminApi.roles.permissions.update(roleId, {
            permissions: matrix
              .filter((rowItem) =>
                rowItem.key === key ? nextValue : Boolean(rowItem.grants[role]),
              )
              .map((rowItem) => rowItem.key),
          });
        }).catch(() => {
          setMatrix((current) =>
            current.map((rowItem) =>
              rowItem.key === key
                ? {
                    ...rowItem,
                    grants: {
                      ...rowItem.grants,
                      [role]: !nextValue,
                    },
                  }
                : rowItem,
            ),
          );
        });
      }
    },
    [matrix, rolesData, runAction],
  );

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
        <p className={styles.eyebrow}>System · Roles</p>
        <h1 className={styles.title}>Roles & permissions</h1>
        <p className={styles.subtitle}>
          Control what each role can do across the platform. Changes apply
          immediately and are recorded in the technical audit log.
        </p>
        {loading ? <p className={styles.subtitle}>Loading roles…</p> : null}
        {error ? (
          <p className={styles.subtitle} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <section className={styles.matrixCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.permissionHead}>
                  Permission
                </th>
                {roles.map((role) => (
                  <th key={role} scope="col" className={styles.roleHead}>
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className={styles.permissionCell}>
                    {row.label}
                  </th>
                  {roles.map((role) => {
                    const checked = row.grants[role] ?? false;
                    const locked = role === "Super Admin";
                    return (
                      <td key={role} className={styles.checkCell}>
                        <button
                          type="button"
                          className={`${styles.check} ${
                            checked ? styles.checkOn : styles.checkOff
                          } ${locked ? styles.checkLocked : ""}`}
                          aria-pressed={checked}
                          aria-label={`${row.label} for ${role}`}
                          disabled={locked}
                          onClick={() => void togglePermission(row.key, role)}
                        >
                          {checked ? <Check size={14} strokeWidth={3} /> : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.note}>
          <Info size={15} strokeWidth={2.25} className={styles.noteIcon} />
          Super Admin permissions are fixed and cannot be reduced.
        </p>
      </section>
    </div>
  );
}
