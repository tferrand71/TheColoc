"use client";

import { useActionState } from "react";
import { login, type ConnexionFormState } from "./actions";

export function ConnexionForm() {
  const [state, action, pending] = useActionState<ConnexionFormState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && (
        <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="username" className="eyebrow mb-2 block">
          Identifiant
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          className="w-full rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none transition focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
          placeholder="ton-identifiant"
        />
      </div>

      <div>
        <label htmlFor="password" className="eyebrow mb-2 block">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]
            px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]
            outline-none transition focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-xl bg-[var(--color-mauve)] px-4 py-2.5 text-sm font-semibold text-white
          transition hover:bg-[#7c3aed] active:bg-[#6d28d9]
          disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
