"use client";

import { useMemo } from "react";
import {
  Activity,
  Radio,
  RefreshCw,
  Search,
  Server,
} from "lucide-react";
import {
  healthConfiguration as fallbackConfig,
  healthInfrastructure as fallbackInfra,
  healthServices as fallbackServices,
  healthStats as fallbackStats,
  type HealthMetric,
  type HealthService,
  type ServiceStatus,
} from "@/data/systemHealth";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePageActions } from "@/hooks/usePageActions";
import { systemHealthApi } from "@/lib/api";
import { listFrom, mapServiceStatus, num, str } from "@/lib/api/mappers";
import styles from "./SystemHealthPage.module.css";

const statusClass: Record<ServiceStatus, string> = {
  Operational: styles.statusOperational,
  Degraded: styles.statusDegraded,
};

const dotClass: Record<ServiceStatus, string> = {
  Operational: styles.serviceDotOperational,
  Degraded: styles.serviceDotDegraded,
};

export function SystemHealthPage() {
  const { runAction } = usePageActions();

  const { data: summary, loading, error, refetch } = useAsyncData(
    () => systemHealthApi.summary(),
    [],
  );

  const { data: servicesData } = useAsyncData(
    () => systemHealthApi.services(),
    [],
  );

  const { data: infraData } = useAsyncData(
    () => systemHealthApi.infrastructure(),
    [],
  );

  const { data: metricsData } = useAsyncData(
    () => systemHealthApi.metrics(),
    [],
  );

  const stats = useMemo(() => {
    const s = (summary ?? {}) as Record<string, unknown>;
    return [
      {
        id: "uptime",
        label: "Uptime",
        value: str(s.uptime ?? s.uptimePercent, fallbackStats[0].value),
        badge: str(s.uptimeWindow ?? fallbackStats[0].badge),
      },
      {
        id: "services",
        label: "Services healthy",
        value: str(s.servicesHealthy ?? s.healthyServices, fallbackStats[1].value),
        badge: str(s.servicesBadge ?? fallbackStats[1].badge),
      },
      {
        id: "sessions",
        label: "Active sessions",
        value: str(s.activeSessions ?? s.sessions, fallbackStats[2].value),
        badge: str(s.sessionsBadge ?? fallbackStats[2].badge),
      },
      {
        id: "latency",
        label: "Avg API latency",
        value: str(s.avgLatency ?? s.latency, fallbackStats[3].value),
        badge: str(s.latencyBadge ?? fallbackStats[3].badge),
      },
    ];
  }, [summary]);

  const services = useMemo((): HealthService[] => {
    const records = listFrom(servicesData ?? undefined);
    if (records.length === 0) return fallbackServices;
    return records.map((record, index) => ({
      id: str(record.id ?? record.name ?? index),
      name: str(record.name ?? record.service),
      latency: str(record.latency ?? record.responseTime, "—"),
      status: mapServiceStatus(record.status ?? record.health),
    }));
  }, [servicesData]);

  const infrastructure = useMemo((): HealthMetric[] => {
    const infra = (infraData ?? metricsData ?? {}) as Record<string, unknown>;
    const metrics = listFrom(
      Array.isArray(infraData) || (infraData && "data" in (infraData as object))
        ? (infraData as never)
        : undefined,
    );

    if (metrics.length > 0) {
      return metrics.map((record, index) => ({
        id: str(record.id ?? index),
        label: str(record.label ?? record.name),
        value: num(record.value ?? record.percent),
      }));
    }

    const cpu = num(infra.cpu ?? infra.cpuUsage);
    const memory = num(infra.memory ?? infra.memoryUsage);
    const disk = num(infra.disk ?? infra.diskUsage);

    if (cpu || memory || disk) {
      return [
        { id: "cpu", label: "CPU usage", value: cpu || fallbackInfra[0].value },
        { id: "memory", label: "Memory usage", value: memory || fallbackInfra[1].value },
        { id: "disk", label: "Disk usage", value: disk || fallbackInfra[2].value },
      ];
    }

    return fallbackInfra;
  }, [infraData, metricsData]);

  const configuration = useMemo(() => {
    const config = (summary ?? {}) as Record<string, unknown>;
    const items = listFrom(config.configuration as never);
    if (items.length > 0) {
      return items.map((record, index) => ({
        id: str(record.id ?? index),
        label: str(record.label ?? record.name),
        status: mapServiceStatus(record.status),
      }));
    }
    return fallbackConfig;
  }, [summary]);

  function refreshHealth() {
    void runAction("Refresh system health", async () => {
      await refetch();
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
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
        <p className={styles.eyebrow}>System · Health</p>
        <h1 className={styles.title}>System health</h1>
        <p className={styles.dateLabel}>Monday, August 3</p>
        {loading ? <p className={styles.dateLabel}>Loading health data…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            Showing cached health — {error}
          </p>
        ) : null}
        <button
          type="button"
          className={styles.refreshButton}
          onClick={refreshHealth}
          aria-label="Refresh"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className={styles.statsRow}>
        {stats.map((stat) => (
          <article key={stat.id} className={styles.statCard}>
            <p className={styles.statLabel}>{stat.label}</p>
            <div className={styles.statFooter}>
              <p className={styles.statValue}>{stat.value}</p>
              <span className={styles.statBadge}>{stat.badge}</span>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <section className={`${styles.card} ${styles.servicesCard}`}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitleIcon} aria-hidden>
                <Server size={18} strokeWidth={2} />
              </span>
              <h2 className={styles.cardTitle}>Services</h2>
            </div>
            <span className={styles.checkedLabel}>
              <RefreshCw size={12} strokeWidth={2.25} />
              Checked just now
            </span>
          </div>

          <div className={styles.serviceList}>
            {services.map((service) => (
              <div key={service.id} className={styles.serviceRow}>
                <div className={styles.serviceMain}>
                  <span
                    className={`${styles.serviceDot} ${dotClass[service.status]}`}
                    aria-hidden
                  />
                  <h3 className={styles.serviceName}>{service.name}</h3>
                </div>
                <div className={styles.serviceMeta}>
                  <span className={styles.serviceLatency}>{service.latency}</span>
                  <span
                    className={`${styles.statusBadge} ${statusClass[service.status]}`}
                  >
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitleIcon} aria-hidden>
                <Activity size={18} strokeWidth={2} />
              </span>
              <h2 className={styles.cardTitle}>Infrastructure</h2>
            </div>
          </div>

          <div className={styles.metricList}>
            {infrastructure.map((metric) => (
              <div key={metric.id} className={styles.metricRow}>
                <div className={styles.metricHeader}>
                  <h3 className={styles.metricLabel}>{metric.label}</h3>
                  <span className={styles.metricValue}>{metric.value}%</span>
                </div>
                <div
                  className={styles.meterTrack}
                  role="meter"
                  aria-label={metric.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={metric.value}
                >
                  <div
                    className={styles.meterFill}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardTitleIcon} aria-hidden>
                <Radio size={18} strokeWidth={2} />
              </span>
              <h2 className={styles.cardTitle}>Configuration</h2>
            </div>
          </div>

          <div className={styles.configList}>
            {configuration.map((item) => (
              <div key={item.id} className={styles.configRow}>
                <h3 className={styles.configLabel}>{item.label}</h3>
                <span
                  className={`${styles.statusBadge} ${statusClass[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
