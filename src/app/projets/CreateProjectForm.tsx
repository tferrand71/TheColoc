"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createProject } from "./actions";

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createProject(fd);
      if (res.ok) {
        setOpen(false);
        router.push(`/projets/${res.id}`);
      } else {
        setError(res.error ?? "Erreur");
      }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        <Plus className="h-4 w-4" />
        Nouveau projet
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <form onSubmit={handleSubmit} className="card w-full max-w-md animate-rise p-6 shadow-2xl shadow-black/60">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text-main)]">Nouveau projet</h2>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="title" className="label">Titre</label>
                <input id="title" name="title" required autoFocus placeholder="Ex : Acheter un canapé" className="input" />
              </div>
              <div>
                <label htmlFor="description" className="label">Description <span className="text-[var(--color-text-faint)]">(optionnel)</span></label>
                <textarea id="description" name="description" rows={3} placeholder="Budget, idées, contraintes…" className="input resize-none" />
              </div>
              {error && <p className="text-xs text-[var(--color-down)]">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Annuler</button>
                <button type="submit" disabled={isPending} className="btn btn-primary">
                  {isPending ? "Création…" : "Créer le projet"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
