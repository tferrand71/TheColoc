import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListeClient, type ListItemRow, type ColocRow } from "./ListeClient";

export const dynamic = "force-dynamic";

export default async function ListePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { id: currentUserId, householdId } = session.user;

  const [items, colocs] = await Promise.all([
    prisma.listItem.findMany({
      where: { householdId, category: "CONSOMMABLE" },
      include: {
        assignee: { select: { id: true, displayName: true, color: true } },
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { householdId, role: { not: "PROPRIETAIRE" } },
      select: { id: true, displayName: true, color: true },
      orderBy: { rotationOrder: "asc" },
    }),
  ]);

  const rows: ListItemRow[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    needed: i.needed,
    boughtAt: i.boughtAt,
    assignee: i.assignee,
    author: i.author,
  }));

  const colocRows: ColocRow[] = colocs;

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
          >
            ← Accueil
          </Link>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow">Liste partagée</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl animate-rise px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">
            Consommables communs
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            PQ, liquide vaisselle, éponges… Ce qui manque pour tout le monde.
          </p>
        </div>

        <ListeClient items={rows} colocs={colocRows} currentUserId={currentUserId} />
      </main>
    </div>
  );
}
