import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfilClient } from "./ProfilClient";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, color: true, username: true, choresRemindersEnabled: true },
  });
  if (!user) redirect("/connexion");

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]">
            ← Accueil
          </Link>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow">Profil</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl animate-rise px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">Mon profil</h1>
        </div>
        <ProfilClient
          displayName={user.displayName}
          color={user.color}
          username={user.username}
          choresEnabled={user.choresRemindersEnabled}
        />
      </main>
    </div>
  );
}
