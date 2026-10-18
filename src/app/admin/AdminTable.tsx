"use client";

import { useState, useTransition } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { regenerateInvitation } from "./actions";
import { Avatar } from "@/components/ui";

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

const ROLE_LABEL: Record<UserRow["role"], string> = {
  ADMIN: "Admin",
  COLOC: "Colocataire",
  PROPRIETAIRE: "Propriétaire",
};

const STATUS_CONFIG: Record<InvitationStatus, { label: string; className: string }> = {
  active:  { label: "Activé",     className: "badge-ok" },
  pending: { label: "En attente", className: "badge-pink" },
  expired: { label: "Expiré",     className: "badge-neutral" },
};

function UserRowView({ user, baseUrl }: { user: UserRow; baseUrl: string }) {
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_CONFIG[user.invitationStatus];

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
    <li className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={user.displayName} color={user.color} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-text-main)]">{user.displayName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {ROLE_LABEL[user.role]}
            {" · "}
            {user.username
              ? <span className="font-mono">@{user.username}</span>
              : user.invitationStatus === "pending" && user.invitationExpiresAt
                ? `lien valable jusqu'au ${user.invitationExpiresAt}`
                : "pas encore connecté"}
          </p>
        </div>
        <span className={status.className}>{status.label}</span>
        <button onClick={handleRegenerate} disabled={isPending} className="btn btn-secondary btn-sm">
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Génération…" : "Nouveau lien"}
        </button>
      </div>

      {link && (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-mauve)]/25 bg-[var(--color-mauve)]/[0.06] p-3 sm:ml-12">
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-[var(--color-ink)]/70 px-3 py-2 font-mono text-xs text-[var(--color-text-muted)]">
              {link}
            </code>
            <button onClick={handleCopy} className={`btn btn-sm ${copied ? "btn-success" : "btn-primary"}`}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)]">Valable 7 jours, usage unique. Envoie-le en privé.</p>
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-down)] sm:ml-12">{error}</p>}
    </li>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${tone ?? "text-[var(--color-text-main)]"}`}>{value}</p>
    </div>
  );
}

export function AdminTable({ users, baseUrl }: { users: UserRow[]; baseUrl: string }) {
  const activated = users.filter((u) => u.invitationStatus === "active").length;
  const waiting = users.length - activated;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Comptes" value={users.length} />
        <Stat label="Activés" value={activated} tone="text-[var(--color-ok)]" />
        <Stat label="En attente" value={waiting} tone="text-[var(--color-pink-text)]" />
      </div>

      <ul className="card divide-y divide-[var(--color-hairline)]">
        {users.map((user) => (
          <UserRowView key={user.id} user={user} baseUrl={baseUrl} />
        ))}
      </ul>
    </div>
  );
}
