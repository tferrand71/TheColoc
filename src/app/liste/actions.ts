"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Signaler qu'il en faut ────────────────────────────────────────────────────

export async function needItem(name: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nom invalide" };

  const { id: authorId, householdId } = session.user;

  // Réactive un item existant (même nom, même foyer, consommable)
  const existing = await prisma.listItem.findFirst({
    where: { householdId, name: { equals: trimmed, mode: "insensitive" }, category: "CONSOMMABLE" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.listItem.update({
      where: { id: existing.id },
      data: { needed: true, boughtAt: null, assigneeId: null },
    });
  } else {
    await prisma.listItem.create({
      data: { householdId, name: trimmed, category: "CONSOMMABLE", authorId },
    });
  }

  revalidatePath("/liste");
  revalidatePath("/");
  return { ok: true };
}

// ── Assigner quelqu'un ────────────────────────────────────────────────────────

export async function assignItem(itemId: string, assigneeId: string | null) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const item = await prisma.listItem.findUnique({ where: { id: itemId } });
  if (!item || item.householdId !== session.user.householdId) return { error: "Item introuvable" };

  await prisma.listItem.update({ where: { id: itemId }, data: { assigneeId } });

  revalidatePath("/liste");
  return { ok: true };
}

// ── Cocher (acheté) ───────────────────────────────────────────────────────────

export async function markBought(itemId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const item = await prisma.listItem.findUnique({ where: { id: itemId } });
  if (!item || item.householdId !== session.user.householdId) return { error: "Item introuvable" };

  await prisma.listItem.update({
    where: { id: itemId },
    data: { boughtAt: new Date(), needed: false },
  });

  revalidatePath("/liste");
  revalidatePath("/");
  return { ok: true };
}

// ── Supprimer un item ─────────────────────────────────────────────────────────

export async function deleteItem(itemId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const item = await prisma.listItem.findUnique({ where: { id: itemId } });
  if (!item || item.householdId !== session.user.householdId) return { error: "Item introuvable" };

  await prisma.listItem.delete({ where: { id: itemId } });

  revalidatePath("/liste");
  return { ok: true };
}
