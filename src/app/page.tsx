import { auth } from "@/auth";
import { signOut } from "@/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <span className="font-serif text-base font-bold text-[var(--color-text-main)]">La Coloc</span>
          <div className="ml-auto flex items-center gap-3">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]
                  transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
              >
                Admin
              </Link>
            )}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{
                backgroundColor: user?.color,
                boxShadow: `0 0 16px -4px ${user?.color}60`,
              }}
            >
              {user?.displayName?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="mx-auto max-w-3xl animate-rise px-4 py-12">
        {/* Salutation */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl font-bold text-[var(--color-text-main)]">
            Bonjour, {user?.displayName} !
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            L'accueil complet arrive au jalon 2.
          </p>
        </div>

        {/* Cartes des fonctionnalités (à venir) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: "🧹", title: "Corvées", desc: "Tour de rôle & historique", soon: true },
            { icon: "💸", title: "Dépenses", desc: "Partage et remboursements", soon: true },
            { icon: "📋", title: "Règles de vie", desc: "Le règlement de la coloc", soon: true },
            { icon: "📆", title: "Agenda", desc: "Réservation des espaces", soon: true },
          ].map(({ icon, title, desc, soon }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] p-5 opacity-60"
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-main)]">{title}</span>
                  {soon && (
                    <span className="rounded-full border border-[var(--color-hairline-strong)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                      bientôt
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Déconnexion */}
        <div className="mt-10 flex justify-center">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/connexion" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl border border-[var(--color-hairline-strong)] bg-transparent px-4 py-2 text-sm
                text-[var(--color-text-muted)] transition-colors hover:border-red-500/30 hover:text-red-400"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
