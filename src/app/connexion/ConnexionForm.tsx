"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { login, type ConnexionFormState } from "./actions";

export function ConnexionForm() {
  const [state, action, pending] = useActionState<ConnexionFormState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && (
        <p role="alert" className="rounded-xl border border-[var(--color-down)]/25 bg-[var(--color-down)]/10 px-4 py-3 text-sm text-[var(--color-down)]">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="username" className="label">Identifiant</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          placeholder="ton-identifiant"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="input"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary mt-2 w-full py-3">
        {pending ? "Connexion…" : "Se connecter"}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="text-center text-xs text-[var(--color-text-faint)]">
        Pas de compte ? Demande un lien d'invitation à l'admin de la coloc.
      </p>
    </form>
  );
}
