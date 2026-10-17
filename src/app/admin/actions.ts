"use server";

import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ARGON2_OPTIONS = { memoryCost: 65536, timeCost: 3, parallelism: 4 };
const INVITATION_TTL_DAYS = 7;

export type RegenerateResult =
  | { ok: true; token: string; userId: string }
  | { ok: false; error: string };

export async function regenerateInvitation(userId: string): Promise<RegenerateResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { ok: false, error: "Accès refusé." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Utilisateur introuvable." };

  const token = randomBytes(32).toString("hex");
  const tokenHash = await hash(token, ARGON2_OPTIONS);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Remplace l'invitation existante (ou en crée une nouvelle)
  await prisma.invitation.upsert({
    where: { userId },
    update: { tokenHash, expiresAt, usedAt: null },
    create: { userId, tokenHash, expiresAt },
  });

  return { ok: true, token, userId };
}
