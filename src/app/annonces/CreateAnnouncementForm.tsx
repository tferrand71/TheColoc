"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
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

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        <Plus className="h-4 w-4" />
        Nouvelle annonce
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <form onSubmit={handleSubmit} className="card w-full max-w-lg animate-rise p-6 shadow-2xl shadow-black/60">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text-main)]">Nouvelle annonce</h2>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="ann-title" className="label">Titre</label>
                <input id="ann-title" name="title" required autoFocus placeholder="Ex : Visite de la chaudière" className="input" />
              </div>
              <div>
                <label htmlFor="ann-body" className="label">Message</label>
                <textarea id="ann-body" name="body" required rows={4} placeholder="Message aux colocataires…" className="input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ann-type" className="label">Type</label>
                  <select id="ann-type" name="type" required className="input">
                    <option value="">Choisir…</option>
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="ann-date" className="label">Date <span className="text-[var(--color-text-faint)]">(optionnel)</span></label>
                  <input id="ann-date" name="eventAt" type="date" className="input [color-scheme:dark]" />
                </div>
              </div>
              {error && <p className="text-xs text-[var(--color-down)]">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Annuler</button>
                <button type="submit" disabled={isPending} className="btn btn-primary">
                  {isPending ? "Publication…" : "Publier"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
