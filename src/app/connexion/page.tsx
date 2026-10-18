import { PartyPopper } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { ConnexionForm } from "./ConnexionForm";

interface Props {
  searchParams: Promise<{ bienvenue?: string }>;
}

export default async function ConnexionPage({ searchParams }: Props) {
  const { bienvenue } = await searchParams;

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-main)]">Connexion</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Content de te revoir. Connecte-toi pour continuer.</p>

      {bienvenue && (
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--color-ok)]/25 bg-[var(--color-ok)]/10 px-4 py-3 text-sm text-[var(--color-ok)]">
          <PartyPopper className="h-4 w-4 flex-shrink-0" />
          Compte activé ! Tu peux te connecter.
        </p>
      )}

      <div className="mt-8">
        <ConnexionForm />
      </div>
    </AuthLayout>
  );
}
