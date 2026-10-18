"use client";

import { useActionState, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Bell, CircleCheck, Lock, LogOut } from "lucide-react";
import { changePassword, toggleChoresReminders } from "./actions";
import { PushManager } from "@/components/PushManager";
import { Avatar } from "@/components/ui";

interface Props {
  displayName: string;
  color: string;
  username: string | null;
  choresEnabled: boolean;
}

function Panel({ icon: Icon, title, description, children }: {
  icon: typeof Bell;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-[var(--color-hairline)] px-5 py-4">
        <Icon className="mt-0.5 h-4 w-4 text-[var(--color-mauve-text)]" />
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-main)]">{title}</h2>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
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
    <div className="flex flex-col gap-5">
      <div className="card flex items-center gap-4 p-5">
        <Avatar name={displayName} color={color} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold tracking-tight text-[var(--color-text-main)]">{displayName}</p>
          {username && <p className="font-mono text-sm text-[var(--color-text-muted)]">@{username}</p>}
        </div>
        <button onClick={() => signOut({ callbackUrl: "/connexion" })} className="btn btn-ghost btn-sm lg:hidden">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>

      <Panel icon={Bell} title="Notifications" description="Mentions, échanges de ménage et rappels.">
        <div className="flex flex-col gap-4">
          <PushManager />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-main)]">Rappels ménage</p>
              <p className="text-xs text-[var(--color-text-muted)]">Samedi 9 h, puis dimanche 19 h si ce n'est pas validé.</p>
            </div>
            <button
              role="switch"
              aria-checked={reminders}
              aria-label="Rappels ménage"
              onClick={handleToggle}
              disabled={isPending}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${reminders ? "bg-[var(--color-mauve)]" : "bg-[var(--color-hairline-strong)]"}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${reminders ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-faint)]">Les mentions et les demandes d'échange sont toujours notifiées.</p>
        </div>
      </Panel>

      <Panel icon={Lock} title="Mot de passe" description="8 caractères minimum.">
        <form action={pwAction} className="flex flex-col gap-4">
          {pwState.ok && (
            <p className="flex items-center gap-2 rounded-xl bg-[var(--color-ok)]/10 px-3 py-2 text-sm text-[var(--color-ok)]">
              <CircleCheck className="h-4 w-4" /> Mot de passe modifié.
            </p>
          )}
          {pwState.error && (
            <p className="rounded-xl bg-[var(--color-down)]/10 px-3 py-2 text-sm text-[var(--color-down)]">{pwState.error}</p>
          )}
          <div>
            <label htmlFor="current" className="label">Mot de passe actuel</label>
            <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="label">Nouveau mot de passe</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
            </div>
            <div>
              <label htmlFor="confirm" className="label">Confirmation</label>
              <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="input" />
            </div>
          </div>
          <button type="submit" disabled={pwPending} className="btn btn-primary w-fit">
            {pwPending ? "Enregistrement…" : "Changer le mot de passe"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
