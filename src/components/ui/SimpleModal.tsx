"use client";

import { FormEvent, Fragment, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import styles from "./SimpleModal.module.css";

export type ModalField = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "time" | "textarea" | "select";
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
  rows?: number;
};

type SimpleModalProps = {
  open: boolean;
  title: string;
  description?: string;
  fields: ModalField[];
  submitLabel?: string;
  submitIcon?: boolean;
  secondaryLabel?: string;
  hideCancel?: boolean;
  showClose?: boolean;
  wide?: boolean;
  appearance?: "default" | "soft";
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  onSecondary?: (values: Record<string, string>) => void | Promise<void>;
};

export function SimpleModal({
  open,
  title,
  description,
  fields,
  submitLabel = "Save",
  submitIcon = false,
  secondaryLabel,
  hideCancel = false,
  showClose = false,
  wide = false,
  appearance = "default",
  onClose,
  onSubmit,
  onSecondary,
}: SimpleModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
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

  function markEmpty(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  ) {
    if (element.value) element.removeAttribute("data-empty");
    else element.setAttribute("data-empty", "");
  }

  function readValues(form: HTMLFormElement) {
    const data = new FormData(form);
    const values: Record<string, string> = {};
    for (const field of fields) {
      values[field.name] = String(data.get(field.name) ?? "");
    }
    return values;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await Promise.resolve(onSubmit(readValues(event.currentTarget)));
      onClose();
    } catch {
      /* toast handled by caller */
    }
  }

  async function handleSecondary() {
    const form = formRef.current;
    if (!form || !onSecondary) return;
    if (!form.reportValidity()) return;
    try {
      await Promise.resolve(onSecondary(readValues(form)));
      onClose();
    } catch {
      /* toast handled by caller */
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={`${styles.modal} ${wide ? styles.modalWide : ""} ${
          appearance === "soft" ? styles.modalSoft : ""
        }`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.head}>
          <div className={styles.headRow}>
            <div className={styles.headCopy}>
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
              {description ? (
                <p className={styles.description}>{description}</p>
              ) : null}
            </div>
            {showClose ? (
              <button
                type="button"
                className={styles.close}
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>
        <form
          ref={formRef}
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
                      rows={field.rows ?? 3}
                      data-empty={!field.defaultValue || undefined}
                      onInput={(event) => markEmpty(event.currentTarget)}
                    />
                  ) : field.type === "select" ? (
                    <select
                      name={field.name}
                      defaultValue={field.defaultValue}
                      required={field.required}
                      data-empty={!field.defaultValue || undefined}
                      onInput={(event) => markEmpty(event.currentTarget)}
                      onChange={(event) => markEmpty(event.currentTarget)}
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
                      data-empty={!field.defaultValue || undefined}
                      onInput={(event) => markEmpty(event.currentTarget)}
                    />
                  )}
                </label>
              </Fragment>
            );
          })}
          <div className={styles.actions}>
            {hideCancel ? null : (
              <button type="button" className={styles.cancel} onClick={onClose}>
                Cancel
              </button>
            )}
            {secondaryLabel && onSecondary ? (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => void handleSecondary()}
              >
                {secondaryLabel}
              </button>
            ) : null}
            <button type="submit" className={styles.submit}>
              {submitIcon ? <Plus size={16} strokeWidth={2.5} /> : null}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
