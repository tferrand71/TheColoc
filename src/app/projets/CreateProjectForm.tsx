"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-[var(--color-hairline-strong)]
          py-4 text-sm font-medium text-[var(--color-text-muted)] transition-colors
          hover:border-[var(--color-mauve)]/50 hover:text-[var(--color-mauve-text)]"
      >
        + Nouveau projet
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-mauve)]/30 bg-[var(--color-mauve)]/5 p-5"
    >
      <p className="eyebrow mb-4">Nouveau projet</p>
      <div className="flex flex-col gap-3">
        <input
          name="title"
          required
          autoFocus
          placeholder="Titre du projet"
          className="w-full rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Description (optionnel)"
          className="w-full resize-none rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl border border-[var(--color-hairline-strong)] py-2.5 text-sm
              text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-main)]"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-[var(--color-mauve)] py-2.5 text-sm font-semibold text-white
              transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Création…" : "Créer le projet"}
          </button>
        </div>
      </div>
    </form>
  );
}
