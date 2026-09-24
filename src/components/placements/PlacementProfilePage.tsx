"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  Layers,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { managerApi, superAdminApi, unwrapRecord } from "@/lib/api";
import { mapPlacement } from "@/lib/api/mappers";
import { portalHref } from "@/lib/portalPaths";
import styles from "./PlacementProfilePage.module.css";

function display(value: string) {
  return value.trim() || "—";
}

export function PlacementProfilePage({ id }: { id: string }) {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const manager = useManagerPortal();
  const { data, loading, error } = useAsyncData(
    () =>
      manager
        ? managerApi.getNyscIntern(id)
        : superAdminApi.nyscInterns.get(id),
    [id, manager],
  );

  const member = useMemo(() => {
    if (!data) return null;
    return mapPlacement(unwrapRecord(data));
  }, [data]);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <p className={styles.dateLabel}>Member profile</p>
        {loading ? <p className={styles.dateLabel}>Loading profile…</p> : null}
        {error ? (
          <p className={styles.dateLabel} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.topActions}>
          <label className={styles.search}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search"
            />
          </label>
          <NotificationsLink className={styles.iconButton} />
          <ProfileLink className={styles.avatarChip}>
            {user?.initials ?? "MA"}
          </ProfileLink>
        </div>
      </div>

      <Link href={portalHref(pathname, "/nysc-interns")} className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to placements
      </Link>

      {!loading && !member && !error ? (
        <p className={styles.empty}>This member could not be found.</p>
      ) : null}

      {member ? (
        <>
          <header className={styles.header}>
            <p className={styles.eyebrow}>NYSC &amp; Intern Management</p>
            <div className={styles.identity}>
              <span className={styles.avatar}>{member.initials}</span>
              <div>
                <div className={styles.nameRow}>
                  <h1 className={styles.title}>{display(member.name)}</h1>
                  <span className={styles.typeTag}>{member.type}</span>
                  <span className={styles.statusTag}>{member.status}</span>
                </div>
                <p className={styles.subtitle}>{display(member.school)}</p>
              </div>
            </div>
          </header>

          <div className={styles.columns}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Placement</h2>
              <ul className={styles.detailList}>
                <li>
                  <Building2 size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Institution</p>
                    <p className={styles.detailValue}>
                      {display(member.institution)}
                    </p>
                  </div>
                </li>
                <li>
                  <BookOpen size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Course of study</p>
                    <p className={styles.detailValue}>
                      {display(member.course)}
                    </p>
                  </div>
                </li>
                <li>
                  <Layers size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Department</p>
                    <p className={styles.detailValue}>
                      {display(member.department)}
                    </p>
                  </div>
                </li>
                <li>
                  <UserRound size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Supervisor</p>
                    <p className={styles.detailValue}>
                      {display(member.supervisor)}
                    </p>
                  </div>
                </li>
                <li>
                  <CalendarDays size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Start date</p>
                    <p className={styles.detailValue}>
                      {display(member.startDate)}
                    </p>
                  </div>
                </li>
                <li>
                  <CalendarDays size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>End date</p>
                    <p className={styles.detailValue}>
                      {display(member.endDate)}
                    </p>
                  </div>
                </li>
              </ul>

              <div className={styles.progressBlock}>
                <div className={styles.progressTop}>
                  <span>Placement progress</span>
                  <span className={styles.progressValue}>
                    {member.progress}%
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${Math.min(100, Math.max(0, member.progress))}%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Contact</h2>
              <ul className={styles.detailList}>
                <li>
                  <Mail size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Email</p>
                    <p className={styles.detailValue}>{display(member.email)}</p>
                  </div>
                </li>
                <li>
                  <Phone size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Phone</p>
                    <p className={styles.detailValue}>{display(member.phone)}</p>
                  </div>
                </li>
                <li>
                  <MapPin size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Address</p>
                    <p className={styles.detailValue}>
                      {display(member.address)}
                    </p>
                  </div>
                </li>
                <li>
                  <UserRound size={15} aria-hidden />
                  <div>
                    <p className={styles.detailLabel}>Emergency contact</p>
                    <p className={styles.detailValue}>
                      {member.emergencyName || member.emergencyPhone
                        ? [member.emergencyName, member.emergencyPhone]
                            .filter(Boolean)
                            .join(" · ")
                        : "—"}
                    </p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
