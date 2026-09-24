"use client";

import { PageDateLabel } from "@/components/layout/PageDateLabel";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Plus, Search } from "lucide-react";
import {
  placementMembers as samplePlacementMembers,
  type PlacementFilter,
} from "@/data/placements";
import { HideOnManager } from "@/components/layout/HideOnManager";
import { NotificationsLink, ProfileLink } from "@/components/layout/PageLinks";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useManagerPortal } from "@/hooks/useManagerPortal";
import { usePageActions } from "@/hooks/usePageActions";
import { loadManagerLookups, lookupsApi, managerApi, superAdminApi } from "@/lib/api";
import { firstNameFrom, listFrom, mapDepartment, mapPlacement, readTemporaryPassword, str } from "@/lib/api/mappers";
import { showCreatedCredentials } from "@/lib/createdCredentials";
import { asInternRecord } from "@/lib/api/internMappers";
import { portalHref } from "@/lib/portalPaths";
import styles from "./PlacementsPage.module.css";

const filters: PlacementFilter[] = ["Active", "Exiting soon", "Exited", "All"];

const filterRoutes: Record<PlacementFilter, string> = {
  Active: "/nysc-interns",
  "Exiting soon": "/nysc-interns/exiting",
  Exited: "/nysc-interns/exited",
  All: "/nysc-interns/all",
};

const statusQuery: Record<PlacementFilter, string | undefined> = {
  Active: "ACTIVE",
  "Exiting soon": "ENDING_SOON",
  Exited: "EXITED",
  All: undefined,
};

function internEmail(record: Record<string, unknown>) {
  const profile = asInternRecord(record.profile);
  const contact = asInternRecord(record.contact ?? profile.contact);
  return str(profile.email ?? contact.email ?? record.email)
    .trim()
    .toLowerCase();
}

function internPhone(record: Record<string, unknown>) {
  const profile = asInternRecord(record.profile);
  const contact = asInternRecord(record.contact ?? profile.contact);
  return str(profile.phone ?? contact.phone ?? record.phone).replace(/\D/g, "");
}

function internId(record: Record<string, unknown>) {
  const profile = asInternRecord(record.profile);
  const placement = asInternRecord(record.placement);
  return str(profile.id ?? placement.id ?? record.id ?? record._id);
}

function isActivePlacementConflict(error: unknown) {
  return (
    error instanceof Error &&
    /already has an active placement/i.test(error.message)
  );
}

function localIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultPlacementDates() {
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return { start: localIsoDate(start), end: localIsoDate(end) };
}

function memberWriteBody(values: Record<string, string>) {
  const supervisorId = values.employeeId.trim();
  const supervisorName = values.supervisorName.trim();
  const departmentName = values.departmentName.trim();
  const school = values.school.trim();
  const course = values.courseOfStudy.trim();
  return {
    fullName: values.name.trim(),
    name: values.name.trim(),
    type: values.type === "INTERN" ? "INTERN" : "NYSC",
    startDate: values.startDate,
    endDate: values.endDate,
    departmentId: values.departmentId,
    ...(departmentName ? { department: departmentName } : {}),
    ...(school ? { institution: school, school } : {}),
    ...(course ? { courseOfStudy: course } : {}),
    ...(values.email.trim() ? { email: values.email.trim() } : {}),
    ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
    ...(supervisorId
      ? {
          supervisorEmployeeId: supervisorId,
          supervisorId,
          supervisor: supervisorName || supervisorId,
          employeeId: supervisorId,
        }
      : {}),
  };
}

type PlacementsPageProps = {
  initialFilter?: PlacementFilter;
};

