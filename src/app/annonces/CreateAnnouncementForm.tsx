"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncement } from "./actions";

const TYPES = [
  { value: "REUNION", label: "Réunion" },
  { value: "VISITE", label: "Visite" },
  { value: "TRAVAUX", label: "Travaux" },
  { value: "INFORMATION", label: "Information" },
  { value: "AUTRE", label: "Autre" },
] as const;

export function CreateAnnouncementForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createAnnouncement(fd);
      if (res.ok) { setOpen(false); router.push(`/annonces/${res.id}`); }
      else setError(res.error ?? "Erreur");
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-[var(--color-hairline-strong)]
          py-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors
          hover:border-[var(--color-gold)]/50 hover:text-[var(--color-gold)]">
        + Nouvelle annonce
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5 p-5">
      <p className="eyebrow mb-4">Nouvelle annonce</p>
      <div className="flex flex-col gap-3">
        <input name="title" required autoFocus placeholder="Titre"
          className="w-full rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]" />

        <textarea name="body" required rows={3} placeholder="Message aux colocs…"
          className="w-full resize-none rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]" />

        <div className="grid grid-cols-2 gap-3">
          <select name="type" required
            className="rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
              px-3 py-2.5 text-sm text-[var(--color-text-main)] outline-none
              focus:border-[var(--color-gold)]">
            <option value="">Type…</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <input name="eventAt" type="date"
            className="rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
              px-3 py-2.5 text-sm text-[var(--color-text-main)] outline-none
              focus:border-[var(--color-gold)]" />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)}
            className="flex-1 rounded-xl border border-[var(--color-hairline-strong)] py-2.5 text-sm
              text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
            Annuler
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 rounded-xl bg-[var(--color-gold)] py-2.5 text-sm font-semibold text-[#1a1400]
              transition hover:opacity-90 disabled:opacity-50">
            {isPending ? "Envoi…" : "Publier"}
          </button>
        </div>
      </div>
    </form>
  );
}
