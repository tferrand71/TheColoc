import { prisma } from "@/lib/prisma";
import { getUpcomingWeeks, getUserForWeek } from "@/lib/chores-utils";

export { getWeekStart, getUpcomingWeeks, getUserForWeek, formatWeekRange } from "@/lib/chores-utils";

/**
 * Crée les ChoreAssignments manquants pour les 4 prochaines semaines.
 * Idempotent — ne recrée pas les semaines déjà existantes.
 */
export async function ensureAssignments(householdId: string): Promise<void> {
  const colocs = await prisma.user.findMany({
    where: {
      householdId,
      role: { not: "PROPRIETAIRE" },
      rotationOrder: { not: null },
    },
    select: { id: true, rotationOrder: true },
  });

  if (colocs.length === 0) return;

  const weeks = getUpcomingWeeks(4);

  for (const weekStart of weeks) {
    const assigned = getUserForWeek(weekStart, colocs);
    await prisma.choreAssignment.upsert({
      where: { weekStart_userId: { weekStart, userId: assigned.id } },
      create: { weekStart, userId: assigned.id },
      update: {},
    });
  }
}

/**
 * Retourne les assignments des 4 prochaines semaines avec les données utilisateur,
 * en s'assurant qu'ils existent au préalable.
 */
export async function getChoreSchedule(householdId: string) {
  await ensureAssignments(householdId);

  const weeks = getUpcomingWeeks(4);
  const [start, end] = [weeks[0], weeks[weeks.length - 1]];

  const assignments = await prisma.choreAssignment.findMany({
    where: {
      weekStart: { gte: start, lte: end },
      user: { householdId },
    },
    include: {
      user: { select: { id: true, displayName: true, color: true } },
      swapFrom: {
        where: { status: "PENDING" },
        include: {
          target: { select: { id: true, displayName: true } },
        },
      },
      swapTo: {
        where: { status: "PENDING" },
        include: {
          requester: { select: { id: true, displayName: true } },
        },
      },
    },
    orderBy: { weekStart: "asc" },
  });

  return assignments;
}
