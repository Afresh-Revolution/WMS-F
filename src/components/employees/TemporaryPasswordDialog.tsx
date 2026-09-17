"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  clearCreatedCredentials,
  getCreatedCredentials,
  subscribeCreatedCredentials,
} from "@/lib/createdCredentials";

const overlayStyle: CSSProperties = {
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
  padding: 16,
  background: "rgba(28, 25, 23, 0.6)",
};

const cardStyle: CSSProperties = {
  position: "relative",
  width: "min(440px, calc(100vw - 32px))",
  padding: 24,
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
  color: "#1c1917",
};

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 20,
  fontWeight: 700,
};

const bodyStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "#57534e",
  fontSize: 14,
  lineHeight: 1.45,
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  margin: "0 0 20px",
  fontSize: 13,
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #d6d3d1",
  borderRadius: 8,
  background: "#fafaf9",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "0.02em",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const buttonStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  background: "#f5f5f4",
  color: "#44403c",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  border: "none",
};

export function TemporaryPasswordDialog() {
  const [credentials, setCredentials] = useState(getCreatedCredentials);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setCredentials(getCreatedCredentials());
    return subscribeCreatedCredentials(() => {
      setCredentials(getCreatedCredentials());
      setCopied(false);
    });
  }, []);

  useEffect(() => {
    if (!credentials) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      passwordRef.current?.focus();
      passwordRef.current?.select();
    }, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
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

  if (!mounted || !credentials) return null;

  return createPortal(
    <div style={overlayStyle} role="presentation">
      <div
        style={cardStyle}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="temporary-password-title"
      >
        <h2 id="temporary-password-title" style={titleStyle}>
          Temporary password
        </h2>
        <p style={bodyStyle}>
          {credentials.name || "This person"} was added
          {credentials.email ? ` (${credentials.email})` : ""}. Copy the
          password, then press Cancel. This modal stays until you cancel it.
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
          <button
            type="button"
            style={buttonStyle}
            onClick={() => void copyPassword()}
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            style={buttonStyle}
            onClick={clearCreatedCredentials}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
