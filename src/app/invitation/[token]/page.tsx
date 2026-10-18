import { Lock } from "lucide-react";
import { findInvitationByToken } from "@/lib/invitation";
import { AuthLayout } from "@/components/AuthLayout";
import { Avatar } from "@/components/ui";
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
    <AuthLayout>
      <Avatar name={invitation.user.displayName} color={invitation.user.color} size="xl" />
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--color-text-main)]">
        Bienvenue, {invitation.user.displayName}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Choisis ton identifiant et ton mot de passe pour activer ton compte.
      </p>

      <div className="mt-8">
        <InvitationForm token={token} />
      </div>

      <p className="mt-6 text-xs text-[var(--color-text-faint)]">
        Lien à usage unique, valable jusqu'au{" "}
        {invitation.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.
      </p>
    </AuthLayout>
  );
}

function InvitationError({ message }: { message: string }) {
  return (
    <AuthLayout>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-down)]/10 text-[var(--color-down)] ring-1 ring-inset ring-[var(--color-down)]/25">
        <Lock className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--color-text-main)]">Lien invalide</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{message}</p>
    </AuthLayout>
  );
}
