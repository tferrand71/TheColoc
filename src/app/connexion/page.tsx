import { ConnexionForm } from "./ConnexionForm";

interface Props {
  searchParams: Promise<{ bienvenue?: string }>;
}

export default async function ConnexionPage({ searchParams }: Props) {
  const { bienvenue } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-midnight)] px-4 py-12">
      <div className="w-full max-w-sm animate-rise">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
            bg-gradient-to-br from-[var(--color-mauve)] to-[var(--color-pink)] text-2xl shadow-lg">
            🏠
          </div>
          <h1 className="font-serif text-3xl font-bold text-[var(--color-text-main)]">
            La Coloc
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Connecte-toi pour accéder à l'app
          </p>
        </div>

        {/* Bannière bienvenue */}
        {bienvenue && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-ok)]/20 bg-[var(--color-ok)]/10 px-4 py-3 text-sm text-[var(--color-ok)]">
            <span>🎉</span>
            <span>Compte activé ! Tu peux maintenant te connecter.</span>
          </div>
        )}

        {/* Formulaire */}
        <div className="glass-panel rounded-2xl p-6 shadow-2xl">
          <ConnexionForm />
        </div>
      </div>
    </div>
  );
}
