import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminTable, type UserRow } from "./AdminTable";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    where: { householdId: session.user.householdId },
    include: { invitation: true },
    orderBy: [{ rotationOrder: "asc" }, { createdAt: "asc" }],
  });

  const now = new Date();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const rows: UserRow[] = users.map((u) => {
    const inv = u.invitation;
    const invitationStatus: UserRow["invitationStatus"] =
      inv?.usedAt ? "active" :
      inv && inv.expiresAt > now ? "pending" :
      "expired";

    return {
      id: u.id,
      displayName: u.displayName,
      color: u.color,
      username: u.username,
      role: u.role as UserRow["role"],
      invitationStatus,
      invitationExpiresAt: inv
        ? inv.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
        : null,
    };
  });

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      {/* Header sticky glassmorphism */}
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <a
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
          >
            ← Accueil
          </a>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow">Administration</span>
          <div className="ml-auto">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: session.user.color }}
            >
              {session.user.displayName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-3xl animate-rise px-4 py-8">
        {/* Titre */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">
            Comptes & invitations
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            Régénère un lien pour les colocs qui ne se sont pas encore connectés,
            ou si quelqu'un a oublié son mot de passe.
          </p>
        </div>

        <AdminTable users={rows} baseUrl={baseUrl} />

        {/* Note sécurité */}
        <div className="mt-6 flex gap-3 rounded-xl border border-[var(--color-warn)]/20 bg-[var(--color-warn)]/5 px-4 py-3">
          <span className="mt-0.5 text-sm">⚠️</span>
          <p className="text-xs text-[var(--color-text-muted)]">
            Les tokens ne sont affichés <strong className="text-[var(--color-text-main)]">qu'une seule fois</strong> après génération
            et sont stockés hachés — impossible de les récupérer ensuite.
          </p>
        </div>
      </main>
    </div>
  );
}
