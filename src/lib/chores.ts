import { prisma } from "@/lib/prisma";
import { hasNotificationBeenSent, logNotification, sendPushToUser } from "@/lib/push";
import {
  formatWeekRange,
  getUpcomingWeeks,
  isAbsentForWeek,
  pickAssigneeForWeek,
  type AbsencePeriod,
} from "@/lib/chores-utils";

export { getWeekStart, getUpcomingWeeks, getUserForWeek, formatWeekRange } from "@/lib/chores-utils";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Absences du foyer qui touchent la fenêtre [from, to[. */
export async function getHouseholdAbsences(householdId: string, from: Date, to: Date) {
  return prisma.absence.findMany({
    where: { user: { householdId }, endDate: { gte: from }, startDate: { lt: to } },
    include: { user: { select: { id: true, displayName: true, color: true } } },
    orderBy: { startDate: "asc" },
  });
}

/**
 * Garantit une semaine de ménage pour chacune des 4 prochaines semaines.
 * Une semaine existante n'est jamais recréée (les échanges acceptés sont préservés) ;
 * elle est réattribuée seulement si la personne assignée est absente et que ce n'est pas encore fait.
 */
export async function ensureAssignments(householdId: string): Promise<void> {
  const colocs = await prisma.user.findMany({
    where: {
      householdId,
      role: { not: "PROPRIETAIRE" },
      rotationOrder: { not: null },
    },
    select: { id: true, rotationOrder: true, displayName: true },
  });

  if (colocs.length === 0) return;

  const weeks = getUpcomingWeeks(4);
  const windowEnd = new Date(weeks[weeks.length - 1].getTime() + WEEK_MS);

  const [absences, existing] = await Promise.all([
    getHouseholdAbsences(householdId, weeks[0], windowEnd),
    prisma.choreAssignment.findMany({
      where: { weekStart: { in: weeks }, user: { householdId } },
      select: { id: true, weekStart: true, userId: true, status: true },
    }),
  ]);

  const absencesByUser = new Map<string, AbsencePeriod[]>();
  for (const a of absences) {
    absencesByUser.set(a.userId, [...(absencesByUser.get(a.userId) ?? []), a]);
  }

  for (const weekStart of weeks) {
    const desired = pickAssigneeForWeek(weekStart, colocs, absencesByUser);
    const current = existing.find((a) => a.weekStart.getTime() === weekStart.getTime());

    if (!current) {
      await prisma.choreAssignment.upsert({
        where: { weekStart_userId: { weekStart, userId: desired.id } },
        create: { weekStart, userId: desired.id },
        update: {},
      });
      continue;
    }

    const assigneeAbsent = isAbsentForWeek(weekStart, absencesByUser.get(current.userId) ?? []);
    if (current.status === "TODO" && assigneeAbsent && current.userId !== desired.id) {
      await prisma.$transaction([
        prisma.swapRequest.updateMany({
          where: {
            status: "PENDING",
            OR: [{ fromAssignmentId: current.id }, { toAssignmentId: current.id }],
          },
          data: { status: "DECLINED", resolvedAt: new Date() },
        }),
        prisma.choreAssignment.update({
          where: { id: current.id },
          data: { userId: desired.id },
        }),
      ]);

      const absentName = colocs.find((c) => c.id === current.userId)?.displayName ?? "Un coloc";
      await notifyReplacement(desired.id, current.id, absentName, weekStart);
    }
  }
}

/** Prévient le remplaçant (une seule fois par semaine réattribuée). Un échec d'envoi ne bloque pas la page. */
async function notifyReplacement(userId: string, assignmentId: string, absentName: string, weekStart: Date) {
  const kind = "menage_remplacement";
  try {
    if (await hasNotificationBeenSent(userId, kind, assignmentId)) return;
    await logNotification(userId, kind, assignmentId);
    await sendPushToUser(userId, {
      title: "Ménage : tu prends le relais",
      body: `${absentName} est absent, c'est ton tour pour la semaine du ${formatWeekRange(weekStart)}.`,
      url: "/menage",
    });
  } catch (err) {
    console.error("Notification de remplacement échouée", err);
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
