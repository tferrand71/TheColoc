"use client";

import { useState, useTransition } from "react";
import { regenerateInvitation } from "./actions";

type InvitationStatus = "active" | "pending" | "expired";

export interface UserRow {
  id: string;
  displayName: string;
  color: string;
  username: string | null;
  role: "ADMIN" | "COLOC" | "PROPRIETAIRE";
  invitationStatus: InvitationStatus;
  invitationExpiresAt: string | null;
}

const ROLE_CONFIG: Record<UserRow["role"], { label: string; className: string }> = {
  ADMIN:        { label: "Admin",        className: "bg-[var(--color-mauve)]/20 text-[var(--color-mauve-text)] border border-[var(--color-mauve)]/30" },
  COLOC:        { label: "Coloc",        className: "bg-sky-500/10 text-sky-300 border border-sky-500/20" },
  PROPRIETAIRE: { label: "Propriétaire", className: "bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20" },
};

const STATUS_CONFIG: Record<InvitationStatus, { label: string; dot: string; className: string }> = {
  active:  { label: "Activé",      dot: "bg-[var(--color-ok)]",   className: "text-[var(--color-ok)]   border-[var(--color-ok)]/30   bg-[var(--color-ok)]/10" },
  pending: { label: "En attente",  dot: "bg-[var(--color-warn)]", className: "text-[var(--color-warn)] border-[var(--color-warn)]/30 bg-[var(--color-warn)]/10" },
  expired: { label: "Expiré",      dot: "bg-[var(--color-text-muted)]", className: "text-[var(--color-text-muted)] border-[var(--color-hairline-strong)] bg-[var(--color-raised)]" },
};

function Avatar({ displayName, color }: { displayName: string; color: string }) {
  return (
    <div
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
      style={{ backgroundColor: color, boxShadow: `0 0 16px -4px ${color}60` }}
    >
      {displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function UserCard({ user, baseUrl }: { user: UserRow; baseUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_CONFIG[user.invitationStatus];
  const role = ROLE_CONFIG[user.role];

  function handleRegenerate() {
    setLink(null);
    setError(null);
    startTransition(async () => {
      const result = await regenerateInvitation(user.id);
      if (result.ok) setLink(`${baseUrl}/invitation/${result.token}`);
      else setError(result.error);
    });
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] p-5 transition-all hover:border-[var(--color-hairline-strong)]">
      {/* Identité */}
      <div className="flex items-center gap-3">
        <Avatar displayName={user.displayName} color={user.color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--color-text-main)]">{user.displayName}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${role.className}`}>
              {role.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm">
            {user.username
              ? <span className="font-mono text-[var(--color-mauve-text)]">@{user.username}</span>
              : <span className="italic text-[var(--color-text-muted)]">pas encore connecté</span>
            }
          </p>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </span>
      </div>

      {/* Lien régénéré */}
      {link && (
        <div className="rounded-xl border border-[var(--color-mauve)]/20 bg-[var(--color-mauve)]/5 p-4">
          <p className="eyebrow mb-3">Nouveau lien — valable 7 jours</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-[var(--color-hairline-strong)] bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-text-muted)] font-mono">
              {link}
            </code>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all
                ${copied
                  ? "bg-[var(--color-ok)]/20 text-[var(--color-ok)]"
                  : "bg-[var(--color-mauve)] text-white hover:bg-[#7c3aed]"
                }`}
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            À envoyer sur WhatsApp — usage unique.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--color-hairline)] pt-3">
        <span className="text-xs text-[var(--color-text-muted)]">
          {user.invitationStatus === "active"
            ? "Compte opérationnel"
            : user.invitationStatus === "expired"
              ? "Lien expiré"
              : user.invitationExpiresAt
                ? `Expire le ${user.invitationExpiresAt}`
                : ""}
        </span>
        <button
          onClick={handleRegenerate}
          disabled={isPending}
          className="rounded-lg border border-[var(--color-hairline-strong)] bg-transparent px-3 py-1.5 text-xs
            font-medium text-[var(--color-text-muted)] transition-colors
            hover:border-[var(--color-mauve)]/50 hover:text-[var(--color-mauve-text)]
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-text-muted)]/30 border-t-[var(--color-text-muted)]" />
              Génération…
            </span>
          ) : "Régénérer le lien"}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl font-bold" style={{ color: color ?? "var(--color-text-main)" }}>{value}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}

export function AdminTable({ users, baseUrl }: { users: UserRow[]; baseUrl: string }) {
  const activated = users.filter((u) => u.invitationStatus === "active").length;
  const pending = users.filter((u) => u.invitationStatus === "pending").length;
  const expired = users.filter((u) => u.invitationStatus === "expired").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] p-4">
        <Stat label="Total" value={users.length} />
        <Stat label="Activés" value={activated} color="var(--color-ok)" />
        <Stat label="En attente" value={pending + expired} color="var(--color-warn)" />
      </div>

      {/* Cartes */}
      <div className="grid gap-3 sm:grid-cols-2">
        {users.map((user) => (
          <UserCard key={user.id} user={user} baseUrl={baseUrl} />
        ))}
      </div>
    </div>
  );
}
