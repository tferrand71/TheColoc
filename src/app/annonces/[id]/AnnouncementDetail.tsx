"use client";

import { useState, useTransition } from "react";
import { Archive, Check, Eye, X } from "lucide-react";
import { respondToAnnouncement, archiveAnnouncement } from "../actions";
import { Avatar, SectionTitle } from "@/components/ui";
import type { AnnouncementAnswer } from "@/generated/prisma/client";

interface ResponseRow {
  userId: string;
  displayName: string;
  color: string;
  answer: AnnouncementAnswer | null;
  readAt: Date | null;
}

function ResponseStatus({ r }: { r: ResponseRow }) {
  if (r.answer === "DISPONIBLE") return <span className="badge-ok"><Check className="h-3 w-3" />Disponible</span>;
  if (r.answer === "PAS_DISPONIBLE") return <span className="badge-down"><X className="h-3 w-3" />Indisponible</span>;
  if (r.readAt) return <span className="badge-neutral"><Eye className="h-3 w-3" />Lu</span>;
  return <span className="text-xs text-[var(--color-text-faint)]">Pas encore lu</span>;
}

export function AnnouncementDetail({
  announcementId,
  needsResponse,
  isProprietaire,
  isArchived,
  myAnswer: initialAnswer,
  responses,
}: {
  announcementId: string;
  needsResponse: boolean;
  isProprietaire: boolean;
  isArchived: boolean;
  myAnswer: AnnouncementAnswer | null;
  responses: ResponseRow[];
}) {
  const [myAnswer, setMyAnswer] = useState(initialAnswer);
  const [isPending, startTransition] = useTransition();
  const [archived, setArchived] = useState(isArchived);

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

  return (
    <div className="flex flex-col gap-8">
      {!isProprietaire && needsResponse && !archived && (
        <section>
          <SectionTitle title="Ta disponibilité" />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRespond("DISPONIBLE")}
              disabled={isPending}
              className={`btn py-3 ${myAnswer === "DISPONIBLE"
                ? "bg-[var(--color-ok)]/15 text-[var(--color-ok)] ring-1 ring-inset ring-[var(--color-ok)]/40"
                : "btn-secondary"}`}
            >
              <Check className="h-4 w-4" /> Disponible
            </button>
            <button
              onClick={() => handleRespond("PAS_DISPONIBLE")}
              disabled={isPending}
              className={`btn py-3 ${myAnswer === "PAS_DISPONIBLE"
                ? "bg-[var(--color-down)]/10 text-[var(--color-down)] ring-1 ring-inset ring-[var(--color-down)]/40"
                : "btn-secondary"}`}
            >
              <X className="h-4 w-4" /> Pas disponible
            </button>
          </div>
        </section>
      )}

      {(isProprietaire || (needsResponse && responses.some((r) => r.answer))) && (
        <section>
          <SectionTitle title={isProprietaire ? "Suivi des colocataires" : "Disponibilités"} />
          {responses.length === 0 ? (
            <p className="card px-5 py-6 text-sm text-[var(--color-text-muted)]">Personne n'a encore ouvert l'annonce.</p>
          ) : (
            <ul className="card divide-y divide-[var(--color-hairline)]">
              {responses
                .filter((r) => isProprietaire || r.answer)
                .map((r) => (
                  <li key={r.userId} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={r.displayName} color={r.color} size="sm" />
                    <span className="flex-1 text-sm text-[var(--color-text-main)]">{r.displayName}</span>
                    <ResponseStatus r={r} />
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      {isProprietaire && (
        archived ? (
          <p className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Archive className="h-4 w-4" /> Annonce archivée.
          </p>
        ) : (
          <button onClick={handleArchive} disabled={isPending} className="btn btn-secondary w-fit">
            <Archive className="h-4 w-4" />
            Archiver l'annonce
          </button>
        )
      )}
    </div>
  );
}
