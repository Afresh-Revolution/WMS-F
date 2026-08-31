export type NotificationChannel = {
  id: string;
  label: string;
  value: string;
};

export type NotificationPreference = {
  id: string;
  label: string;
  description: string;
  value: string;
};

export const notificationServiceStatus = {
  label: "Notification service",
  description: "Delivers approvals, reminders and system alerts",
  status: "Operational" as const,
};

export const notificationChannels: NotificationChannel[] = [
  { id: "in-app", label: "In-app notifications", value: "Enabled" },
  { id: "email", label: "Email notifications", value: "Enabled" },
  { id: "sms", label: "SMS notifications", value: "Disabled" },
];

export const notificationPreferences: NotificationPreference[] = [
  {
    id: "daily-digest",
    label: "Daily digest",
    description: "Send a single summary each morning instead of per-event emails.",
    value: "Enabled",
  },
  {
    id: "quiet-hours",
    label: "Quiet hours",
    description: "Non-urgent notifications are held during this window.",
    value: "20:00 – 07:00",
  },
];