export function PlacementsPage({ initialFilter = "Active" }: PlacementsPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const manager = useManagerPortal();
  const [activeFilter, setActiveFilter] = useState<PlacementFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { showToast } = usePageActions();

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const statusParam = statusQuery[activeFilter];

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      manager
        ? managerApi.listNyscInterns()
        : superAdminApi.nyscInterns.list(),
    [manager],
  );

  const { data: lookupPayload } = useAsyncData(
    () =>
      manager
        ? loadManagerLookups()
        : Promise.all([
            superAdminApi.departments.list(),
            lookupsApi.employees(),
          ]).then(([departments, employees]) => ({
            departments: listFrom(departments),
            employees: listFrom(employees),
            locations: [],
          })),
    [manager],
  );

  const departmentOptions = useMemo(() => {
    return listFrom(lookupPayload?.departments ?? undefined)
      .map(mapDepartment)
      .filter((item) => item.id && item.name)
      .map((item) => ({ label: item.name, value: item.id }));
  }, [lookupPayload]);

  const supervisorOptions = useMemo(() => {
    return listFrom(lookupPayload?.employees ?? undefined)
      .map((record) => ({
        label: str(
          record.fullName ?? record.name ?? record.label ?? record.email,
        ),
        value: str(record.id ?? record.employeeId ?? record._id),
      }))
      .filter((item) => item.label && item.value);
  }, [lookupPayload]);

  const addMemberFields = useMemo(
    () => [
      { name: "name", label: "Full name", required: true },
      {
        name: "type",
        label: "Type",
        type: "select" as const,
        required: true,
        defaultValue: "NYSC",
        options: [
          { label: "NYSC", value: "NYSC" },
          { label: "Intern", value: "INTERN" },
        ],
      },
      { name: "school", label: "School / institution", required: true },
      { name: "courseOfStudy", label: "Course of study", required: true },
      {
        name: "departmentId",
        label: "Department",
        type: "select" as const,
        required: true,
        options:
          departmentOptions.length > 0
            ? departmentOptions
            : [{ label: "No departments available", value: "" }],
      },
      {
        name: "employeeId",
        label: "Supervisor",
        type: "select" as const,
        required: true,
        options:
          supervisorOptions.length > 0
            ? supervisorOptions
            : [{ label: "No employees in directory", value: "" }],
      },
      {
        name: "startDate",
        label: "Start date",
        type: "date" as const,
        required: true,
        defaultValue: defaultPlacementDates().start,
      },
      {
        name: "endDate",
        label: "End date",
        type: "date" as const,
        required: true,
        defaultValue: defaultPlacementDates().end,
      },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
    ],
    [departmentOptions, supervisorOptions],
  );

  const placementMembers = useMemo(() => {
    const mapped = listFrom(data ?? undefined).map((record) =>
      mapPlacement(record),
    );
    return mapped.length > 0 || loading ? mapped : samplePlacementMembers;
  }, [data, loading]);

  const placementStats = useMemo(() => {
    const active = placementMembers.filter((m) => m.status === "Active").length;
    const exiting = placementMembers.filter((m) => m.status === "Exiting soon").length;
    const nysc = placementMembers.filter((m) => m.type === "NYSC").length;
    const interns = placementMembers.filter((m) => m.type === "Intern").length;
    return [
      { id: "active", label: "Active Members", value: String(active), badge: "Current" },
      { id: "exiting", label: "Exiting in 60 Days", value: String(exiting), badge: "Alert" },
      { id: "nysc", label: "NYSC Members", value: String(nysc), badge: "Active" },
      { id: "interns", label: "Interns", value: String(interns), badge: "Active" },
    ];
  }, [placementMembers]);

  const filteredMembers = useMemo(() => {
    return placementMembers.filter((member) => {
      const matchesFilter =
        activeFilter === "All" || member.status === activeFilter;
      const haystack =
        `${member.name} ${member.school} ${member.department} ${member.supervisor} ${member.type} ${member.id}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [activeFilter, query, placementMembers]);

  function handleFilterChange(filter: PlacementFilter) {
    setActiveFilter(filter);
    router.push(portalHref(pathname, filterRoutes[filter]));
  }

  async function findExistingInternId(email: string, phone: string) {
    const needle = email.trim().toLowerCase();
    const phoneNeedle = phone.replace(/\D/g, "");
    const listMembers = manager
      ? managerApi.listNyscInterns.bind(managerApi)
      : superAdminApi.nyscInterns.list;
    const payload = await listMembers(needle ? { email: needle } : undefined);
    const records = listFrom(payload ?? undefined);
    const match = records.find((record) => {
      const recEmail = internEmail(record);
      const recPhone = internPhone(record);
      return (
        (needle && recEmail === needle) ||
        (phoneNeedle.length >= 7 && recPhone.endsWith(phoneNeedle))
      );
    });
    if (match) return internId(match);

    const all = listFrom((await listMembers()) ?? undefined);
    const fallback = all.find((record) => {
      const recEmail = internEmail(record);
      const recPhone = internPhone(record);
      return (
        (needle && recEmail === needle) ||
        (phoneNeedle.length >= 7 && recPhone.endsWith(phoneNeedle))
      );
    });
    return fallback ? internId(fallback) : "";
  }

  async function assignSupervisor(created: unknown, employeeId: string) {
    const supervisorId = employeeId.trim();
    if (!supervisorId) return;
    const envelope = asInternRecord(created);
    const payload = asInternRecord(envelope.data ?? envelope);
    const profile = asInternRecord(payload.profile ?? payload);
    const id = internId(profile) || internId(payload) || internId(envelope);
    if (!id) return;
    if (manager) {
      await managerApi.assignNyscSupervisor(id, { employeeId: supervisorId });
      return;
    }
    await superAdminApi.nyscInterns.action(id, "supervisor", {
      employeeId: supervisorId,
    });
  }

  async function handleAddMember(values: Record<string, string>) {
    if (!values.name.trim()) {
      showToast("Enter the member's full name.", "error");
      throw new Error("Full name is required.");
    }
    if (!values.school.trim()) {
      showToast("Enter the school or institution.", "error");
      throw new Error("Institution is required.");
    }
    if (!values.courseOfStudy.trim()) {
      showToast("Enter the course of study.", "error");
      throw new Error("Course of study is required.");
    }
    if (!values.departmentId.trim()) {
      showToast("Choose a department from the dropdown.", "error");
      throw new Error("Choose a department from the dropdown.");
    }
    if (!values.employeeId.trim()) {
      showToast("Choose a supervisor from the directory.", "error");
      throw new Error("Choose a supervisor from the directory.");
    }
    if (!values.startDate || !values.endDate || values.endDate <= values.startDate) {
      showToast("End date must be after the start date.", "error");
      throw new Error("End date must be after the start date.");
    }
    const body = memberWriteBody({
      ...values,
      departmentName:
        departmentOptions.find((item) => item.value === values.departmentId)
          ?.label ?? "",
      supervisorName:
        supervisorOptions.find((item) => item.value === values.employeeId)
          ?.label ?? "",
    });
    try {
      const created = manager
        ? await managerApi.createNyscIntern(body)
        : await superAdminApi.nyscInterns.create(body);
      await assignSupervisor(created, values.employeeId);
      const loginEmail =
        str((created as { loginEmail?: unknown })?.loginEmail) ||
        values.email.trim();
      const temporaryPassword =
        readTemporaryPassword(created) || firstNameFrom(values.name);
      if (temporaryPassword) {
        showCreatedCredentials({
          name: values.name.trim(),
          email: loginEmail,
          password: temporaryPassword,
        });
      }
      refetch();
      showToast("Member added", "success");
    } catch (error) {
      if (!isActivePlacementConflict(error)) {
        const message =
          error instanceof Error ? error.message : "Something went wrong";
        showToast(`Add member failed — ${message}`, "error");
        throw error;
      }

      let existingId = "";
      try {
        existingId = await findExistingInternId(values.email, values.phone);
      } catch {
        existingId = "";
      }

      if (!existingId) {
        showToast(
          "This email already has an active placement. Switch to All to find the existing member.",
          "error",
        );
        throw error;
      }

      if (manager) {
        await managerApi.updateNyscIntern(existingId, body);
      } else {
        await superAdminApi.nyscInterns.patch(existingId, body);
      }
      try {
        await assignSupervisor({ id: existingId }, values.employeeId);
      } catch {
        /* placement was updated even if supervisor assignment is unavailable */
      }
      refetch();
      showToast(
        "This person already had an active placement. Their details were updated.",
        "success",
      );
    }
  }

  return (
      <div className={styles.page}>
        <HideOnManager>
        <div className={styles.topBar}>
          <PageDateLabel className={styles.dateLabel} />
          {loading ? <p className={styles.dateLabel}>Loading placements…</p> : null}
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
            <p className={styles.eyebrow}>NYSC &amp; Intern Management</p>
            <h1 className={styles.title}>Supporting every placement</h1>
            <p className={styles.subtitle}>
              Manage NYSC members and interns, track progress, monitor exit dates,
              and process conversions.
            </p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add member
          </button>
        </div>

        <div className={styles.stats}>
          {placementStats.map((stat) => (
            <article key={stat.id} className={styles.statCard}>
              <div className={styles.statCopy}>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
              <span
                className={`${styles.badge} ${
                  stat.badge === "Alert"
                    ? styles.badgeAlert
                    : stat.badge === "Current"
                      ? styles.badgeCurrent
                      : styles.badgeActive
                }`}
              >
                {stat.badge}
              </span>
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

        <div className={styles.grid}>
          {filteredMembers.map((member) => (
            <article key={member.id} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.cardHead}>
                  <div className={styles.avatar}>{member.initials}</div>
                  <div>
                    <div className={styles.nameRow}>
                      <h2 className={styles.name}>{member.name}</h2>
                      <span className={styles.typeTag}>{member.type}</span>
                    </div>
                    <p className={styles.school}>{member.school}</p>
                  </div>
                </div>

                <div className={styles.meta}>
                  <p className={styles.metaLine}>
                    <span className={styles.metaLabel}>Dept: </span>
                    {member.department}
                    <span className={styles.metaDot}>·</span>
                    <span className={styles.metaLabel}>Supervisor: </span>
                    {member.supervisor}
                  </p>
                  <p className={styles.metaLine}>
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

              <Link
                href={portalHref(pathname, `/nysc-interns/${member.id}`)}
                className={styles.cardFooter}
              >
                View profile
                <ChevronRight size={14} strokeWidth={2.5} />
              </Link>
            </article>
          ))}

          {filteredMembers.length === 0 && (
            <div className={styles.empty}>No placements in this view.</div>
          )}
        </div>

        <SimpleModal
          open={addOpen}
          title="Add member"
          description="Register a new NYSC member or intern. Department and supervisor must come from the directory."
          fields={addMemberFields}
          submitLabel="Add member"
          wide
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddMember}
        />
      </div>
  );
}
