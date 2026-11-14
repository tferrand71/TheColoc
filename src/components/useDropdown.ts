"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// Marge minimale au bord bas de l'écran, et hauteur maximale d'un menu (= max-h-72).
const EDGE_MARGIN = 16;
const MENU_MAX_HEIGHT = 288;
const MENU_CHROME = 44; // titre éventuel + marges internes

/** Place déjà prise en bas de l'écran par la barre de navigation fixe (visible seulement en mobile). */
function bottomReservedSpace(): number {
  const nav = document.querySelector<HTMLElement>("nav.fixed.bottom-0");
  if (!nav || getComputedStyle(nav).display === "none") return EDGE_MARGIN;
  return nav.getBoundingClientRect().height + EDGE_MARGIN;
}

interface Options {
  /** Rôle ARIA des lignes du menu : « menuitem » (actions) ou « option » (choix d'une valeur). */
  itemRole: "menuitem" | "option";
  itemCount: number;
  /** Hauteur approximative d'une ligne, pour décider si le menu s'ouvre vers le haut ou vers le bas. */
  itemHeight: number;
  disabled?: boolean;
}

/**
 * Comportement commun des menus déroulants maison (MoveWeek, SelectMenu) : ouverture et fermeture,
 * fermeture au clic extérieur, placement vers le haut quand il manque de la place en bas, et clavier
 * (↑ ↓ Début Fin pour naviguer, Échap pour fermer). Le rendu reste à la charge du composant.
 */
export function useDropdown({ itemRole, itemCount, itemHeight, disabled = false }: Options) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemSelector = `[role="${itemRole}"]`;

  // Fermeture au clic ou au toucher en dehors du menu
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // À l'ouverture, le focus va sur la ligne choisie (ou sur la première) pour naviguer au clavier
  useEffect(() => {
    if (!open || !rootRef.current) return;
    const target =
      rootRef.current.querySelector<HTMLElement>(`${itemSelector}[aria-selected="true"]`) ??
      rootRef.current.querySelector<HTMLElement>(itemSelector);
    target?.focus();
  }, [open, itemSelector]);

  /** Ferme le menu ; `restoreFocus` rend le focus au bouton (clavier). */
  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function toggle() {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const needed = Math.min(MENU_MAX_HEIGHT, itemCount * itemHeight + MENU_CHROME);
      const spaceBelow = window.innerHeight - rect.bottom - bottomReservedSpace();
      setOpenUp(spaceBelow < needed && rect.top > spaceBelow);
    }
    setOpen((o) => !o);
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" && !open && !disabled) {
      e.preventDefault();
      toggle();
    }
  }

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(itemSelector));
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focus = (i: number) => items[(i + items.length) % items.length]?.focus();

    switch (e.key) {
      case "ArrowDown": e.preventDefault(); focus(index + 1); break;
      case "ArrowUp": e.preventDefault(); focus(index - 1); break;
      case "Home": e.preventDefault(); focus(0); break;
      case "End": e.preventDefault(); focus(items.length - 1); break;
      case "Escape": e.preventDefault(); close(true); break;
      case "Tab": setOpen(false); break;
    }
  }

  return { open, openUp, rootRef, triggerRef, toggle, close, onTriggerKeyDown, onMenuKeyDown };
}
