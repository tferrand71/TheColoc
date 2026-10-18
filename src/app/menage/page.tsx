import { redirect } from "next/navigation";
import { Brush, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getChoreSchedule, getWeekStart } from "@/lib/chores";
import { ABSENCE_MIN_DAYS, isAbsentForWeek } from "@/lib/chores-utils";
import { PageHeader } from "@/components/ui";
import { ChoreWeekCard, type AssignmentRow, type ColocOption } from "./ChoreWeekCard";
import { AbsencesPanel } from "./AbsencesPanel";

export const dynamic = "force-dynamic";

export default async function MenagePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { id: currentUserId, householdId, role } = session.user;

  const assignments = await getChoreSchedule(householdId);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [allColocs, absences] = await Promise.all([
    prisma.user.findMany({
      where: { householdId, role: { not: "PROPRIETAIRE" } },
      select: { id: true, displayName: true, color: true },
      orderBy: { rotationOrder: "asc" },
    }),
    prisma.absence.findMany({
      where: { user: { householdId }, endDate: { gte: today } },
      include: { user: { select: { id: true, displayName: true, color: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const absentNamesForWeek = (weekStart: Date) =>
    allColocs
      .filter((c) => isAbsentForWeek(weekStart, absences.filter((a) => a.userId === c.id)))
      .map((c) => (c.id === currentUserId ? "toi" : c.displayName));

  const currentWeekStart = getWeekStart();

  const colocOptions: ColocOption[] = allColocs
    .filter((c) => c.id !== currentUserId)
    .map((c) => ({
      ...c,
      assignmentId: assignments.find((a) => a.userId === c.id)?.id ?? null,
    }));

  const rows = assignments as unknown as AssignmentRow[];
  const current = rows.find((a) => a.weekStart.getTime() === currentWeekStart.getTime());
  const upcoming = rows.filter((a) => a.weekStart.getTime() !== currentWeekStart.getTime());
  const myTurnTodo = current?.user.id === currentUserId && current.status === "TODO";

  return (
    <>
      <PageHeader
        icon={Brush}
        title="Ménage"
        description="Balai et serpillière des espaces communs. Rotation chaque samedi."
      />

      {myTurnTodo && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--color-mauve)]/30 bg-[var(--color-mauve)]/10 px-5 py-4">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-[var(--color-mauve-text)]" />
          <p className="text-sm text-[var(--color-text-main)]">
            <span className="font-medium">C'est ton tour cette semaine.</span>{" "}
            <span className="text-[var(--color-text-muted)]">Pense à valider une fois le ménage fait.</span>
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {current && (
          <section className="lg:col-span-3">
            <h2 className="eyebrow mb-3">Cette semaine</h2>
            <ChoreWeekCard
              assignment={current}
              isCurrent
              isMyWeek={current.user.id === currentUserId}
              currentUserId={currentUserId}
              colocs={colocOptions}
              absentNames={absentNamesForWeek(current.weekStart)}
            />
          </section>
        )}

        <section className={current ? "lg:col-span-2" : "lg:col-span-5"}>
          <h2 className="eyebrow mb-3">À venir</h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((assignment) => (
              <ChoreWeekCard
                key={assignment.id}
                assignment={assignment}
                isCurrent={false}
                isMyWeek={assignment.user.id === currentUserId}
                currentUserId={currentUserId}
                colocs={colocOptions}
                absentNames={absentNamesForWeek(assignment.weekStart)}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-10">
        <AbsencesPanel
          absences={absences.map((a) => ({ id: a.id, startDate: a.startDate, endDate: a.endDate, user: a.user }))}
          currentUserId={currentUserId}
          canDeclare={role !== "PROPRIETAIRE"}
          minDays={ABSENCE_MIN_DAYS}
        />
      </div>
    </>
  );
}
