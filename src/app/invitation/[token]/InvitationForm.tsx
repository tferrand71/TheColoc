"use client";

import { useActionState } from "react";
import { activateAccount, type InvitationFormState } from "./actions";

interface Props {
  token: string;
  displayName: string;
}

export function InvitationForm({ token, displayName }: Props) {
  const activateWithToken = activateAccount.bind(null, token);
  const [state, action, pending] = useActionState<InvitationFormState, FormData>(
    activateWithToken,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.errors?.token && (
        <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.errors.token}
        </p>
      )}

      {/* Prénom — readonly */}
      <div>
        <label className="eyebrow mb-2 block">Ton prénom</label>
        <input
          type="text"
          value={displayName}
          readOnly
          className="w-full rounded-xl border border-[var(--color-hairline)] bg-[var(--color-ink)]
            px-4 py-2.5 text-sm text-[var(--color-text-muted)] cursor-not-allowed"
        />
      </div>

      {/* Identifiant */}
      <div>
        <label htmlFor="username" className="eyebrow mb-2 block">Identifiant de connexion</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="ex : tobias"
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[var(--color-text-main)]
            placeholder-[var(--color-text-muted)] outline-none transition
            focus:ring-1 focus:ring-[var(--color-mauve)]
            ${state.errors?.username
              ? "border-red-500/50 bg-red-500/5"
              : "border-[var(--color-hairline-strong)] bg-[var(--color-raised)] focus:border-[var(--color-mauve)]"
            }`}
        />
        {state.errors?.username && (
          <p role="alert" className="mt-1.5 text-xs text-red-400">{state.errors.username}</p>
        )}
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          3–20 caractères : lettres, chiffres, <code className="font-mono">-</code> et <code className="font-mono">_</code>
        </p>
      </div>

      {/* Mot de passe */}
      <div>
        <label htmlFor="password" className="eyebrow mb-2 block">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="8 caractères minimum"
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[var(--color-text-main)]
            placeholder-[var(--color-text-muted)] outline-none transition
            focus:ring-1 focus:ring-[var(--color-mauve)]
            ${state.errors?.password
              ? "border-red-500/50 bg-red-500/5"
              : "border-[var(--color-hairline-strong)] bg-[var(--color-raised)] focus:border-[var(--color-mauve)]"
            }`}
        />
        {state.errors?.password && (
          <p role="alert" className="mt-1.5 text-xs text-red-400">{state.errors.password}</p>
        )}
      </div>

      {/* Confirmation */}
      <div>
        <label htmlFor="confirm" className="eyebrow mb-2 block">Confirmer le mot de passe</label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-[var(--color-text-main)]
            placeholder-[var(--color-text-muted)] outline-none transition
            focus:ring-1 focus:ring-[var(--color-mauve)]
            ${state.errors?.confirm
              ? "border-red-500/50 bg-red-500/5"
              : "border-[var(--color-hairline-strong)] bg-[var(--color-raised)] focus:border-[var(--color-mauve)]"
            }`}
        />
        {state.errors?.confirm && (
          <p role="alert" className="mt-1.5 text-xs text-red-400">{state.errors.confirm}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-xl bg-[var(--color-mauve)] px-4 py-2.5 text-sm font-semibold text-white
          transition hover:bg-[#7c3aed] active:bg-[#6d28d9]
          disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Activation…" : "Activer mon compte"}
      </button>
    </form>
  );
}
