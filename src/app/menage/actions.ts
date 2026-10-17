"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Valider son ménage ────────────────────────────────────────────────────────

export async function markDone(assignmentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const assignment = await prisma.choreAssignment.findUnique({
    where: { id: assignmentId },
    include: { user: true },
  });

  if (!assignment) return { error: "Semaine introuvable" };
  if (assignment.userId !== session.user.id) return { error: "Ce n'est pas ta semaine" };
  if (assignment.user.householdId !== session.user.householdId) return { error: "Foyer incorrect" };

  await prisma.choreAssignment.update({
    where: { id: assignmentId },
    data: { status: "DONE", doneAt: new Date() },
  });

  revalidatePath("/menage");
  revalidatePath("/");
  return { ok: true };
}

// ── Proposer un échange ───────────────────────────────────────────────────────

export async function requestSwap(fromAssignmentId: string, toAssignmentId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const [from, to] = await Promise.all([
    prisma.choreAssignment.findUnique({ where: { id: fromAssignmentId }, include: { user: true } }),
    prisma.choreAssignment.findUnique({ where: { id: toAssignmentId }, include: { user: true } }),
  ]);

  if (!from || !to) return { error: "Semaine introuvable" };
  if (from.userId !== session.user.id) return { error: "Ce n'est pas ta semaine" };
  if (from.user.householdId !== session.user.householdId) return { error: "Foyer incorrect" };
  if (to.user.householdId !== session.user.householdId) return { error: "Foyer incorrect" };
  if (from.status === "DONE") return { error: "Cette semaine est déjà validée" };

  // Pas de doublon
  const existing = await prisma.swapRequest.findFirst({
    where: { fromAssignmentId, status: "PENDING" },
  });
  if (existing) return { error: "Une demande est déjà en attente" };

  await prisma.swapRequest.create({
    data: {
      fromAssignmentId,
      toAssignmentId,
      requesterId: session.user.id,
      targetId: to.userId,
    },
  });

  revalidatePath("/menage");
  return { ok: true };
}

// ── Répondre à une demande d'échange ─────────────────────────────────────────

export async function respondToSwap(swapRequestId: string, accept: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const swap = await prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      fromAssignment: true,
      toAssignment: true,
    },
  });

  if (!swap) return { error: "Demande introuvable" };
  if (swap.targetId !== session.user.id) return { error: "Cette demande ne te concerne pas" };
  if (swap.status !== "PENDING") return { error: "Demande déjà traitée" };

  if (accept) {
    // Permuter les userId des deux assignments dans une transaction
    await prisma.$transaction([
      prisma.choreAssignment.update({
        where: { id: swap.fromAssignmentId },
        data: { userId: swap.toAssignment.userId },
      }),
      prisma.choreAssignment.update({
        where: { id: swap.toAssignmentId },
        data: { userId: swap.fromAssignment.userId },
      }),
      prisma.swapRequest.update({
        where: { id: swapRequestId },
        data: { status: "ACCEPTED", resolvedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.swapRequest.update({
      where: { id: swapRequestId },
      data: { status: "DECLINED", resolvedAt: new Date() },
    });
  }

  revalidatePath("/menage");
  revalidatePath("/");
  return { ok: true };
}
