import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getChoreSchedule, getWeekStart } from "@/lib/chores";
import { ChoreWeekCard, type AssignmentRow, type ColocOption } from "./ChoreWeekCard";

export const dynamic = "force-dynamic";

export default async function MenagePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { id: currentUserId, householdId } = session.user;

  // Récupère le planning (crée les assignments manquants si nécessaire)
  const assignments = await getChoreSchedule(householdId);

  // Tous les colocs (hors propriétaire) pour les options d'échange
  const allColocs = await prisma.user.findMany({
    where: { householdId, role: { not: "PROPRIETAIRE" } },
    select: { id: true, displayName: true, color: true },
    orderBy: { rotationOrder: "asc" },
  });

  const currentWeekStart = getWeekStart();

  // Construit les ColocOptions : pour chaque coloc, trouve son assignment dans le planning
  const colocOptions: ColocOption[] = allColocs
    .filter((c) => c.id !== currentUserId)
    .map((c) => ({
      ...c,
      assignmentId: assignments.find((a) => a.userId === c.id)?.id ?? null,
    }));

  const rows = assignments as unknown as AssignmentRow[];

  // Stat résumé
  const myAssignment = rows.find((a) => a.user.id === currentUserId);

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      {/* Header — mobile uniquement */}
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
          <span className="eyebrow">Ménage</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl animate-rise px-4 py-8">
        {/* Titre */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">
            Planning ménage
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            Balai & serpillière des espaces communs — rotation sur 4 semaines, du samedi au vendredi.
          </p>
        </div>

        {/* Bannière ma semaine */}
        {myAssignment && myAssignment.status === "TODO" &&
          myAssignment.weekStart.getTime() === currentWeekStart.getTime() && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--color-mauve)]/30
            bg-[var(--color-mauve)]/10 px-5 py-4">
            <span className="text-2xl">🧹</span>
            <div>
              <p className="font-semibold text-[var(--color-text-main)]">C'est ton tour cette semaine !</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Pense à valider après avoir passé le balai.
              </p>
            </div>
          </div>
        )}

        {/* Planning */}
        <div className="flex flex-col gap-4">
          {rows.map((assignment) => {
            const isCurrent = assignment.weekStart.getTime() === currentWeekStart.getTime();
            const isMyWeek = assignment.user.id === currentUserId;

            return (
              <ChoreWeekCard
                key={assignment.id}
                assignment={assignment}
                isCurrent={isCurrent}
                isMyWeek={isMyWeek}
                currentUserId={currentUserId}
                colocs={colocOptions}
              />
            );
          })}
        </div>

        {/* Note */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]/60">
          Le planning se régénère automatiquement chaque semaine.
        </p>
      </main>
    </div>
  );
}
