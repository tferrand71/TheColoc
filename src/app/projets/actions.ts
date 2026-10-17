"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Créer un projet ───────────────────────────────────────────────────────────

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!title) return { error: "Titre requis" };

  const project = await prisma.project.create({
    data: {
      householdId: session.user.householdId,
      title,
      description,
      authorId: session.user.id,
    },
  });

  revalidatePath("/projets");
  return { ok: true, id: project.id };
}

// ── Changer le statut ─────────────────────────────────────────────────────────

export async function setProjectStatus(
  projectId: string,
  status: "IDEA" | "IN_PROGRESS" | "DONE"
) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.householdId !== session.user.householdId) return { error: "Projet introuvable" };

  await prisma.project.update({ where: { id: projectId }, data: { status } });

  revalidatePath("/projets");
  revalidatePath(`/projets/${projectId}`);
  return { ok: true };
}

// ── Ajouter un item à un projet ───────────────────────────────────────────────

export async function addProjectItem(projectId: string, name: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Nom invalide" };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.householdId !== session.user.householdId) return { error: "Projet introuvable" };

  await prisma.listItem.create({
    data: {
      householdId: session.user.householdId,
      name: trimmed,
      category: "PROJET",
      projectId,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/projets/${projectId}`);
  return { ok: true };
}

// ── Cocher un item de projet ──────────────────────────────────────────────────

export async function markProjectItemDone(itemId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const item = await prisma.listItem.findUnique({ where: { id: itemId } });
  if (!item || item.householdId !== session.user.householdId) return { error: "Item introuvable" };

  await prisma.listItem.update({
    where: { id: itemId },
    data: { boughtAt: new Date(), needed: false },
  });

  if (item.projectId) revalidatePath(`/projets/${item.projectId}`);
  return { ok: true };
}

// ── Ajouter un commentaire ────────────────────────────────────────────────────

export async function addComment(projectId: string, body: string) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Commentaire vide" };

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.householdId !== session.user.householdId) return { error: "Projet introuvable" };

  await prisma.comment.create({
    data: {
      authorId: session.user.id,
      body: trimmed,
      targetType: "PROJECT",
      projectId,
    },
  });

  revalidatePath(`/projets/${projectId}`);
  return { ok: true };
}
