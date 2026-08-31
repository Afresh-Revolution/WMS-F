export type ServiceStatus = "Operational" | "Degraded";

export type HealthService = {
  id: string;
  name: string;
  latency: string;
  status: ServiceStatus;
};

export type HealthMetric = {
  id: string;
  label: string;
  value: number;
};

export type HealthConfigItem = {
  id: string;
  label: string;
  status: ServiceStatus;
};

export const healthStats = [
  {
    id: "uptime",
    label: "Uptime",
    value: "99.9%",
    badge: "30 days",
  },
  {
    id: "services",
    label: "Services healthy",
    value: "5 / 6",
    badge: "1 degraded",
  },
  {
    id: "sessions",
    label: "Active sessions",
    value: "847",
    badge: "Live",
  },
  {
    id: "latency",
    label: "Avg API latency",
    value: "82 ms",
    badge: "Nominal",
  },
] as const;

export const healthServices: HealthService[] = [
  { id: "api", name: "API Server", latency: "82 ms", status: "Operational" },
  { id: "db", name: "Database", latency: "11 ms", status: "Operational" },
  { id: "email", name: "Email Service", latency: "140 ms", status: "Operational" },
  { id: "storage", name: "File Storage", latency: "628 ms", status: "Degraded" },
  {
    id: "notifications",
    name: "Notification Worker",
    latency: "95 ms",
    status: "Operational",
  },
  { id: "jobs", name: "Background Jobs", latency: "—", status: "Operational" },
];

export const healthInfrastructure: HealthMetric[] = [
  { id: "cpu", label: "CPU load", value: 38 },
  { id: "disk", label: "Disk usage", value: 61 },
  { id: "memory", label: "Memory", value: 54 },
];

export const healthConfiguration: HealthConfigItem[] = [
  { id: "email", label: "Email service", status: "Operational" },
  { id: "notifications", label: "Notification service", status: "Operational" },
  { id: "maintenance", label: "Maintenance mode", status: "Operational" },
];
