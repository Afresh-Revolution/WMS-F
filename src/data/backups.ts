export type BackupPolicySetting = {
  id: string;
  label: string;
  value: string;
  description?: string;
};

export type BackupSnapshot = {
  id: string;
  title: string;
  status: "Completed";
  kind: "Scheduled" | "Manual";
  size: string;
  takenAt: string;
};

export const backupStats = [
  {
    id: "schedule",
    label: "Backup schedule",
    value: "02:00",
    badge: "Nightly",
  },
  {
    id: "retention",
    label: "Retention",
    value: "30d",
    badge: "Rolling",
  },
  {
    id: "snapshots",
    label: "Snapshots stored",
    value: "3",
    badge: "Available",
  },
] as const;

export const backupPolicySettings: BackupPolicySetting[] = [
  {
    id: "schedule",
    label: "Schedule",
    value: "Nightly · 02:00",
  },
  {
    id: "retention",
    label: "Retention",
    value: "30 days",
    description: "Snapshots older than this are removed.",
  },
  {
    id: "destination",
    label: "Destination",
    value: "Encrypted cloud (eu-west)",
  },
];

export const backupSnapshots: BackupSnapshot[] = [
  {
    id: "snap-1",
    title: "Automatic nightly backup",
    status: "Completed",
    kind: "Scheduled",
    size: "2.4 GB",
    takenAt: "Aug 3, 2:00 AM",
  },
  {
    id: "snap-2",
    title: "Automatic nightly backup",
    status: "Completed",
    kind: "Scheduled",
    size: "2.4 GB",
    takenAt: "Aug 2, 2:00 AM",
  },
  {
    id: "snap-3",
    title: "Pre-migration snapshot",
    status: "Completed",
    kind: "Manual",
    size: "2.4 GB",
    takenAt: "Jul 30, 6:30 PM",
  },
];
