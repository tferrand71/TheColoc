"use client";

import { useActionState, useState, useTransition } from "react";
import { changePassword, toggleChoresReminders } from "./actions";
import { PushManager } from "@/components/PushManager";

interface Props {
  displayName: string;
  color: string;
  username: string | null;
  choresEnabled: boolean;
}

export function ProfilClient({ displayName, color, username, choresEnabled }: Props) {
  const [reminders, setReminders] = useState(choresEnabled);
  const [isPending, startTransition] = useTransition();

  const [pwState, pwAction, pwPending] = useActionState<
    { error?: string; ok?: boolean },
    FormData
  >(changePassword, {});

  function handleToggle() {
    const next = !reminders;
    setReminders(next);
    startTransition(() => { void toggleChoresReminders(next); });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Identité */}
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] p-5">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
          style={{ backgroundColor: color, boxShadow: `0 0 24px -4px ${color}60` }}
        >
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-[var(--color-text-main)]">{displayName}</p>
          {username && (
            <p className="mt-0.5 font-mono text-sm text-[var(--color-mauve-text)]">@{username}</p>
          )}
        </div>
      </div>

      {/* Notifications push */}
      <section>
        <h2 className="eyebrow mb-3">Notifications push</h2>
        <div className="flex flex-col gap-3">
          <PushManager choresEnabled={reminders} />

          {/* Toggle rappels ménage */}
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all
              ${reminders
                ? "border-[var(--color-ok)]/20 bg-[var(--color-ok)]/5"
                : "border-[var(--color-hairline)] bg-[var(--color-raised)]"
              }`}
          >
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--color-text-main)]">Rappels ménage</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Samedi 9h et dimanche 19h si pas encore validé
              </p>
            </div>
            <div className={`flex h-6 w-10 items-center rounded-full transition-colors
              ${reminders ? "bg-[var(--color-ok)]" : "bg-[var(--color-hairline-strong)]"}`}
            >
              <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform
                ${reminders ? "translate-x-5" : "translate-x-1"}`}
              />
            </div>
          </button>
          <p className="text-xs text-[var(--color-text-muted)]">
            Les mentions et demandes d'échange sont toujours notifiées.
          </p>
        </div>
      </section>

      {/* Changer le mot de passe */}
      <section>
        <h2 className="eyebrow mb-3">Mot de passe</h2>
        <form action={pwAction} className="flex flex-col gap-3 rounded-2xl border
          border-[var(--color-hairline)] bg-[var(--color-raised)] p-5">
          {pwState.ok && (
            <p className="rounded-lg bg-[var(--color-ok)]/10 px-3 py-2 text-sm text-[var(--color-ok)]">
              ✓ Mot de passe modifié.
            </p>
          )}
          {pwState.error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{pwState.error}</p>
          )}
          {[
            { name: "current", label: "Mot de passe actuel", auto: "current-password" },
            { name: "password", label: "Nouveau mot de passe", auto: "new-password" },
            { name: "confirm", label: "Confirmer", auto: "new-password" },
          ].map((f) => (
            <div key={f.name}>
              <label className="eyebrow mb-1.5 block">{f.label}</label>
              <input
                name={f.name}
                type="password"
                autoComplete={f.auto}
                required
                className="w-full rounded-xl border border-[var(--color-hairline-strong)] bg-[var(--color-ink)]
                  px-4 py-2.5 text-sm text-[var(--color-text-main)] outline-none
                  focus:border-[var(--color-mauve)] focus:ring-1 focus:ring-[var(--color-mauve)]"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={pwPending}
            className="mt-1 rounded-xl bg-[var(--color-mauve)] py-2.5 text-sm font-semibold text-white
              transition hover:bg-[#7c3aed] disabled:opacity-50"
          >
            {pwPending ? "Enregistrement…" : "Changer le mot de passe"}
          </button>
        </form>
      </section>
    </div>
  );
}
