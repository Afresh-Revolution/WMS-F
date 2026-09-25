"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { useAsyncData } from "@/hooks/useAsyncData";
import { superAdminApi, systemManagementApi } from "@/lib/api";
import { listFrom, str } from "@/lib/api/mappers";
import { Plug, Search } from "lucide-react";
import { useMemo } from "react";
import styles from "./IntegrationsPage.module.css";

type IntegrationRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
};

function mapIntegration(
  record: Record<string, unknown>,
  index: number,
): IntegrationRow {
  return {
    id: str(record.id ?? record._id, String(index)),
    name: str(
      record.name ?? record.title ?? record.provider ?? record.service,
      "Untitled integration",
    ),
    type: str(record.type ?? record.kind ?? record.category, "Service"),
    status: str(record.status ?? record.state ?? record.health, "Unknown"),
    description: str(record.description ?? record.notes ?? record.endpoint),
  };
}

function statusClass(status: string, stylesMap: typeof styles) {
  const raw = status.toLowerCase();
  if (
    raw.includes("active") ||
    raw.includes("connected") ||
    raw.includes("ok") ||
    raw.includes("operational")
  ) {
    return stylesMap.statusOk;
  }
  if (raw.includes("error") || raw.includes("fail") || raw.includes("down")) {
    return stylesMap.statusBad;
  }
  return stylesMap.statusMuted;
}

export function IntegrationsPage() {
  const { runAction } = usePageActions();
  const { data, loading, error, refetch } = useAsyncData(async () => {
    try {
      return await superAdminApi.systemManagement.integrations.list();
    } catch {
      return await systemManagementApi.integrations.list();
    }
  }, []);

  const integrations = useMemo(
    () => listFrom(data ?? undefined).map(mapIntegration),
    [data],
  );

  async function testIntegration(id: string) {
    await runAction("Test integration", async () => {
      try {
        await superAdminApi.systemManagement.integrations.test(id);
      } catch {
        await systemManagementApi.integrations.test(id);
      }
      refetch();
    });
  }

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
        <p className={styles.eyebrow}>System · Integrations</p>
        <h1 className={styles.title}>Integrations</h1>
        <p className={styles.subtitle}>
          Connect third-party services and manage API access. Status comes
          from live system management data.
        </p>
        {loading ? (
          <p className={styles.subtitle}>Loading integrations…</p>
        ) : null}
        {error ? (
          <p className={styles.subtitle} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {integrations.length === 0 && !loading ? (
        <article className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden>
            <Plug size={18} strokeWidth={2} />
          </span>
          <p className={styles.emptyTitle}>No integrations connected</p>
          <p className={styles.emptyCopy}>
            Connected services will appear here once the live API returns
            them.
          </p>
        </article>
      ) : (
        <section className={styles.list}>
          {integrations.map((item) => (
            <article key={item.id} className={styles.row}>
              <span className={styles.rowIcon} aria-hidden>
                <Plug size={16} strokeWidth={2} />
              </span>
              <div className={styles.rowCopy}>
                <p className={styles.rowTitle}>{item.name}</p>
                <p className={styles.rowMeta}>
                  {item.type}
                  {item.description ? ` · ${item.description}` : ""}
                </p>
              </div>
              <span className={statusClass(item.status, styles)}>
                {item.status}
              </span>
              {item.id ? (
                <button
                  type="button"
                  className={styles.testButton}
                  onClick={() => void testIntegration(item.id)}
                >
                  Test
                </button>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
