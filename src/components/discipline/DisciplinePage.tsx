"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  Circle,
  Eye,
  Gavel,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  actionTypeOptions,
  disciplineCases as sampleDisciplineCases,
  type DisciplineCase,
  type DisciplineFilter,
} from "@/data/discipline";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  createDisciplinaryRecord,
  listDisciplinaryRecords,
  listStaffEmployees,
} from "@/lib/api";
import { initials, listFrom, mapDisciplineCase, mapEmployee } from "@/lib/api/mappers";
import { DisciplineRecordModal } from "./DisciplineRecordModal";
import { HideOnManager } from "@/components/layout/HideOnManager";
import { useCurrentUser } from "@/components/layout/CurrentUserProvider";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { usePageActions } from "@/hooks/usePageActions";
import { portalHref } from "@/lib/portalPaths";
import styles from "./DisciplinePage.module.css";

const filters: DisciplineFilter[] = ["Active", "Closed", "All"];

const filterRoutes: Record<DisciplineFilter, string> = {
  Active: "/discipline",
  Closed: "/discipline/closed",
  All: "/discipline/all",
};

const tagClass = {
  warning: styles.tagWarning,
  unacknowledged: styles.tagUnacknowledged,
  active: styles.tagActive,
  closed: styles.tagClosed,
  acknowledged: styles.tagClosed,
  strike: styles.tagStrike,
} as const;

type DisciplinePageProps = {
  modalOpen?: boolean;
  initialFilter?: DisciplineFilter;
  viewRecordId?: string;
};

