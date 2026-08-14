"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  placementMembers,
  placementStats,
  type PlacementFilter,
} from "@/data/placements";
import styles from "./PlacementsPage.module.css";

const filters: PlacementFilter[] = ["Active", "Exiting soon", "Exited", "All"];

const filterRoutes: Record<PlacementFilter, string> = {
  Active: "/nysc-interns",
  "Exiting soon": "/nysc-interns/exiting",
  Exited: "/nysc-interns/exited",
  All: "/nysc-interns/all",
};

type PlacementsPageProps = {
  initialFilter?: PlacementFilter;
};

export function PlacementsPage({ initialFilter = "Active" }: PlacementsPageProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<PlacementFilter>(initialFilter);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const isAllView = activeFilter === "All";

  const filteredMembers = useMemo(() => {
    return placementMembers.filter((member) => {
      const matchesFilter =
        activeFilter === "All" || member.status === activeFilter;
      const haystack =
        `${member.name} ${member.school} ${member.department} ${member.supervisor} ${member.type}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeFilter, query]);

  function handleFilterChange(filter: PlacementFilter) {
    setActiveFilter(filter);
    router.push(filterRoutes[filter]);
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <p className={styles.dateLabel}>
            {isAllView ? "Tuesday, June 4" : "Monday, August 3"}
          </p>
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
            </label>
            <button type="button" aria-label="Notifications" className={styles.iconButton}>
              <Bell size={16} />
            </button>
            <button type="button" aria-label="Profile" className={styles.iconButton}>
              <UserRound size={16} />
            </button>
          </div>
        </div>

        <div className={styles.header}>
          <p className={styles.eyebrow}>NYSC &amp; Intern Management</p>
          <h1 className={`${styles.title} ${isAllView ? styles.titleDark : ""}`}>
            Supporting every placement
          </h1>
          <p className={styles.subtitle}>
            Manage NYSC members and interns, track progress, monitor exit dates,
            and process evaluations.
          </p>
        </div>

        <div className={styles.stats}>
          {placementStats.map((stat) => (
            <div key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>{stat.label}</p>
                <span
                  className={`${styles.badge} ${
                    stat.badge === "Alert" ? styles.badgeAlert : ""
                  }`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className={styles.filters}>
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => handleFilterChange(filter)}
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className={styles.grid}>
          {filteredMembers.map((member) => (
            <article key={member.id} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.cardHead}>
                  <div className={styles.avatar}>{member.initials}</div>
                  <div>
                    <div className={styles.nameRow}>
                      <h2 className={styles.name}>{member.name}</h2>
                      <span
                        className={`${styles.typeTag} ${
                          member.type === "NYSC" ? styles.typeNysc : styles.typeIntern
                        }`}
                      >
                        {member.type}
                      </span>
                    </div>
                    <p className={styles.school}>{member.school}</p>
                  </div>
                </div>

                <div className={styles.meta}>
                  <p className={styles.metaItem}>
                    <span className={styles.metaLabel}>Dept: </span>
                    {member.department}
                  </p>
                  <p className={styles.metaItem}>
                    <span className={styles.metaLabel}>Supervisor: </span>
                    {member.supervisor}
                  </p>
                  <p className={styles.metaItem}>
                    <span className={styles.metaLabel}>End date: </span>
                    {member.endDate}
                  </p>
                </div>

                <div className={styles.progressBlock}>
                  <div className={styles.progressTop}>
                    <span>Placement progress</span>
                    <span className={styles.progressValue}>{member.progress}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${member.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button type="button" className={styles.profileLink}>
                  View profile →
                </button>
              </div>
            </article>
          ))}

          {filteredMembers.length === 0 && (
            <div className={styles.empty}>No placements in this view.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
