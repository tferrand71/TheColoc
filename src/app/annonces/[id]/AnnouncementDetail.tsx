"use client";

import { useState, useTransition } from "react";
import { respondToAnnouncement, archiveAnnouncement } from "../actions";
import type { AnnouncementAnswer } from "@/generated/prisma/client";

interface ResponseRow {
  userId: string;
  displayName: string;
  color: string;
  answer: AnnouncementAnswer | null;
  readAt: Date | null;
}

export function AnnouncementDetail({
  announcementId,
  needsResponse,
  isProprietaire,
  myAnswer: initialAnswer,
  responses,
}: {
  announcementId: string;
  needsResponse: boolean;
  isProprietaire: boolean;
  myAnswer: AnnouncementAnswer | null;
  responses: ResponseRow[];
}) {
  const [myAnswer, setMyAnswer] = useState(initialAnswer);
  const [isPending, startTransition] = useTransition();
  const [archived, setArchived] = useState(false);

  function handleRespond(answer: AnnouncementAnswer) {
    setMyAnswer(answer);
    startTransition(async () => {
      const res = await respondToAnnouncement(announcementId, answer);
      if (!res.ok) setMyAnswer(initialAnswer);
    });
  }

  function handleArchive() {
    setArchived(true);
    startTransition(() => { void archiveAnnouncement(announcementId); });
  }

  if (archived) {
    return <p className="text-sm text-[var(--color-text-muted)]">Annonce archivée.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Réponse coloc */}
      {!isProprietaire && needsResponse && (
        <div>
          <h2 className="eyebrow mb-3">Ta disponibilité</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleRespond("DISPONIBLE")}
              disabled={isPending}
              className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all
                ${myAnswer === "DISPONIBLE"
                  ? "border-[var(--color-ok)]/40 bg-[var(--color-ok)]/15 text-[var(--color-ok)]"
                  : "border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-ok)] hover:border-[var(--color-ok)]/30"
                }`}
            >
              ✓ Disponible
            </button>
            <button
              onClick={() => handleRespond("PAS_DISPONIBLE")}
              disabled={isPending}
              className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all
                ${myAnswer === "PAS_DISPONIBLE"
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : "border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:text-red-400 hover:border-red-500/30"
                }`}
            >
              ✗ Pas disponible
            </button>
          </div>
        </div>
      )}

      {/* Vue propriétaire : qui a lu et répondu */}
      {isProprietaire && (
        <div>
          <h2 className="eyebrow mb-3">Réponses des colocs</h2>
          {responses.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Aucune réponse pour l'instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {responses.map((r) => (
                <div key={r.userId}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-hairline)]
                    bg-[var(--color-raised)] px-4 py-3">
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm text-[var(--color-text-main)]">{r.displayName}</span>
                  {r.answer === "DISPONIBLE" && <span className="text-xs font-medium text-[var(--color-ok)]">✓ Disponible</span>}
                  {r.answer === "PAS_DISPONIBLE" && <span className="text-xs font-medium text-red-400">✗ Pas disponible</span>}
                  {!r.answer && r.readAt && <span className="text-xs text-[var(--color-text-muted)]">Lu</span>}
                  {!r.answer && !r.readAt && <span className="text-xs text-[var(--color-text-muted)] opacity-50">Pas encore lu</span>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleArchive}
            disabled={isPending}
            className="mt-4 rounded-xl border border-[var(--color-hairline-strong)] px-4 py-2 text-sm
              text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-main)]
              disabled:opacity-40"
          >
            Archiver cette annonce
          </button>
        </div>
      )}

      {/* Vue coloc : qui a répondu quoi */}
      {!isProprietaire && needsResponse && responses.length > 0 && (
        <div>
          <h2 className="eyebrow mb-3">Disponibilités</h2>
          <div className="flex flex-col gap-2">
            {responses.filter((r) => r.answer).map((r) => (
              <div key={r.userId}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-hairline)]
                  bg-[var(--color-raised)] px-4 py-2.5">
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                  style={{ backgroundColor: r.color }}
                >
                  {r.displayName.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-[var(--color-text-main)]">{r.displayName}</span>
                {r.answer === "DISPONIBLE" && <span className="text-xs text-[var(--color-ok)]">✓ Dispo</span>}
                {r.answer === "PAS_DISPONIBLE" && <span className="text-xs text-red-400">✗ Pas dispo</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
