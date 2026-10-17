"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { MessageTag } from "@/generated/prisma/client";

// ── Poster un message ─────────────────────────────────────────────────────────

export async function postMessage(body: string, tag: MessageTag | null) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message vide" };
  if (trimmed.length > 2000) return { error: "Message trop long (2000 car. max)" };

  const { id: authorId, householdId } = session.user;

  const message = await prisma.message.create({
    data: { householdId, authorId, body: trimmed, tag: tag ?? undefined },
  });

  // Extraire les @mentions et créer les entrées Mention
  const mentioned = extractMentions(trimmed);
  if (mentioned.length > 0) {
    const colocs = await prisma.user.findMany({
      where: { householdId, username: { in: mentioned } },
      select: { id: true, username: true },
    });
    // Une seule mention par personne, pas d'auto-mention
    const unique = colocs.filter((c) => c.id !== authorId);
    if (unique.length > 0) {
      await prisma.mention.createMany({
        data: unique.map((c) => ({
          sourceType: "MESSAGE" as const,
          sourceId: message.id,
          userId: c.id,
          messageId: message.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  revalidatePath("/fil");
  revalidatePath("/");
  return { ok: true, id: message.id };
}

// ── Modifier un message (≤ 5 min) ────────────────────────────────────────────

export async function editMessage(messageId: string, body: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Message vide" };

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { error: "Message introuvable" };
  if (message.authorId !== session.user.id) return { error: "Pas ton message" };
  if (message.householdId !== session.user.householdId) return { error: "Foyer incorrect" };

  const ageMs = Date.now() - message.createdAt.getTime();
  if (ageMs > 5 * 60 * 1000) return { error: "Délai de modification dépassé (5 min)" };

  await prisma.message.update({
    where: { id: messageId },
    data: { body: trimmed, editedAt: new Date() },
  });

  revalidatePath("/fil");
  return { ok: true };
}

// ── Supprimer un message ──────────────────────────────────────────────────────

export async function deleteMessage(messageId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { _count: { select: { reactions: true } } },
  });
  if (!message) return { error: "Message introuvable" };
  if (message.authorId !== session.user.id) return { error: "Pas ton message" };
  if (message.householdId !== session.user.householdId) return { error: "Foyer incorrect" };
  if (message._count.reactions > 0) return { error: "Impossible de supprimer un message avec des réactions" };

  await prisma.message.delete({ where: { id: messageId } });

  revalidatePath("/fil");
  return { ok: true };
}

// ── Réagir / retirer une réaction ─────────────────────────────────────────────

export async function toggleReaction(messageId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const existing = await prisma.reaction.findUnique({
    where: { userId_messageId: { userId: session.user.id, messageId } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.householdId !== session.user.householdId) return { error: "Message introuvable" };
    await prisma.reaction.create({ data: { userId: session.user.id, messageId } });
  }

  revalidatePath("/fil");
  return { ok: true };
}

// ── Utilitaire : extrait les @usernames d'un corps de message ─────────────────

function extractMentions(body: string): string[] {
  const matches = body.match(/@([a-zA-Z0-9_-]{3,20})/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
