"use client";

import { FormEvent, Fragment, useEffect } from "react";
import styles from "./SimpleModal.module.css";

export type ModalField = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  group?: string;
  fullWidth?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  minLength?: number;
  maxLength?: number;
};

type SimpleModalProps = {
  open: boolean;
  title: string;
  description?: string;
  fields: ModalField[];
  submitLabel?: string;
  wide?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
};

export function SimpleModal({
  open,
  title,
  description,
  fields,
  submitLabel = "Save",
  wide = false,
  onClose,
  onSubmit,
}: SimpleModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    for (const field of fields) {
      values[field.name] = String(form.get(field.name) ?? "");
    }
    try {
      await Promise.resolve(onSubmit(values));
      onClose();
    } catch {
      /* toast handled by caller */
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={`${styles.modal} ${wide ? styles.modalWide : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.head}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        <form
          className={`${styles.form} ${wide ? styles.formWide : ""}`}
          onSubmit={handleSubmit}
        >
          {fields.map((field, index) => {
            const showGroup =
              Boolean(field.group) && field.group !== fields[index - 1]?.group;
            return (
              <Fragment key={field.name}>
                {showGroup ? (
                  <p className={styles.group}>{field.group}</p>
                ) : null}
                <label
                  className={`${styles.field} ${
                    field.fullWidth ? styles.fieldFull : ""
                  }`}
                >
                  <span>{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      defaultValue={field.defaultValue}
                      placeholder={field.placeholder}
                      required={field.required}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      rows={4}
                    />
                  ) : field.type === "select" ? (
                    <select
                      name={field.name}
                      defaultValue={field.defaultValue}
                      required={field.required}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.name}
                      type={field.type ?? "text"}
                      defaultValue={field.defaultValue}
                      placeholder={field.placeholder}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                    />
                  )}
                </label>
              </Fragment>
            );
          })}
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submit}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
