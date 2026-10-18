"use client";

import { useActionState } from "react";
import { activateAccount, type InvitationFormState } from "./actions";

function Field({
  id,
  label,
  error,
  hint,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        name={id}
        aria-invalid={!!error}
        className={`input ${error ? "border-[var(--color-down)]/60 focus:border-[var(--color-down)] focus:ring-[var(--color-down)]/15" : ""}`}
        {...input}
      />
      {error
        ? <p role="alert" className="mt-1.5 text-xs text-[var(--color-down)]">{error}</p>
        : hint && <p className="mt-1.5 text-xs text-[var(--color-text-faint)]">{hint}</p>}
    </div>
  );
}

export function InvitationForm({ token }: { token: string }) {
  const activateWithToken = activateAccount.bind(null, token);
  const [state, action, pending] = useActionState<InvitationFormState, FormData>(activateWithToken, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.errors?.token && (
        <p role="alert" className="rounded-xl border border-[var(--color-down)]/25 bg-[var(--color-down)]/10 px-4 py-3 text-sm text-[var(--color-down)]">
          {state.errors.token}
        </p>
      )}

      <Field
        id="username"
        label="Identifiant de connexion"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        placeholder="ex : tobias"
        error={state.errors?.username}
        hint={<>3 à 20 caractères : lettres, chiffres, <code className="font-mono">-</code> et <code className="font-mono">_</code></>}
      />
      <Field
        id="password"
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        required
        placeholder="8 caractères minimum"
        error={state.errors?.password}
      />
      <Field
        id="confirm"
        label="Confirmer le mot de passe"
        type="password"
        autoComplete="new-password"
        required
        error={state.errors?.confirm}
      />

      <button type="submit" disabled={pending} className="btn btn-primary mt-2 w-full py-3">
        {pending ? "Activation…" : "Activer mon compte"}
      </button>
    </form>
  );
}
