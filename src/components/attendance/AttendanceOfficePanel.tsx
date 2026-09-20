"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { SimpleModal } from "@/components/ui/SimpleModal";
import { usePageActions } from "@/hooks/usePageActions";
import { attendanceApi } from "@/lib/api";
import type { MappedAttendanceLocation } from "@/lib/api/attendanceMappers";
import styles from "./AttendancePage.module.css";

type DepartmentOption = { id: string; name: string };

function locationWriteBody(values: Record<string, string>) {
  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }
  const radiusMeters = Math.min(
    5000,
    Math.max(1, Number(values.radiusMeters) || 3000),
  );
  const body: Record<string, unknown> = {
    name: values.name.trim(),
    address: values.address.trim(),
    latitude,
    longitude,
    radiusMeters,
    timezone: values.timezone.trim() || "Africa/Lagos",
  };
  if (values.departmentId) body.departmentId = values.departmentId;
  return body;
}

export function AttendanceOfficePanel({
  locations,
  departments,
  onChanged,
}: {
  locations: MappedAttendanceLocation[];
  departments: DepartmentOption[];
  onChanged: () => void;
}) {
  const { runAction } = usePageActions();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MappedAttendanceLocation | null>(null);

  const fields = useMemo(
    () => [
      {
        name: "name",
        label: "Office name",
        required: true,
        defaultValue: editing?.name ?? "",
        placeholder: "Lagos Office",
      },
      {
        name: "address",
        label: "Address",
        defaultValue: editing?.address ?? "",
        placeholder: "Victoria Island, Lagos",
      },
      {
        name: "latitude",
        label: "Latitude",
        type: "number" as const,
        required: true,
        step: "any",
        defaultValue: editing?.latitude != null ? String(editing.latitude) : "",
        placeholder: "6.5244",
      },
      {
        name: "longitude",
        label: "Longitude",
        type: "number" as const,
        required: true,
        step: "any",
        defaultValue: editing?.longitude != null ? String(editing.longitude) : "",
        placeholder: "3.3792",
      },
      {
        name: "radiusMeters",
        label: "Radius (metres)",
        type: "number" as const,
        min: 1,
        max: 5000,
        defaultValue: String(editing?.radiusMeters || 3000),
      },
      {
        name: "timezone",
        label: "Timezone",
        defaultValue: editing?.timezone || "Africa/Lagos",
      },
      {
        name: "departmentId",
        label: "Department (optional)",
        type: "select" as const,
        defaultValue: editing?.departmentId ?? "",
        options: [
          { label: "Company-wide", value: "" },
          ...departments.map((department) => ({
            label: department.name,
            value: department.id,
          })),
        ],
      },
    ],
    [departments, editing],
  );

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(location: MappedAttendanceLocation) {
    setEditing(location);
    setOpen(true);
  }

  async function handleSubmit(values: Record<string, string>) {
    const body = locationWriteBody(values);
    await runAction(
      editing ? "Update office location" : "Create office location",
      async () => {
        if (editing?.id) {
          await attendanceApi.locations.patch(editing.id, body);
        } else {
          await attendanceApi.locations.create(body);
        }
        onChanged();
      },
      editing ? "Office pin updated" : "Office location created",
    );
  }

  async function toggleLocation(location: MappedAttendanceLocation) {
    await runAction(
      location.active ? "Disable office location" : "Enable office location",
      async () => {
        if (location.active) {
          await attendanceApi.locations.disable(location.id);
        } else {
          await attendanceApi.locations.enable(location.id);
        }
        onChanged();
      },
      location.active ? "Office disabled" : "Office enabled",
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelIcon} aria-hidden>
          <MapPin size={14} />
        </span>
        <h2 className={styles.panelTitle}>Check-in locations</h2>
        <button type="button" className={styles.ghostButton} onClick={openCreate}>
          <Plus size={14} />
          Add office
        </button>
      </div>
      <p className={styles.settingsNote}>
        Create a GPS pin for each office. Right-click the building in Google Maps
        to copy latitude and longitude. Default radius is 3000 m (max 5000 m).
        Remote/Onsite on an employee profile is not a geofence. Check-in cannot
        succeed until an office pin and a schedule that attaches it both exist.
      </p>
      {locations.length === 0 ? (
        <p className={styles.emptyCopy}>
          No GPS locations yet. Add an office pin, then attach it to the work
          schedule.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Coordinates</th>
                <th>Radius</th>
                <th>Scope</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td>{location.name}</td>
                  <td className={styles.muted}>{location.address || "—"}</td>
                  <td className={styles.muted}>
                    {location.latitude != null && location.longitude != null
                      ? `${location.latitude}, ${location.longitude}`
                      : "—"}
                  </td>
                  <td>{location.radiusMeters} m</td>
                  <td className={styles.muted}>
                    {departments.find((item) => item.id === location.departmentId)
                      ?.name || "Company-wide"}
                  </td>
                  <td>{location.active ? "Active" : "Disabled"}</td>
                  <td>
                    <div className={styles.inlineActions}>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() => openEdit(location)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() => void toggleLocation(location)}
                      >
                        {location.active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <SimpleModal
        open={open}
        title={editing ? "Edit office location" : "Add office location"}
        description="The phone never decides that someone is at the office. The server measures GPS distance to this pin."
        fields={fields}
        submitLabel={editing ? "Save pin" : "Create office"}
        wide
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
