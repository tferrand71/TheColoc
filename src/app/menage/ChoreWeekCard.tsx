"use client";

import { useState, useTransition, type DragEvent } from "react";
import { ArrowLeftRight, Check, CircleCheck, Clock, Plane } from "lucide-react";
import { markDone, requestSwap, respondToSwap, swapWeeks } from "./actions";
import { formatWeekRange } from "@/lib/chores-utils";
import { Avatar } from "@/components/ui";

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
  assignmentId: string | null;
}

export interface MoveTarget {
  id: string;
  label: string;
}

interface Props {
  assignment: AssignmentRow;
  isCurrent: boolean;
  isMyWeek: boolean;
  currentUserId: string;
  colocs: ColocOption[];
  absentNames?: string[];
  isAdmin?: boolean;
  moveTargets?: MoveTarget[];
}

function MoveWeek({
  targets,
  disabled,
  error,
  onMove,
}: {
  targets: MoveTarget[];
  disabled: boolean;
  error: string | null;
  onMove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-[var(--color-hairline)] pt-3">
      <p className="label">Déplacer vers une autre semaine</p>
      <select
        value=""
        disabled={disabled || targets.length === 0}
        onChange={(e) => onMove(e.target.value)}
        className="input"
      >
        <option value="" disabled>Choisir une semaine…</option>
        {targets.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[var(--color-down)]">{error}</p>}
    </div>
  );
}

function AbsentNote({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
  return (
    <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
      <Plane className="h-3.5 w-3.5 text-[var(--color-text-faint)]" />
      Absent{names.length > 1 ? "s" : ""} : {list}
    </p>
  );
}

function SwapRequestPanel({ assignment, colocs }: { assignment: AssignmentRow; colocs: ColocOption[] }) {
  const [open, setOpen] = useState(false);
  const [selectedColoc, setSelectedColoc] = useState<ColocOption | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targets = colocs.filter((c) => c.assignmentId !== null);

  if (sent) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-[var(--color-ok)]">
        <Check className="h-3.5 w-3.5" /> Demande envoyée à {selectedColoc?.displayName}
      </p>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm -ml-3">
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Proposer un échange
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-ink)]/50 p-3">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">Échanger ma semaine avec…</p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {targets.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedColoc(c)}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors
              ${selectedColoc?.id === c.id
                ? "border-[var(--color-mauve)]/50 bg-[var(--color-mauve)]/15 text-[var(--color-text-main)]"
                : "border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-main)]"
              }`}
          >
            <Avatar name={c.displayName} color={c.color} size="xs" />
            {c.displayName}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-[var(--color-down)]">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Annuler</button>
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
          className="btn btn-primary btn-sm"
        >
          {isPending ? "Envoi…" : "Envoyer la demande"}
        </button>
      </div>
    </div>
  );
}

function SwapIncoming({ swap }: { swap: AssignmentRow["swapTo"][number] }) {
  const [isPending, startTransition] = useTransition();
  const [resolved, setResolved] = useState<"accepted" | "declined" | null>(null);

  if (resolved === "accepted") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-[var(--color-ok)]">
        <Check className="h-3.5 w-3.5" /> Échange accepté avec {swap.requester.displayName}
      </p>
    );
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-pink)]/25 bg-[var(--color-pink)]/[0.06] p-3">
      <p className="flex items-center gap-2 text-sm text-[var(--color-text-main)]">
        <ArrowLeftRight className="h-4 w-4 text-[var(--color-pink-text)]" />
        <span><strong className="font-medium">{swap.requester.displayName}</strong> te propose d'échanger</span>
      </p>
      <div className="flex gap-2">
        <button disabled={isPending} onClick={() => respond(false)} className="btn btn-ghost btn-sm">
          Refuser
        </button>
        <button disabled={isPending} onClick={() => respond(true)} className="btn btn-success btn-sm">
          Accepter
        </button>
      </div>
    </div>
  );
}

export function ChoreWeekCard({
  assignment,
  isCurrent,
  isMyWeek,
  currentUserId,
  colocs,
  absentNames = [],
  isAdmin = false,
  moveTargets = [],
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(assignment.status === "DONE");
  const [isMoving, startMove] = useTransition();
  const [moveError, setMoveError] = useState<string | null>(null);

  const hasPendingOutgoing = assignment.swapFrom.length > 0;
  const incomingSwaps = assignment.swapTo.filter((s) => s.requester.id !== currentUserId);

  function handleMarkDone() {
    setIsDone(true);
    startTransition(async () => {
      const res = await markDone(assignment.id);
      if (!res.ok) setIsDone(false);
    });
  }

  // Échange la personne de cette semaine avec celle de `otherId`
  function moveTo(otherId: string) {
    setMoveError(null);
    startMove(async () => {
      const res = await swapWeeks(assignment.id, otherId);
      if (!res.ok) setMoveError(res.error ?? "Erreur");
    });
  }

  // Admin : glisser une semaine sur une autre pour échanger les personnes (bureau)
  const canDrag = isAdmin && !isDone;
  const dragProps = canDrag
    ? {
        draggable: true,
        onDragStart: (e: DragEvent<HTMLDivElement>) => {
          e.dataTransfer.setData("text/plain", assignment.id);
          e.dataTransfer.effectAllowed = "move";
        },
        onDragOver: (e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        },
        onDrop: (e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          const sourceId = e.dataTransfer.getData("text/plain");
          if (sourceId && sourceId !== assignment.id) moveTo(sourceId);
        },
      }
    : {};

  const targets = moveTargets.filter((t) => t.id !== assignment.id);

  const statusBadge = isDone
    ? <span className="badge-ok"><CircleCheck className="h-3 w-3" /> Fait</span>
    : isCurrent
      ? <span className="badge-pink">À faire</span>
      : <span className="badge-neutral">Prévu</span>;

  if (!isCurrent) {
    return (
      <div className="card flex flex-col gap-3 p-4" {...dragProps}>
        <div className="flex items-center gap-3">
          <Avatar name={assignment.user.displayName} color={assignment.user.color} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-text-main)]">
              {isMyWeek ? "Toi" : assignment.user.displayName}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{formatWeekRange(assignment.weekStart)}</p>
          </div>
          {statusBadge}
        </div>
        <AbsentNote names={absentNames} />
        {hasPendingOutgoing && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--color-pink-text)]">
            <Clock className="h-3.5 w-3.5" /> Échange proposé à {assignment.swapFrom[0].target.displayName}
          </p>
        )}
        {isMyWeek && !isDone && !hasPendingOutgoing && (
          <SwapRequestPanel assignment={assignment} colocs={colocs} />
        )}
        {incomingSwaps.map((swap) => <SwapIncoming key={swap.id} swap={swap} />)}
        {isAdmin && !isDone && (
          <MoveWeek targets={targets} disabled={isMoving} error={moveError} onMove={moveTo} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`card flex flex-col gap-5 p-6 ${isMyWeek && !isDone ? "border-[var(--color-mauve)]/35 shadow-[0_20px_60px_-30px_rgba(139,92,246,0.6)]" : ""}`}
      {...dragProps}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar name={assignment.user.displayName} color={assignment.user.color} size="lg" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--color-text-main)]">
              {isMyWeek ? "Toi" : assignment.user.displayName}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">{formatWeekRange(assignment.weekStart)}</p>
          </div>
        </div>
        {statusBadge}
      </div>

      <AbsentNote names={absentNames} />

      {isMyWeek && !isDone && (
        <button onClick={handleMarkDone} disabled={isPending} className="btn btn-primary w-full py-3">
          <Check className="h-4 w-4" />
          {isPending ? "Validation…" : "J'ai fait le ménage"}
        </button>
      )}

      {isDone && assignment.doneAt && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Validé le {new Date(assignment.doneAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}.
        </p>
      )}

      {hasPendingOutgoing && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--color-pink-text)]">
          <Clock className="h-3.5 w-3.5" /> Échange proposé à {assignment.swapFrom[0].target.displayName}, en attente
        </p>
      )}

      {isMyWeek && !isDone && !hasPendingOutgoing && (
        <SwapRequestPanel assignment={assignment} colocs={colocs} />
      )}

      {incomingSwaps.map((swap) => <SwapIncoming key={swap.id} swap={swap} />)}

      {isAdmin && !isDone && (
        <MoveWeek targets={targets} disabled={isMoving} error={moveError} onMove={moveTo} />
      )}
    </div>
  );
}
