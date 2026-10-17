"use client";

import { useState, useTransition } from "react";
import { markDone, requestSwap, respondToSwap } from "./actions";
import { formatWeekRange } from "@/lib/chores-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssignmentRow {
  id: string;
  weekStart: Date;
  status: "TODO" | "DONE";
  doneAt: Date | null;
  user: { id: string; displayName: string; color: string };
  swapFrom: {
    id: string;
    target: { id: string; displayName: string };
    toAssignmentId: string;
  }[];
  swapTo: {
    id: string;
    requester: { id: string; displayName: string };
    fromAssignmentId: string;
  }[];
}

export interface ColocOption {
  id: string;
  displayName: string;
  color: string;
  assignmentId: string | null; // assignment dans les 4 semaines
}

interface Props {
  assignment: AssignmentRow;
  isCurrent: boolean;      // semaine en cours
  isMyWeek: boolean;       // c'est moi qui suis assigné
  currentUserId: string;
  colocs: ColocOption[];   // autres colocs pour proposer un échange
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function Avatar({ displayName, color, size = "md" }: { displayName: string; color: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-xs rounded-lg" : "h-10 w-10 text-sm rounded-xl";
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center font-bold text-white ${dim}`}
      style={{ backgroundColor: color, boxShadow: `0 0 14px -4px ${color}60` }}
    >
      {displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Demande d'échange ────────────────────────────────────────────────────────

function SwapRequestPanel({
  assignment,
  colocs,
}: {
  assignment: AssignmentRow;
  colocs: ColocOption[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedColoc, setSelectedColoc] = useState<ColocOption | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targets = colocs.filter((c) => c.assignmentId !== null);

  if (sent) {
    return (
      <p className="text-xs text-[var(--color-ok)]">
        ✓ Demande envoyée à {selectedColoc?.displayName}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--color-text-muted)] underline decoration-dotted
          transition-colors hover:text-[var(--color-mauve-text)]"
      >
        Proposer un échange
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-ink)] p-3">
      <p className="eyebrow">Échanger avec…</p>
      <div className="flex flex-col gap-1.5">
        {targets.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedColoc(c)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-left transition-colors
              ${selectedColoc?.id === c.id
                ? "bg-[var(--color-mauve)]/20 text-[var(--color-mauve-text)]"
                : "text-[var(--color-text-main)] hover:bg-[var(--color-raised)]"
              }`}
          >
            <Avatar displayName={c.displayName} color={c.color} size="sm" />
            {c.displayName}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 rounded-lg border border-[var(--color-hairline-strong)] py-1.5 text-xs
            text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-main)]"
        >
          Annuler
        </button>
        <button
          disabled={!selectedColoc || isPending}
          onClick={() => {
            if (!selectedColoc?.assignmentId) return;
            setError(null);
            startTransition(async () => {
              const res = await requestSwap(assignment.id, selectedColoc.assignmentId!);
              if (res.ok) setSent(true);
              else setError(res.error ?? "Erreur");
            });
          }}
          className="flex-1 rounded-lg bg-[var(--color-mauve)] py-1.5 text-xs font-semibold text-white
            transition-colors hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

// ─── Réponse à un échange entrant ────────────────────────────────────────────

function SwapIncoming({
  swap,
}: {
  swap: AssignmentRow["swapTo"][number];
}) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState<"accepted" | "declined" | null>(null);

  if (resolved === "accepted") {
    return <p className="text-xs text-[var(--color-ok)]">✓ Échange accepté avec {swap.requester.displayName}</p>;
  }
  if (resolved === "declined") {
    return <p className="text-xs text-[var(--color-text-muted)]">Échange refusé.</p>;
  }

  function respond(accept: boolean) {
    startTransition(async () => {
      await respondToSwap(swap.id, accept);
      setResolved(accept ? "accepted" : "declined");
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/5 p-3">
      <p className="text-xs text-[var(--color-warn)]">
        <strong>{swap.requester.displayName}</strong> te propose un échange de semaine
      </p>
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => respond(false)}
          className="flex-1 rounded-lg border border-[var(--color-hairline-strong)] py-1.5 text-xs
            text-[var(--color-text-muted)] transition-colors hover:text-red-400 disabled:opacity-40"
        >
          Refuser
        </button>
        <button
          disabled={isPending}
          onClick={() => respond(true)}
          className="flex-1 rounded-lg bg-[var(--color-ok)]/20 py-1.5 text-xs font-semibold
            text-[var(--color-ok)] transition-colors hover:bg-[var(--color-ok)]/30 disabled:opacity-40"
        >
          {isPending ? "…" : "Accepter"}
        </button>
      </div>
    </div>
  );
}

