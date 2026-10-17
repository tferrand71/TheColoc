"use client";

import { useState, useTransition, useRef } from "react";
import { addProjectItem, markProjectItemDone, addComment, setProjectStatus } from "../actions";

export interface ProjectItemRow {
  id: string;
  name: string;
  boughtAt: Date | null;
}

export interface CommentRow {
  id: string;
  body: string;
  createdAt: Date;
  author: { displayName: string; color: string };
}

type ProjectStatus = "IDEA" | "IN_PROGRESS" | "DONE";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "IDEA", label: "Idée" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminé" },
];

const STATUS_COLOR: Record<ProjectStatus, string> = {
  IDEA:        "text-[var(--color-mauve-text)]",
  IN_PROGRESS: "text-[var(--color-warn)]",
  DONE:        "text-[var(--color-ok)]",
};

function Avatar({ displayName, color }: { displayName: string; color: string }) {
  return (
    <div
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ItemsList({ projectId, initialItems }: { projectId: string; initialItems: ProjectItemRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;
    startTransition(async () => {
      const res = await addProjectItem(projectId, val);
      if (res.ok) {
        setItems((prev) => [...prev, { id: crypto.randomUUID(), name: val, boughtAt: null }]);
        setInput("");
      }
    });
  }

  function handleDone(itemId: string) {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, boughtAt: new Date() } : i));
    startTransition(() => { void markProjectItemDone(itemId); });
  }

  const active = items.filter((i) => !i.boughtAt);
  const done = items.filter((i) => i.boughtAt);

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ajouter un item…"
          className="flex-1 rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-3 py-2 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="rounded-xl bg-[var(--color-mauve)] px-3 py-2 text-sm font-semibold text-white
            transition hover:bg-[#7c3aed] disabled:opacity-40"
        >
          +
        </button>
      </form>

      {active.length === 0 && done.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">Pas encore d'items.</p>
      )}

      <div className="flex flex-col gap-1.5">
        {active.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border
            border-[var(--color-hairline)] bg-[var(--color-raised)] px-3 py-2.5">
            <button
              onClick={() => handleDone(item.id)}
              className="flex h-4 w-4 flex-shrink-0 rounded-full border-2 border-[var(--color-hairline-strong)]
                transition-colors hover:border-[var(--color-ok)] hover:bg-[var(--color-ok)]/10"
            />
            <span className="text-sm text-[var(--color-text-main)]">{item.name}</span>
          </div>
        ))}
        {done.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2 opacity-40">
            <span className="text-xs text-[var(--color-ok)]">✓</span>
            <span className="text-sm line-through text-[var(--color-text-muted)]">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentSection({ projectId, initialComments }: { projectId: string; initialComments: CommentRow[] }) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = body.trim();
    if (!val) return;
    startTransition(async () => {
      const res = await addComment(projectId, val);
      if (res.ok) {
        setComments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            body: val,
            createdAt: new Date(),
            author: { displayName: "Toi", color: "#6366f1" },
          },
        ]);
        setBody("");
        textareaRef.current?.focus();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">Pas encore de commentaires.</p>
      )}

      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar displayName={c.author.displayName} color={c.author.color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-main)]">{c.author.displayName}</span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-text-main)]">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } }}
          rows={2}
          placeholder="Ajouter un commentaire… (Entrée pour envoyer)"
          className="w-full resize-none rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-3 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="self-end rounded-xl bg-[var(--color-mauve)] px-4 py-1.5 text-sm font-semibold text-white
            transition hover:bg-[#7c3aed] disabled:opacity-40"
        >
          {isPending ? "Envoi…" : "Commenter"}
        </button>
      </form>
    </div>
  );
}

export function ProjectDetail({
  projectId,
  status: initialStatus,
  items,
  comments,
}: {
  projectId: string;
  status: ProjectStatus;
  items: ProjectItemRow[];
  comments: CommentRow[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(s: ProjectStatus) {
    setStatus(s);
    startTransition(() => { void setProjectStatus(projectId, s); });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sélecteur de statut */}
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusChange(opt.value)}
            disabled={isPending}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors
              ${status === opt.value
                ? `border-current ${STATUS_COLOR[opt.value]} bg-current/10`
                : "border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Layout desktop : 2 colonnes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Items */}
        <div className="flex flex-col gap-3">
          <h2 className="eyebrow">Items</h2>
          <ItemsList projectId={projectId} initialItems={items} />
        </div>

        {/* Commentaires */}
        <div className="flex flex-col gap-3">
          <h2 className="eyebrow">Discussion</h2>
          <CommentSection projectId={projectId} initialComments={comments} />
        </div>
      </div>
    </div>
  );
}
