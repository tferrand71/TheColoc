"use server";

import { hash } from "@node-rs/argon2";
import { findInvitationByToken } from "@/lib/invitation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

export type InvitationFormState = {
  errors?: {
    username?: string;
    password?: string;
    confirm?: string;
    token?: string;
  };
};

export async function activateAccount(
  token: string,
  _prev: InvitationFormState,
  formData: FormData
): Promise<InvitationFormState> {
  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  // Validation côté serveur
  const errors: InvitationFormState["errors"] = {};

  if (!USERNAME_RE.test(username)) {
    errors.username =
      "3 à 20 caractères, lettres, chiffres, tirets et underscores uniquement.";
  }
  if (password.length < 8) {
    errors.password = "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (password !== confirm) {
    errors.confirm = "Les mots de passe ne correspondent pas.";
  }

  if (Object.keys(errors).length > 0) return { errors };

  // Re-vérification du token (sécurité : le token doit encore être valide)
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    return { errors: { token: "Ce lien est invalide ou a déjà été utilisé." } };
  }

  // Unicité de l'identifiant dans le foyer
  const existing = await prisma.user.findFirst({
    where: {
      username,
      householdId: invitation.user.householdId,
    },
  });
  if (existing) {
    return { errors: { username: "Cet identifiant est déjà pris, choisis-en un autre." } };
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  // Transaction : mise à jour du compte + invalidation du lien
  await prisma.$transaction([
    prisma.user.update({
      where: { id: invitation.userId },
      data: { username, passwordHash },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Connexion automatique — signIn lève NEXT_REDIRECT, la fonction ne revient jamais ici
  await signIn("credentials", { username, password, redirectTo: "/" });
  return {}; // unreachable, satisfait TypeScript
}