// ─── Carte principale ─────────────────────────────────────────────────────────

export function ChoreWeekCard({ assignment, isCurrent, isMyWeek, currentUserId, colocs }: Props) {
  const [isPending, startTransition] = useTransition();
  const [doneOptimistic, setDoneOptimistic] = useState(assignment.status === "DONE");

  const isDone = doneOptimistic;
  const hasPendingOutgoing = assignment.swapFrom.length > 0;
  const incomingSwaps = assignment.swapTo.filter((s) => s.requester.id !== currentUserId);

  function handleMarkDone() {
    setDoneOptimistic(true);
    startTransition(async () => {
      const res = await markDone(assignment.id);
      if (!res.ok) setDoneOptimistic(false);
    });
  }

  return (
    <div
      className={`flex flex-col gap-0 rounded-2xl border transition-all
        ${isCurrent
          ? "border-[var(--color-mauve)]/40 bg-[var(--color-mauve)]/5 shadow-lg shadow-[var(--color-mauve)]/10"
          : "border-[var(--color-hairline)] bg-[var(--color-raised)] hover:border-[var(--color-hairline-strong)]"
        }`}
    >
      {/* Label semaine courante */}
      {isCurrent && (
        <div className="px-5 pt-4">
          <span className="eyebrow text-[var(--color-mauve-text)]">Cette semaine</span>
        </div>
      )}

      <div className="p-5">
        {/* En-tête : date + statut */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[var(--color-text-main)]">
            {formatWeekRange(assignment.weekStart)}
          </p>
          {isDone ? (
            <span className="flex-shrink-0 rounded-full border border-[var(--color-ok)]/30 bg-[var(--color-ok)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-ok)]">
              ✓ Fait
            </span>
          ) : (
            <span className="flex-shrink-0 rounded-full border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]">
              Pas encore fait
            </span>
          )}
        </div>

        {/* Assigné */}
        <div className="flex items-center gap-3">
          <Avatar displayName={assignment.user.displayName} color={assignment.user.color} />
          <div>
            <p className="font-semibold text-[var(--color-text-main)]">
              {isMyWeek ? "Toi" : assignment.user.displayName}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Balai & serpillière des espaces communs
            </p>
          </div>
        </div>

        {/* Actions : valider */}
        {isMyWeek && !isDone && (
          <button
            onClick={handleMarkDone}
            disabled={isPending}
            className="mt-4 w-full rounded-xl bg-[var(--color-ok)]/15 py-2.5 text-sm font-semibold
              text-[var(--color-ok)] transition-all hover:bg-[var(--color-ok)]/25
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Validation…" : "✓ C'est fait !"}
          </button>
        )}

        {/* Échange sortant en attente */}
        {hasPendingOutgoing && (
          <p className="mt-3 text-xs text-[var(--color-warn)]">
            ↗ Échange proposé à {assignment.swapFrom[0].target.displayName} — en attente
          </p>
        )}

        {/* Proposer un échange */}
        {isMyWeek && !isDone && !hasPendingOutgoing && (
          <div className="mt-3">
            <SwapRequestPanel assignment={assignment} colocs={colocs} />
          </div>
        )}

        {/* Échanges entrants */}
        {incomingSwaps.map((swap) => (
          <SwapIncoming key={swap.id} swap={swap} />
        ))}
      </div>
    </div>
  );
}
