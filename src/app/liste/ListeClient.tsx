"use client";

import { useState, useTransition, useRef } from "react";
import { needItem, markBought, assignItem, deleteItem } from "./actions";

export interface ListItemRow {
  id: string;
  name: string;
  needed: boolean;
  boughtAt: Date | null;
  assignee: { id: string; displayName: string; color: string } | null;
  author: { id: string; displayName: string };
}

export interface ColocRow {
  id: string;
  displayName: string;
  color: string;
}

function Avatar({ displayName, color, size = "sm" }: { displayName: string; color: string; size?: "sm" | "xs" }) {
  const dim = size === "xs" ? "h-5 w-5 text-[9px] rounded" : "h-7 w-7 text-xs rounded-lg";
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center font-bold text-white ${dim}`}
      style={{ backgroundColor: color }}
    >
      {displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ListItemCard({
  item,
  colocs,
  currentUserId,
}: {
  item: ListItemRow;
  colocs: ColocRow[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [bought, setBought] = useState(!!item.boughtAt);
  const [showAssign, setShowAssign] = useState(false);

  if (bought) return null;

  function handleBuy() {
    setBought(true);
    startTransition(() => { void markBought(item.id); });
  }

  function handleAssign(assigneeId: string | null) {
    setShowAssign(false);
    startTransition(() => { void assignItem(item.id, assigneeId); });
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-hairline)]
      bg-[var(--color-raised)] px-4 py-3 transition-all hover:border-[var(--color-hairline-strong)]">
      {/* Bouton cocher */}
      <button
        onClick={handleBuy}
        disabled={isPending}
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full
          border-2 border-[var(--color-hairline-strong)] transition-colors
          hover:border-[var(--color-ok)] hover:bg-[var(--color-ok)]/10 disabled:opacity-40"
        aria-label="Marquer comme acheté"
      />

      {/* Nom */}
      <span className="flex-1 text-sm text-[var(--color-text-main)]">{item.name}</span>

      {/* Assigné */}
      <div className="relative">
        <button
          onClick={() => setShowAssign((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-hairline-strong)]
            px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors
            hover:border-[var(--color-mauve)]/40 hover:text-[var(--color-text-main)]"
        >
          {item.assignee ? (
            <>
              <Avatar displayName={item.assignee.displayName} color={item.assignee.color} size="xs" />
              <span>{item.assignee.displayName}</span>
            </>
          ) : (
            <span>+ Qui s'en charge ?</span>
          )}
        </button>

        {showAssign && (
          <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-xl border
            border-[var(--color-hairline-strong)] bg-[var(--color-raised)] p-1 shadow-lg">
            {colocs.map((c) => (
              <button
                key={c.id}
                onClick={() => handleAssign(c.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs
                  text-[var(--color-text-main)] transition-colors hover:bg-[var(--color-glass)]"
              >
                <Avatar displayName={c.displayName} color={c.color} size="xs" />
                {c.id === currentUserId ? "Moi" : c.displayName}
              </button>
            ))}
            {item.assignee && (
              <button
                onClick={() => handleAssign(null)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs
                  text-red-400 transition-colors hover:bg-red-500/10"
              >
                Retirer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ListeClient({
  items,
  colocs,
  currentUserId,
}: {
  items: ListItemRow[];
  colocs: ColocRow[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = items.filter((i) => !i.boughtAt);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;
    setError(null);
    startTransition(async () => {
      const res = await needItem(val);
      if (res.ok) {
        setInput("");
        inputRef.current?.focus();
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Formulaire ajout rapide */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Il manque… (PQ, liquide vaisselle…)"
          className="flex-1 rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none transition focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="rounded-xl bg-[var(--color-mauve)] px-4 py-2.5 text-sm font-semibold text-white
            transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "…" : "Il en faut"}
        </button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Liste */}
      {active.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] px-5 py-8 text-center">
          <p className="text-2xl">✓</p>
          <p className="mt-2 text-sm font-medium text-[var(--color-text-main)]">Tout est en stock</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Ajoute ce qui manque avec le champ ci-dessus.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((item) => (
            <ListItemCard key={item.id} item={item} colocs={colocs} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {/* Compteur */}
      {active.length > 0 && (
        <p className="text-right text-xs text-[var(--color-text-muted)]">
          {active.length} item{active.length > 1 ? "s" : ""} manquant{active.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
