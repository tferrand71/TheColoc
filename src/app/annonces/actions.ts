"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AnnouncementType, AnnouncementAnswer } from "@/generated/prisma/client";

// ── Publier une annonce (propriétaire) ───────────────────────────────────────

export async function createAnnouncement(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROPRIETAIRE") return { error: "Accès refusé" };

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const type = formData.get("type") as AnnouncementType;
  const eventAtRaw = formData.get("eventAt") as string;

  if (!title || !body || !type) return { error: "Champs requis manquants" };

  const announcement = await prisma.announcement.create({
    data: {
      householdId: session.user.householdId,
      authorId: session.user.id,
      title,
      body,
      type,
      eventAt: eventAtRaw ? new Date(eventAtRaw) : undefined,
    },
  });

  revalidatePath("/annonces");
  revalidatePath("/");
  return { ok: true, id: announcement.id };
}

// ── Archiver une annonce ─────────────────────────────────────────────────────

export async function archiveAnnouncement(announcementId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROPRIETAIRE") return { error: "Accès refusé" };

  const ann = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!ann || ann.householdId !== session.user.householdId) return { error: "Annonce introuvable" };

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/annonces");
  return { ok: true };
}

// ── Répondre à une annonce (coloc) ────────────────────────────────────────────

export async function respondToAnnouncement(
  announcementId: string,
  answer: AnnouncementAnswer
) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };
  if (session.user.role === "PROPRIETAIRE") return { error: "Accès refusé" };

  const ann = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!ann || ann.householdId !== session.user.householdId) return { error: "Annonce introuvable" };

  await prisma.announcementResponse.upsert({
    where: { announcementId_userId: { announcementId, userId: session.user.id } },
    create: {
      announcementId,
      userId: session.user.id,
      answer,
      readAt: new Date(),
      respondedAt: new Date(),
    },
    update: { answer, respondedAt: new Date() },
  });

  revalidatePath(`/annonces/${announcementId}`);
  revalidatePath("/annonces");
  return { ok: true };
}

// ── Marquer comme lu (sans répondre) ─────────────────────────────────────────

export async function markAnnouncementRead(announcementId: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "PROPRIETAIRE") return { ok: true };

  await prisma.announcementResponse.upsert({
    where: { announcementId_userId: { announcementId, userId: session.user.id } },
    create: { announcementId, userId: session.user.id, readAt: new Date() },
    update: { readAt: new Date() },
  });

  return { ok: true };
}
