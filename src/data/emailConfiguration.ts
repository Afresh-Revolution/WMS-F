export type EmailDeliverySetting = {
  id: string;
  label: string;
  value: string;
};

export const emailServiceStatus = {
  provider: "Postmark",
  fromAddress: "no-reply@afresh.co",
  status: "Operational" as const,
};

export const emailDeliverySettings: EmailDeliverySetting[] = [
  { id: "provider", label: "Email provider", value: "Postmark" },
  { id: "from-name", label: "From name", value: "Afresh" },
  { id: "from-address", label: "From address", value: "no-reply@afresh.co" },
  { id: "smtp-host", label: "SMTP host", value: "smtp.postmark.io" },
  { id: "smtp-port", label: "SMTP port", value: "587" },
];
