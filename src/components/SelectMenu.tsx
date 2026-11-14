"use client";

import { useId, useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useDropdown } from "./useDropdown";

export interface SelectOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Liste déroulante maison, même style que le menu de la page ménage, qui remplace un <select> natif.
 * Elle s'utilise dans un formulaire : un champ caché porte `name` et la valeur choisie, et `required`
 * bloque l'envoi tant que rien n'est choisi (le navigateur affiche son message habituel).
 */
export function SelectMenu({
  id,
  name,
  options,
  defaultValue = "",
  placeholder = "Choisir…",
  required = false,
  disabled = false,
  onChange,
}: {
  id?: string;
  name?: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const listId = useId();
  const { open, openUp, rootRef, triggerRef, toggle, close, onTriggerKeyDown, onMenuKeyDown } = useDropdown({ itemRole: "option", itemCount: options.length, itemHeight: 40, disabled });
  const selected = options.find((o) => o.value === value);
  const SelectedIcon = selected?.icon;

  return (
    <div ref={rootRef} className="relative">
      {name && (
        // Champ caché mais validable : il porte la valeur du formulaire, et `required` fonctionne
        // comme avec un <select> (un <input type="hidden"> ne serait jamais validé par le navigateur).
        <input
          name={name}
          value={value}
          required={required}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}

      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={onTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className="group flex w-full items-center gap-2.5 rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-ink)]/60 px-3.5 py-2.5 text-left text-sm outline-none transition hover:border-[var(--color-mauve)]/40 focus-visible:border-[var(--color-mauve)]/70 focus-visible:ring-4 focus-visible:ring-[var(--color-mauve)]/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {SelectedIcon && <SelectedIcon className="h-4 w-4 shrink-0 text-[var(--color-mauve-text)]" aria-hidden />}
        <span
          className={`flex-1 truncate ${
            selected ? "text-[var(--color-text-main)]" : "text-[var(--color-text-faint)] transition-colors group-hover:text-[var(--color-text-muted)]"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-text-faint)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          onKeyDown={onMenuKeyDown}
          className={`absolute inset-x-0 z-30 max-h-72 overflow-y-auto rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)] ${
            openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setValue(o.value);
                  onChange?.(o.value);
                  close(true);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-[var(--color-raised)] focus-visible:bg-[var(--color-raised)] ${
                  isSelected ? "text-[var(--color-mauve-text)]" : "text-[var(--color-text-main)]"
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isSelected ? "text-[var(--color-mauve-text)]" : "text-[var(--color-text-muted)]"}`}
                    aria-hidden
                  />
                )}
                <span className="flex-1 truncate">{o.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--color-mauve-text)]" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
