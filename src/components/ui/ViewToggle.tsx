"use client";

import Link from "next/link";
import styles from "./ViewToggle.module.css";

export type ViewToggleOption<T extends string = string> = {
  id: T;
  label: string;
  href?: string;
};

export function ViewToggle<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  options: readonly ViewToggleOption<T>[];
  value: T;
  onChange?: (id: T) => void;
  "aria-label"?: string;
}) {
  return (
    <div className={styles.track} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.id === value;
        const className = `${styles.item} ${active ? styles.itemActive : ""}`;
        if (option.href) {
          return (
            <Link
              key={option.id}
              href={option.href}
              className={className}
              aria-current={active ? "page" : undefined}
            >
              {option.label}
            </Link>
          );
        }
        return (
          <button
            key={option.id}
            type="button"
            className={className}
            aria-pressed={active}
            onClick={() => onChange?.(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
