"use client";

import { useState, useTransition, useRef } from "react";
import { Check, PackageCheck, Plus, UserPlus, X } from "lucide-react";
import { needItem, markBought, assignItem } from "./actions";
import { Avatar, EmptyState } from "@/components/ui";

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

function ListItemRowView({
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
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface)]/50">
      <button
        onClick={handleBuy}
        disabled={isPending}
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-[var(--color-hairline-strong)] text-transparent transition-colors hover:border-[var(--color-ok)] hover:bg-[var(--color-ok)]/15 hover:text-[var(--color-ok)] disabled:opacity-40"
        aria-label={`Marquer « ${item.name} » comme acheté`}
        title="Acheté"
      >
        <Check className="h-3.5 w-3.5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--color-text-main)]">{item.name}</p>
        <p className="text-[11px] text-[var(--color-text-faint)]">Ajouté par {item.author.displayName}</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowAssign((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors
            ${item.assignee
              ? "border-[var(--color-hairline-strong)] text-[var(--color-text-main)] hover:border-[var(--color-mauve)]/40"
              : "border-dashed border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:border-[var(--color-mauve)]/40 hover:text-[var(--color-text-main)]"
            }`}
        >
          {item.assignee ? (
            <>
              <Avatar name={item.assignee.displayName} color={item.assignee.color} size="xs" />
              {item.assignee.id === currentUserId ? "Moi" : item.assignee.displayName}
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Qui s'en charge ?</span>
            </>
          )}
        </button>

        {showAssign && (
          <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[170px] rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-1 shadow-2xl shadow-black/50">
            {colocs.map((c) => (
              <button
                key={c.id}
                onClick={() => handleAssign(c.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[var(--color-text-main)] transition-colors hover:bg-[var(--color-raised)]"
              >
                <Avatar name={c.displayName} color={c.color} size="xs" />
                {c.id === currentUserId ? "Moi" : c.displayName}
              </button>
            ))}
            {item.assignee && (
              <button
                onClick={() => handleAssign(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[var(--color-down)] transition-colors hover:bg-[var(--color-down)]/10"
              >
                <X className="h-3.5 w-3.5" /> Retirer
              </button>
            )}
          </div>
        )}
      </div>
    </li>
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
    <div className="flex flex-col gap-5">
      <form onSubmit={handleAdd} className="card flex gap-2 p-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Qu'est-ce qui manque ?"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] outline-none"
        />
        <button type="submit" disabled={isPending || !input.trim()} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </form>
      {error && <p className="text-xs text-[var(--color-down)]">{error}</p>}

      {active.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title="Tout est en stock"
          description="Ajoute ce qui manque avec le champ ci-dessus : les colocs le verront tout de suite."
        />
      ) : (
        <div>
          <p className="mb-2 text-xs text-[var(--color-text-muted)]">
            {active.length} article{active.length > 1 ? "s" : ""} à acheter · coche quand c'est fait
          </p>
          <ul className="card divide-y divide-[var(--color-hairline)]">
            {active.map((item) => (
              <ListItemRowView key={item.id} item={item} colocs={colocs} currentUserId={currentUserId} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
