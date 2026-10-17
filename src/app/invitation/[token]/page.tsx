import { findInvitationByToken } from "@/lib/invitation";
import { InvitationForm } from "./InvitationForm";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    return <InvitationError message="Ce lien d'invitation est invalide ou a déjà été utilisé." />;
  }

  if (invitation.expiresAt < new Date()) {
    return <InvitationError message="Ce lien a expiré. Demande à Tobias de t'en envoyer un nouveau." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-midnight)] px-4 py-12">
      <div className="w-full max-w-sm animate-rise">
        {/* Avatar + titre */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg"
            style={{
              backgroundColor: invitation.user.color,
              boxShadow: `0 8px 32px -8px ${invitation.user.color}80`,
            }}
          >
            {invitation.user.displayName.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">
            Bienvenue, {invitation.user.displayName} !
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Choisis ton identifiant et crée ton mot de passe.
          </p>
        </div>

        {/* Formulaire */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl">
          <InvitationForm token={token} displayName={invitation.user.displayName} />
        </div>

        <p className="mt-5 text-center text-xs text-[var(--color-text-muted)]/60">
          Lien à usage unique · expire le{" "}
          {invitation.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
        </p>
      </div>
    </div>
  );
}

function InvitationError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-midnight)] px-4">
      <div className="w-full max-w-sm animate-rise text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl border border-red-500/20">
          🔒
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-main)]">Lien invalide</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{message}</p>
      </div>
    </div>
  );
}
