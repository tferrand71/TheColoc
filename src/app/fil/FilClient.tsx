"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { MessagesSquare, Pencil, Send, ThumbsUp, Trash2 } from "lucide-react";
import { postMessage, editMessage, deleteMessage, toggleReaction } from "./actions";
import { Avatar, EmptyState } from "@/components/ui";
import type { MessageTag } from "@/generated/prisma/client";
import { TAG_CONFIG } from "./tags";

export interface MessageRow {
  id: string;
  body: string;
  tag: MessageTag | null;
  createdAt: Date;
  editedAt: Date | null;
  author: { id: string; displayName: string; color: string };
  reactions: { userId: string }[];
}

export interface ColocRow {
  id: string;
  username: string | null;
  displayName: string;
}

const TAGS = Object.keys(TAG_CONFIG) as MessageTag[];

function renderBody(body: string) {
  const parts = body.split(/(@[a-zA-Z0-9_-]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@")
      ? <span key={i} className="font-medium text-[var(--color-mauve-text)]">{part}</span>
      : <span key={i}>{part}</span>
  );
}

function MessageInput({ colocs }: { colocs: ColocRow[] }) {
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<MessageTag | null>(null);
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<ColocRow[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);
    const match = val.slice(0, e.target.selectionStart ?? val.length).match(/@([a-zA-Z0-9_-]*)$/);
    if (match) {
      const q = match[1].toLowerCase();
      setSuggestions(colocs.filter((c) => c.username?.toLowerCase().startsWith(q) || c.displayName.toLowerCase().startsWith(q)));
    } else {
      setSuggestions([]);
    }
  }

  function insertMention(coloc: ColocRow) {
    const username = coloc.username ?? coloc.displayName.toLowerCase();
    setBody(body.replace(/@([a-zA-Z0-9_-]*)$/, `@${username} `));
    setSuggestions([]);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && suggestions.length === 0) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") setSuggestions([]);
  }

  function handleSubmit() {
    const val = body.trim();
    if (!val || isPending) return;
    startTransition(async () => {
      const res = await postMessage(val, tag);
      if (res.ok) {
        setBody("");
        setTag(null);
      }
    });
  }

  return (
    <div className="sticky bottom-20 z-10 pt-2 lg:bottom-6">
      <div className="card bg-[var(--color-raised)]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {suggestions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {suggestions.slice(0, 5).map((c) => (
              <button key={c.id} onClick={() => insertMention(c)} className="badge-mauve cursor-pointer px-2.5 py-1 hover:bg-[var(--color-mauve)]/20">
                @{c.username ?? c.displayName}
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Écrire un message…"
          className="w-full resize-none bg-transparent px-1 text-sm text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] outline-none"
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? null : t)}
                className={tag === t ? `${TAG_CONFIG[t].className} cursor-pointer` : "badge-neutral cursor-pointer hover:text-[var(--color-text-main)]"}
              >
                {TAG_CONFIG[t].label}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={isPending || !body.trim()} className="btn btn-primary btn-sm">
            <Send className="h-3.5 w-3.5" />
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageCard({
  msg,
  currentUserId,
  onDelete,
}: {
  msg: MessageRow;
  currentUserId: string;
  onDelete: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [reactions, setReactions] = useState(msg.reactions);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(msg.body);
  const [body, setBody] = useState(msg.body);
  const [editError, setEditError] = useState<string | null>(null);

  const isMine = msg.author.id === currentUserId;
  const myReaction = reactions.some((r) => r.userId === currentUserId);
  const ageMs = Date.now() - new Date(msg.createdAt).getTime();
  const canEdit = isMine && ageMs < 5 * 60 * 1000;
  const canDelete = isMine && reactions.length === 0;

  function handleReaction() {
    setReactions(myReaction
      ? reactions.filter((r) => r.userId !== currentUserId)
      : [...reactions, { userId: currentUserId }]);
    startTransition(() => { void toggleReaction(msg.id); });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = editBody.trim();
    if (!val) return;
    setEditError(null);
    startTransition(async () => {
      const res = await editMessage(msg.id, val);
      if (res.ok) { setBody(val); setEditing(false); }
      else setEditError(res.error ?? "Erreur");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteMessage(msg.id);
      if (res.ok) onDelete(msg.id);
    });
  }

  return (
    <div className={`group flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
      <Avatar name={msg.author.displayName} color={msg.author.color} size="sm" className="mt-5" />

      <div className={`flex max-w-[78%] flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        <div className={`flex items-center gap-2 px-1 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-medium text-[var(--color-text-main)]">{isMine ? "Toi" : msg.author.displayName}</span>
          {msg.tag && <span className={TAG_CONFIG[msg.tag].className}>{TAG_CONFIG[msg.tag].label}</span>}
          <span className="text-[11px] text-[var(--color-text-faint)]">
            {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            {msg.editedAt && " · modifié"}
          </span>
        </div>

        {editing ? (
          <form onSubmit={handleEditSubmit} className="flex w-full min-w-[240px] flex-col gap-2">
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} autoFocus rows={2} className="input resize-none" />
            {editError && <p className="text-xs text-[var(--color-down)]">{editError}</p>}
            <div className="flex justify-end gap-1.5">
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">Annuler</button>
              <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">Enregistrer</button>
            </div>
          </form>
        ) : (
          <div
            className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${isMine
                ? "rounded-tr-md bg-gradient-to-br from-[var(--color-mauve)] to-[var(--color-mauve-strong)] text-white [&_span.font-medium]:text-white [&_span.font-medium]:underline"
                : "rounded-tl-md border border-[var(--color-hairline)] bg-[var(--color-raised)] text-[var(--color-text-main)]"
              }`}
          >
            {renderBody(body)}
          </div>
        )}

        <div className={`flex items-center gap-1 ${isMine ? "flex-row-reverse" : ""}`}>
          <button
            onClick={handleReaction}
            disabled={isPending}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] transition-colors
              ${myReaction
                ? "bg-[var(--color-mauve)]/15 text-[var(--color-mauve-text)]"
                : reactions.length > 0
                  ? "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  : "text-[var(--color-text-faint)] opacity-0 hover:text-[var(--color-text-main)] group-hover:opacity-100 focus-visible:opacity-100"
              }`}
            aria-label="Approuver"
          >
            <ThumbsUp className="h-3 w-3" />
            {reactions.length > 0 && reactions.length}
          </button>
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="rounded-full p-1 text-[var(--color-text-faint)] opacity-0 transition-opacity hover:text-[var(--color-text-main)] group-hover:opacity-100 focus-visible:opacity-100" aria-label="Modifier">
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {canDelete && !editing && (
            <button onClick={handleDelete} disabled={isPending} className="rounded-full p-1 text-[var(--color-text-faint)] opacity-0 transition-opacity hover:text-[var(--color-down)] group-hover:opacity-100 focus-visible:opacity-100" aria-label="Supprimer">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FilClient({
  initialMessages,
  colocs,
  currentUserId,
  activeTag,
}: {
  initialMessages: MessageRow[];
  colocs: ColocRow[];
  currentUserId: string;
  activeTag: MessageTag | null;
}) {
  // Dérivé des props : les messages revalidés par le serveur s'affichent sans recharger
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = initialMessages.filter((m) => !deletedIds.has(m.id));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function handleDelete(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  const filtered = activeTag ? messages.filter((m) => m.tag === activeTag) : messages;

  const grouped: { date: string; msgs: MessageRow[] }[] = [];
  for (const msg of filtered) {
    const date = new Date(msg.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.msgs.push(msg);
    else grouped.push({ date, msgs: [msg] });
  }

  return (
    <div className="flex flex-col">
      {grouped.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title={activeTag ? "Aucun message sur ce sujet" : "Pas encore de messages"}
          description="Écris le premier message ci-dessous."
        />
      ) : (
        <div className="flex flex-col gap-6 pb-4">
          {grouped.map(({ date, msgs }) => (
            <div key={date}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--color-hairline)]" />
                <span className="text-[11px] font-medium capitalize text-[var(--color-text-faint)]">{date}</span>
                <div className="h-px flex-1 bg-[var(--color-hairline)]" />
              </div>
              <div className="flex flex-col gap-4">
                {msgs.map((msg) => (
                  <MessageCard key={msg.id} msg={msg} currentUserId={currentUserId} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div ref={bottomRef} />

      <MessageInput colocs={colocs} />
    </div>
  );
}
