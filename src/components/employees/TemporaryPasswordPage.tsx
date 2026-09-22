"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearCreatedCredentials,
  getCreatedCredentials,
  subscribeCreatedCredentials,
} from "@/lib/createdCredentials";
import { portalHref } from "@/lib/portalPaths";

const pageStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100vw",
  height: "100dvh",
  zIndex: 2147483646,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "#faf7f2",
};

const cardStyle: CSSProperties = {
  width: "min(480px, calc(100vw - 48px))",
  padding: 32,
  borderRadius: 20,
  background: "#fff",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.16)",
  color: "#1c1917",
};

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 28,
  fontWeight: 700,
};

const bodyStyle: CSSProperties = {
  margin: "0 0 20px",
  color: "#57534e",
  fontSize: 15,
  lineHeight: 1.5,
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  margin: "0 0 24px",
  fontSize: 13,
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #d6d3d1",
  borderRadius: 10,
  background: "#fafaf9",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: "0.03em",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const buttonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: 10,
  background: "#f5f5f4",
  color: "#44403c",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  border: "none",
};

export function TemporaryPasswordPage() {
  const router = useRouter();
  const pathname = usePathname();
  const employeesHref = portalHref(pathname, "/employees");
  const [ready, setReady] = useState(false);
  const [credentials, setCredentials] = useState<ReturnType<typeof getCreatedCredentials>>(null);
  const [copied, setCopied] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCredentials(getCreatedCredentials());
    setReady(true);
    return subscribeCreatedCredentials(() => {
      setCredentials(getCreatedCredentials());
      setCopied(false);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!credentials) router.replace(employeesHref);
  }, [ready, credentials, router, employeesHref]);

  useEffect(() => {
    if (!credentials) return;
    passwordRef.current?.focus();
    passwordRef.current?.select();
  }, [credentials]);

  async function copyPassword() {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.password);
    } catch {
      passwordRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
  }

  function cancel() {
    clearCreatedCredentials();
    router.replace(employeesHref);
  }

  if (!ready || !credentials) return null;

  return (
    <div style={pageStyle}>
      <div style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="temporary-password-title">
        <h1 id="temporary-password-title" style={titleStyle}>
          Temporary password
        </h1>
        <p style={bodyStyle}>
          {credentials.name || "This person"} was added
          {credentials.email ? ` (${credentials.email})` : ""}. This page stays
          here until you copy the password and press Cancel.
        </p>
        <label style={labelStyle}>
          Password
          <input
            ref={passwordRef}
            style={inputStyle}
            readOnly
            value={credentials.password}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <div style={actionsStyle}>
          <button type="button" style={buttonStyle} onClick={() => void copyPassword()}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" style={buttonStyle} onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
