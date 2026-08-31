import type { LucideIcon } from "lucide-react";
import { Clock3, KeyRound, Lock, Wrench } from "lucide-react";

export type SecuritySetting = {
  id: string;
  label: string;
  description: string;
  value: string;
};

export type SecuritySection = {
  id: string;
  title: string;
  description: string;
  settings: SecuritySetting[];
};

export type SecuritySummary = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
};

export const securitySections: SecuritySection[] = [
  {
    id: "password",
    title: "Password rules",
    description: "Requirements enforced on every account.",
    settings: [
      {
        id: "min-length",
        label: "Minimum password length",
        description: "Least number of characters allowed.",
        value: "10 chars",
      },
      {
        id: "require-symbol",
        label: "Require a symbol",
        description: "Passwords must contain a special character.",
        value: "Enabled",
      },
      {
        id: "require-number",
        label: "Require a number",
        description: "Passwords must contain at least one digit.",
        value: "Enabled",
      },
      {
        id: "require-mfa",
        label: "Require multi-factor authentication",
        description: "All users must set up MFA at next sign-in.",
        value: "Disabled",
      },
    ],
  },
  {
    id: "lockout",
    title: "Account lockout",
    description: "Protects accounts from brute-force attempts.",
    settings: [
      {
        id: "failed-attempts",
        label: "Failed attempts before lockout",
        description: "Consecutive failures that trigger a lock.",
        value: "5 attempts",
      },
      {
        id: "lockout-duration",
        label: "Lockout duration",
        description: "How long an account stays locked.",
        value: "30 mins",
      },
    ],
  },
  {
    id: "sessions",
    title: "Login sessions",
    description: "Controls how long a session stays active.",
    settings: [
      {
        id: "session-timeout",
        label: "Session timeout",
        description: "Idle time before users are signed out.",
        value: "60 mins",
      },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance",
    description: "Temporarily take the platform offline for all non-Super Admin users.",
    settings: [
      {
        id: "maintenance-mode",
        label: "Maintenance mode",
        description: "When enabled, only Super Admins can sign in.",
        value: "Disabled",
      },
    ],
  },
];

export const securitySummaries: SecuritySummary[] = [
  {
    id: "password-policy",
    label: "Password policy",
    value: "10+ chars",
    icon: KeyRound,
  },
  {
    id: "lockout-after",
    label: "Lockout after",
    value: "5 tries",
    icon: Lock,
  },
  {
    id: "session-timeout",
    label: "Session timeout",
    value: "60 min",
    icon: Clock3,
  },
  {
    id: "maintenance",
    label: "Maintenance",
    value: "Off",
    icon: Wrench,
  },
];
