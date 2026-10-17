"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { postMessage, editMessage, deleteMessage, toggleReaction } from "./actions";
import type { MessageTag } from "@/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const TAG_CONFIG: Record<MessageTag, { label: string; className: string }> = {
  MENAGE:  { label: "Ménage",  className: "bg-[var(--color-ok)]/10 text-[var(--color-ok)] border-[var(--color-ok)]/20" },
  BRUIT:   { label: "Bruit",   className: "bg-red-500/10 text-red-400 border-red-500/20" },
  ARGENT:  { label: "Argent",  className: "bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)]/20" },
  GENERAL: { label: "Général", className: "bg-[var(--color-mauve)]/10 text-[var(--color-mauve-text)] border-[var(--color-mauve)]/20" },
};

const TAGS = Object.keys(TAG_CONFIG) as MessageTag[];

// ─── Formatage des @mentions ──────────────────────────────────────────────────

function renderBody(body: string) {
  const parts = body.split(/(@[a-zA-Z0-9_-]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@")
      ? <span key={i} className="font-semibold text-[var(--color-mauve-text)]">{part}</span>
      : <span key={i}>{part}</span>
  );
}

// ─── Saisie avec suggestion @mentions ────────────────────────────────────────

function MessageInput({
  colocs,
  onSent,
}: {
  colocs: ColocRow[];
  onSent: (msg: MessageRow) => void;
}) {
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<MessageTag | null>(null);
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<ColocRow[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);
    // Détecte @query en cours de saisie
    const match = val.slice(0, e.target.selectionStart ?? val.length).match(/@([a-zA-Z0-9_-]*)$/);
    if (match) {
      const q = match[1].toLowerCase();
      setMentionQuery(q);
      setSuggestions(colocs.filter((c) => c.username?.toLowerCase().startsWith(q) || c.displayName.toLowerCase().startsWith(q)));
    } else {
      setSuggestions([]);
      setMentionQuery("");
    }
  }

  function insertMention(coloc: ColocRow) {
    const username = coloc.username ?? coloc.displayName.toLowerCase();
    const newBody = body.replace(/@([a-zA-Z0-9_-]*)$/, `@${username} `);
    setBody(newBody);
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
    <div className="sticky bottom-0 border-t border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl p-4">
      {/* Suggestions @mentions */}
      {suggestions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {suggestions.slice(0, 5).map((c) => (
            <button
              key={c.id}
              onClick={() => insertMention(c)}
              className="rounded-lg border border-[var(--color-mauve)]/30 bg-[var(--color-mauve)]/10
                px-2.5 py-1 text-xs text-[var(--color-mauve-text)] transition hover:bg-[var(--color-mauve)]/20"
            >
              @{c.username ?? c.displayName}
            </button>
          ))}
        </div>
      )}

      {/* Tags */}
      <div className="mb-2 flex gap-1.5 flex-wrap">
        {TAGS.map((t) => {
          const cfg = TAG_CONFIG[t];
          return (
            <button
              key={t}
              onClick={() => setTag(tag === t ? null : t)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all
                ${tag === t ? cfg.className : "border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"}`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Zone de saisie */}
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Écris un message… (@ pour mentionner, Entrée pour envoyer)"
          className="flex-1 resize-none rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
          className="self-end rounded-xl bg-[var(--color-mauve)] px-4 py-2.5 text-sm font-semibold text-white
            transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

// ─── Carte message ────────────────────────────────────────────────────────────

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
    const next = myReaction
      ? reactions.filter((r) => r.userId !== currentUserId)
      : [...reactions, { userId: currentUserId }];
    setReactions(next);
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
    <div className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center self-end rounded-xl text-xs font-bold text-white"
        style={{ backgroundColor: msg.author.color }}
      >
        {msg.author.displayName.slice(0, 2).toUpperCase()}
      </div>

      {/* Bulle */}
      <div className={`flex max-w-[80%] flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
        {/* Auteur + tag */}
        <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-semibold text-[var(--color-text-main)]">
            {isMine ? "Toi" : msg.author.displayName}
          </span>
          {msg.tag && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TAG_CONFIG[msg.tag].className}`}>
              {TAG_CONFIG[msg.tag].label}
            </span>
          )}
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            {msg.editedAt && " · modifié"}
          </span>
        </div>

        {/* Corps */}
        {editing ? (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-1.5 w-full">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              autoFocus
              rows={2}
              className="w-full resize-none rounded-xl border border-[var(--color-mauve)]/40 bg-[var(--color-raised)]
                px-3 py-2 text-sm text-[var(--color-text-main)] outline-none focus:ring-1 focus:ring-[var(--color-mauve)]"
            />
            {editError && <p className="text-xs text-red-400">{editError}</p>}
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-lg border border-[var(--color-hairline-strong)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]">
                Annuler
              </button>
              <button type="submit" disabled={isPending}
                className="rounded-lg bg-[var(--color-mauve)] px-2.5 py-1 text-xs font-semibold text-white">
                Sauvegarder
              </button>
            </div>
          </form>
        ) : (
          <div className={`rounded-2xl px-4 py-2.5 text-sm text-[var(--color-text-main)]
            ${isMine
              ? "rounded-br-sm bg-[var(--color-mauve)]/20"
              : "rounded-bl-sm bg-[var(--color-raised)] border border-[var(--color-hairline)]"
            }`}
          >
            {renderBody(body)}
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
          {/* Réaction */}
          <button
            onClick={handleReaction}
            disabled={isPending}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all
              ${myReaction
                ? "border-[var(--color-ok)]/30 bg-[var(--color-ok)]/10 text-[var(--color-ok)]"
                : "border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              }`}
          >
            <span>+1</span>
            {reactions.length > 0 && <span className="font-semibold">{reactions.length}</span>}
          </button>

          {/* Modifier */}
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)}
              className="text-[10px] text-[var(--color-text-muted)] underline decoration-dotted hover:text-[var(--color-text-main)]">
              Modifier
            </button>
          )}

          {/* Supprimer */}
          {canDelete && !editing && (
            <button onClick={handleDelete} disabled={isPending}
              className="text-[10px] text-[var(--color-text-muted)] underline decoration-dotted hover:text-red-400">
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fil complet ──────────────────────────────────────────────────────────────

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
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleDelete(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  const filtered = activeTag ? messages.filter((m) => m.tag === activeTag) : messages;

  // Regrouper par jour
  const grouped: { date: string; msgs: MessageRow[] }[] = [];
  for (const msg of filtered) {
    const date = new Date(msg.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.msgs.push(msg);
    else grouped.push({ date, msgs: [msg] });
  }

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="flex flex-col gap-4 px-4 py-6">
        {grouped.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-3xl">💬</p>
            <p className="mt-3 font-medium text-[var(--color-text-main)]">
              {activeTag ? "Aucun message avec ce tag" : "Pas encore de messages"}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Sois le premier à écrire.</p>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 border-t border-[var(--color-hairline)]" />
              <span className="text-xs text-[var(--color-text-muted)]">{date}</span>
              <div className="flex-1 border-t border-[var(--color-hairline)]" />
            </div>
            <div className="flex flex-col gap-3">
              {msgs.map((msg) => (
                <MessageCard key={msg.id} msg={msg} currentUserId={currentUserId} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie sticky en bas */}
      <MessageInput colocs={colocs} onSent={(msg) => setMessages((prev) => [...prev, msg])} />
    </div>
  );
}
