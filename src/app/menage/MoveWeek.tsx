"use client";

import { useId } from "react";
import { ArrowLeftRight, ChevronDown, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useDropdown } from "@/components/useDropdown";

export interface MoveTarget {
  id: string;
  /** Texte brut « Prénom · 21 nov. – 27 nov. » : repli quand le détail ci-dessous manque. */
  label: string;
  name?: string;
  color?: string;
  range?: string;
}

/**
 * Menu « Déplacer vers une autre semaine » (administrateur) : échange la personne de cette semaine
 * avec celle de la semaine choisie. Remplace un <select> natif pour montrer l'avatar, le prénom et
 * les dates de chaque semaine. Le comportement (clavier, placement…) vient de useDropdown.
 */
export function MoveWeek({
  targets,
  disabled,
  error,
  onMove,
}: {
  targets: MoveTarget[];
  disabled: boolean;
  error: string | null;
  onMove: (id: string) => void;
}) {
  const menuId = useId();
  const empty = targets.length === 0;
  const inactive = disabled || empty;
  const { open, openUp, rootRef, triggerRef, toggle, close, onTriggerKeyDown, onMenuKeyDown } = useDropdown({ itemRole: "menuitem", itemCount: targets.length, itemHeight: 52, disabled: inactive });

  return (
    <div className="flex flex-col gap-1.5 border-t border-[var(--color-hairline)] pt-3">
      <p className="label">Déplacer vers une autre semaine</p>

      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          onKeyDown={onTriggerKeyDown}
          disabled={inactive}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          className="group flex w-full items-center gap-2.5 rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-ink)]/60 px-3 py-2 text-left text-sm outline-none transition hover:border-[var(--color-mauve)]/40 focus-visible:border-[var(--color-mauve)]/70 focus-visible:ring-4 focus-visible:ring-[var(--color-mauve)]/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-mauve)]/10 text-[var(--color-mauve-text)]">
            {disabled ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
          </span>
          <span className="flex-1 truncate text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-main)]">
            {disabled ? "Échange en cours…" : empty ? "Aucune autre semaine à échanger" : "Choisir une semaine…"}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--color-text-faint)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {open && (
          <div
            id={menuId}
            role="menu"
            aria-label="Échanger avec une autre semaine"
            onKeyDown={onMenuKeyDown}
            className={`absolute inset-x-0 z-30 max-h-72 overflow-y-auto rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)] ${
              openUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            <p className="eyebrow px-2.5 pb-1.5 pt-1">Échanger avec…</p>
            {targets.map((t) => (
              <button
                key={t.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  onMove(t.id);
                }}
                className="group/item flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-[var(--color-raised)] focus-visible:bg-[var(--color-raised)]"
              >
                {t.name && t.color && <Avatar name={t.name} color={t.color} size="sm" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[var(--color-text-main)]">{t.name ?? t.label}</span>
                  {t.range && <span className="block text-[11px] text-[var(--color-text-muted)]">{t.range}</span>}
                </span>
                <ArrowLeftRight
                  className="h-3.5 w-3.5 shrink-0 text-[var(--color-mauve-text)] opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
                  aria-hidden
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-[var(--color-down)]">{error}</p>}
    </div>
  );
}
