import { verify } from "@node-rs/argon2";
import { prisma } from "@/lib/prisma";

/**
 * Trouve l'invitation correspondant au token en clair.
 * Itère sur toutes les invitations valides et vérifie avec argon2.
 * Acceptable pour ≤ 10 utilisateurs (usage rare, page d'invitation).
 */
export async function findInvitationByToken(token: string) {
  const validInvitations = await prisma.invitation.findMany({
    where: {
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  for (const invitation of validInvitations) {
    const matches = await verify(invitation.tokenHash, token).catch(() => false);
    if (matches) return invitation;
  }

  return null;
}
