"use client";

import { useState, useTransition, useRef } from "react";
import { Check, Lightbulb, Loader, MessageSquare, Plus, Send, CircleCheck } from "lucide-react";
import { addProjectItem, markProjectItemDone, addComment, setProjectStatus } from "../actions";
import { Avatar, SectionTitle } from "@/components/ui";

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

const STATUS_OPTIONS = [
  { value: "IDEA", label: "Idée", icon: Lightbulb },
  { value: "IN_PROGRESS", label: "En cours", icon: Loader },
  { value: "DONE", label: "Terminé", icon: CircleCheck },
] as const;

const STATUS_ACTIVE: Record<ProjectStatus, string> = {
  IDEA:        "bg-[var(--color-mauve)]/15 text-[var(--color-mauve-text)] ring-[var(--color-mauve)]/30",
  IN_PROGRESS: "bg-[var(--color-pink)]/15 text-[var(--color-pink-text)] ring-[var(--color-pink)]/30",
  DONE:        "bg-[var(--color-ok)]/15 text-[var(--color-ok)] ring-[var(--color-ok)]/30",
};

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
    <div className="card overflow-hidden">
      <form onSubmit={handleAdd} className="flex gap-2 border-b border-[var(--color-hairline)] p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ajouter une tâche ou un achat…"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] outline-none"
        />
        <button type="submit" disabled={isPending || !input.trim()} className="btn btn-secondary btn-sm" aria-label="Ajouter">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      {items.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">Aucune tâche pour l'instant.</p>
      )}

      <ul className="divide-y divide-[var(--color-hairline)]">
        {active.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => handleDone(item.id)}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-[var(--color-hairline-strong)] text-transparent transition-colors hover:border-[var(--color-ok)] hover:bg-[var(--color-ok)]/15 hover:text-[var(--color-ok)]"
              aria-label={`Marquer « ${item.name} » comme fait`}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm text-[var(--color-text-main)]">{item.name}</span>
          </li>
        ))}
        {done.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[var(--color-ok)]/15 text-[var(--color-ok)]">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm text-[var(--color-text-faint)] line-through">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentSection({
  projectId,
  initialComments,
  me,
}: {
  projectId: string;
  initialComments: CommentRow[];
  me: { displayName: string; color: string };
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const val = body.trim();
    if (!val) return;
    startTransition(async () => {
      const res = await addComment(projectId, val);
      if (res.ok) {
        setComments((prev) => [
          ...prev,
          { id: crypto.randomUUID(), body: val, createdAt: new Date(), author: me },
        ]);
        setBody("");
        textareaRef.current?.focus();
      }
    });
  }

  return (
    <div className="card flex flex-col">
      <div className="flex flex-col gap-5 p-5">
        {comments.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <MessageSquare className="h-4 w-4" /> Pas encore de commentaire.
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.author.displayName} color={c.author.color} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-[var(--color-text-main)]">{c.author.displayName}</span>
                <span className="text-[11px] text-[var(--color-text-faint)]">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-muted)]">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-[var(--color-hairline)] p-3">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          rows={1}
          placeholder="Écrire un commentaire…"
          className="input resize-none"
        />
        <button type="submit" disabled={isPending || !body.trim()} className="btn btn-primary px-3" aria-label="Envoyer">
          <Send className="h-4 w-4" />
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
  me,
}: {
  projectId: string;
  status: ProjectStatus;
  items: ProjectItemRow[];
  comments: CommentRow[];
  me: { displayName: string; color: string };
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(s: ProjectStatus) {
    setStatus(s);
    startTransition(() => { void setProjectStatus(projectId, s); });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="inline-flex w-fit gap-1 rounded-xl border border-[var(--color-hairline)] bg-[var(--color-raised)] p-1">
        {STATUS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                ${active
                  ? `ring-1 ring-inset ${STATUS_ACTIVE[opt.value]}`
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Tâches et achats" count={items.length} />
          <ItemsList projectId={projectId} initialItems={items} />
        </section>
        <section>
          <SectionTitle title="Discussion" count={comments.length} />
          <CommentSection projectId={projectId} initialComments={comments} me={me} />
        </section>
      </div>
    </div>
  );
}
