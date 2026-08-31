"use client";

import { Menu, X } from "lucide-react";
import styles from "./MobileHeader.module.css";

type MobileHeaderProps = {
  open: boolean;
  onToggle: () => void;
};

export function MobileHeader({ open, onToggle }: MobileHeaderProps) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={onToggle}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <p className={styles.title}>Afresh WMS</p>
    </header>
  );
}