export function DisciplinePage({
  modalOpen = false,
  initialFilter = "Active",
  viewRecordId,
}: DisciplinePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { runAction } = usePageActions();
  const [activeFilter, setActiveFilter] =
    useState<DisciplineFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(modalOpen);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    viewRecordId ?? null,
  );
  const [employee, setEmployee] = useState("");
  const [actionType, setActionType] = useState("Warning");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, loading, error, refetch } = useAsyncData(
    () => listDisciplinaryRecords(),
    [],
  );

  const { data: employeeData, loading: employeesLoading } = useAsyncData(
    () => listStaffEmployees(),
    [],
  );

  const employees = useMemo(
    () =>
      (employeeData ?? [])
        .map((record) => mapEmployee(record))
        .filter((person) => person.id && person.name),
    [employeeData],
  );

  const disciplineCases = useMemo((): DisciplineCase[] => {
    const mapped = listFrom(data ?? undefined).map(
      (record) => mapDisciplineCase(record) as DisciplineCase,
    );
    const byId = new Map(employees.map((person) => [person.id, person]));
    const enriched = mapped.map((item) => {
      const person = item.employeeId ? byId.get(item.employeeId) : undefined;
      const name = item.name || person?.name || "";
      return {
        ...item,
        name,
        initials: item.initials && item.initials !== "—" ? item.initials : initials(name) || "—",
        role: item.role || person?.title || person?.department || "",
        issuedBy: item.issuedBy || "Manager",
      };
    });
    return enriched.length > 0 || loading ? enriched : sampleDisciplineCases;
  }, [data, employees, loading]);

  const disciplineStats = useMemo(() => {
    const open = disciplineCases.filter((item) => item.status === "Active").length;
    const closed = disciplineCases.filter((item) => item.status === "Closed").length;
    const pending = disciplineCases.filter((item) =>
      item.tags.some((tag) => tag.tone === "unacknowledged"),
    ).length;
    return [
      { id: "open", label: "Open Cases", value: String(open) },
      { id: "pending", label: "Pending Acknowledgement", value: String(pending) },
      { id: "closed", label: "Closed This Year", value: String(closed) },
    ];
  }, [disciplineCases]);

  const selectedRecord = selectedRecordId
    ? disciplineCases.find((item) => item.id === selectedRecordId)
    : undefined;

  const filteredCases = useMemo(() => {
    return disciplineCases.filter((item) => {
      const matchesFilter =
        activeFilter === "All" || item.status === activeFilter;
      const haystack =
        `${item.name} ${item.role} ${item.description} ${item.issuedBy}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query, disciplineCases]);

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    setIsModalOpen(modalOpen);
  }, [modalOpen]);

  useEffect(() => {
    setSelectedRecordId(viewRecordId ?? null);
  }, [viewRecordId]);

  useEffect(() => {
    if (!isModalOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isModalOpen]);

  function resetForm() {
    setEmployee("");
    setActionType("Warning");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
    if (pathname.endsWith("/discipline/create") || pathname.endsWith("/discipline/new")) {
      router.push(portalHref(pathname, "/discipline"));
    }
  }

  function closeRecordModal() {
    setSelectedRecordId(null);
    if (pathname.endsWith("/discipline/closed/view")) {
      router.push(portalHref(pathname, "/discipline/closed"));
    } else if (
      pathname.endsWith("/discipline/all/view") ||
      pathname.endsWith("/discipline/new")
    ) {
      router.push(portalHref(pathname, "/discipline/all"));
    } else if (/\/discipline\/[^/]+$/.test(pathname)) {
      router.push(portalHref(pathname, filterRoutes[activeFilter]));
    }
  }

  function openRecord(id: string) {
    setSelectedRecordId(id);
    router.push(portalHref(pathname, `/discipline/${id}`));
  }

  function handleFilterChange(filter: DisciplineFilter) {
    setActiveFilter(filter);
    router.push(portalHref(pathname, filterRoutes[filter]));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runAction("Create disciplinary record", async () => {
      const person = employees.find((item) => item.id === employee);
      await createDisciplinaryRecord({
        employeeId: employee,
        employeeName: person?.name,
        role: person?.title || person?.department,
        issuedBy: user?.name || "Manager",
        actionType,
        description,
        date,
      });
      await refetch();
      closeModal();
    }).catch(() => undefined);
  }

  return (
    <>
      <div
        className={`${styles.page} ${isModalOpen ? styles.pageDimmed : ""}`}
      >
        <HideOnManager>
        <div className={styles.topBar}>
          <PageDateLabel className={styles.dateLabel} />
          {loading ? <p className={styles.dateLabel}>Loading cases…</p> : null}
          {error ? (
            <p className={styles.dateLabel} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.topActions}>
            <label className={styles.search}>
              <Search size={15} className={styles.searchIcon} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className={styles.searchInput}
              />
              <kbd className={styles.searchShortcut}>⌘K</kbd>
            </label>
            <NotificationsLink className={styles.iconButton} />
            <ProfileLink className={styles.avatarChip}>MC</ProfileLink>
          </div>
        </div>
        </HideOnManager>

        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Disciplinary Management</p>
            <h1 className={styles.title}>Handled with care and record</h1>
            <p className={styles.subtitle}>
              Create and manage disciplinary actions. All records are confidential
              and role-restricted.
            </p>
          </div>
          <button
            type="button"
            className={styles.newButton}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            New action
          </button>
        </div>

        <div className={styles.stats}>
          {disciplineStats.map((stat) => (
            <article
              key={stat.id}
              className={`${styles.statCard} ${
                stat.id === "pending" ? styles.statCardSoft : ""
              }`}
            >
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </article>
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

        <div className={styles.list}>
          {filteredCases.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.avatar}>{item.initials}</div>
              <div className={styles.cardBody}>
                <div className={styles.titleRow}>
                  <h2 className={styles.name}>{item.name || "Staff member"}</h2>
                  {item.tags.map((tag) => (
                    <span
                      key={`${item.id}-${tag.label}`}
                      className={`${styles.tag} ${tagClass[tag.tone]}`}
                    >
                      {tag.tone === "warning" && (
                        <AlertCircle size={12} strokeWidth={2} />
                      )}
                      {tag.tone === "strike" && (
                        <Circle size={10} strokeWidth={2.5} fill="currentColor" />
                      )}
                      {tag.label}
                    </span>
                  ))}
                </div>
                <p className={styles.meta}>
                  {item.role}
                  <span className={styles.metaDot}>·</span>
                  {item.date}
                  <span className={styles.metaDot}>·</span>
                  Issued by {item.issuedBy}
                </p>
                <p className={styles.description}>{item.description}</p>
              </div>
              <button
                type="button"
                className={styles.viewButton}
                onClick={() => openRecord(item.id)}
              >
                <Eye size={15} strokeWidth={2} />
                View
              </button>
            </article>
          ))}

          {filteredCases.length === 0 && (
            <div className={styles.empty}>No disciplinary records in this view.</div>
          )}
        </div>
      </div>

      {selectedRecord && (
        <DisciplineRecordModal
          record={selectedRecord}
          onClose={closeRecordModal}
          onUpdated={() => void refetch()}
        />
      )}

      {isModalOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discipline-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <span className={styles.modalIcon} aria-hidden>
                  <Gavel size={16} strokeWidth={2} />
                </span>
                <h2 id="discipline-modal-title" className={styles.modalTitle}>
                  New disciplinary action
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                className={styles.closeButton}
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <label className={styles.field}>
                  <span className={styles.label}>Employee</span>
                  <select
                    className={styles.select}
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      {employeesLoading
                        ? "Loading employees…"
                        : employees.length
                          ? "Select employee"
                          : "No employees found"}
                    </option>
                    {employees.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.title
                          ? `${person.name} — ${person.title}`
                          : person.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Action type</span>
                  <select
                    className={styles.select}
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                  >
                    {actionTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Description</span>
                  <textarea
                    className={styles.textarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the incident and action taken"
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Date</span>
                  <div className={styles.dateField}>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                    <CalendarDays size={16} className={styles.dateIcon} />
                  </div>
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  Create record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
