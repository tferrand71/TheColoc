"use client";

import { useRef, useState, useTransition } from "react";
import { CalendarOff, Plane, Plus, Trash2, X } from "lucide-react";
import { addAbsence, deleteAbsence } from "./actions";
import { Avatar, SectionTitle } from "@/components/ui";

export interface AbsenceRow {
  id: string;
  startDate: Date;
  endDate: Date;
  user: { id: string; displayName: string; color: string };
}

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };

function formatPeriod(start: Date, end: Date) {
  const s = new Date(start).toLocaleDateString("fr-FR", DATE_OPTS);
  const e = new Date(end).toLocaleDateString("fr-FR", DATE_OPTS);
  return s === e ? `le ${s}` : `du ${s} au ${e}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AbsencesPanel({
  absences,
  currentUserId,
  canDeclare,
  minDays,
}: {
  absences: AbsenceRow[];
  currentUserId: string;
  canDeclare: boolean;
  minDays: number;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addAbsence(fd);
      if (res.ok) {
        formRef.current?.reset();
        setStart("");
        setOpen(false);
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  }

  function handleDelete(id: string) {
    setRemoving(id);
    startTransition(async () => {
      await deleteAbsence(id);
      setRemoving(null);
    });
  }

  return (
    <section>
      <SectionTitle
        title="Absences"
        count={absences.length || undefined}
        action={canDeclare && !open && (
          <button onClick={() => setOpen(true)} className="btn btn-secondary btn-sm">
            <Plus className="h-3.5 w-3.5" />
            Je serai absent
          </button>
        )}
      />

      <div className="card overflow-hidden">
        {open && (
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]/40 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--color-text-main)]">Déclarer une absence</p>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="absence-start" className="label">Départ</label>
                <input
                  id="absence-start"
                  name="startDate"
                  type="date"
                  required
                  min={todayIso()}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="input [color-scheme:dark]"
                />
              </div>
              <div>
                <label htmlFor="absence-end" className="label">Retour (dernier jour d'absence)</label>
                <input
                  id="absence-end"
                  name="endDate"
                  type="date"
                  required
                  min={start || todayIso()}
                  className="input [color-scheme:dark]"
                />
              </div>
            </div>
            {error && <p className="text-xs text-[var(--color-down)]">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[var(--color-text-muted)]">
                Tu es retiré du ménage les semaines où tu es absent {minDays} jours ou plus ; le coloc suivant prend la semaine.
              </p>
              <button type="submit" disabled={isPending} className="btn btn-primary btn-sm">
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        )}

        {absences.length === 0 ? (
          <p className="flex items-center gap-2.5 px-5 py-5 text-sm text-[var(--color-text-muted)]">
            <CalendarOff className="h-4 w-4 text-[var(--color-text-faint)]" />
            Aucune absence prévue.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-hairline)]">
            {absences.map((a) => {
              const mine = a.user.id === currentUserId;
              return (
                <li key={a.id} className={`flex items-center gap-3 px-5 py-3 ${removing === a.id ? "opacity-40" : ""}`}>
                  <Avatar name={a.user.displayName} color={a.user.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text-main)]">
                      {mine ? "Toi" : a.user.displayName}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                      <Plane className="h-3 w-3" />
                      Absent {formatPeriod(a.startDate, a.endDate)}
                    </p>
                  </div>
                  {mine && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-[var(--color-text-faint)] transition-colors hover:bg-[var(--color-down)]/10 hover:text-[var(--color-down)]"
                      aria-label="Supprimer cette absence"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
