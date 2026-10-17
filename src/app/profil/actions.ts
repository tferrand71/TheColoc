"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = { memoryCost: 65536, timeCost: 3, parallelism: 4 };

export async function toggleChoresReminders(enabled: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { choresRemindersEnabled: enabled },
  });

  revalidatePath("/profil");
  return { ok: true };
}

export async function changePassword(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return { error: "Non connecté" };

  const current = formData.get("current") as string;
  const next = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!current || !next || !confirm) return { error: "Tous les champs sont requis" };
  if (next.length < 8) return { error: "Mot de passe trop court (8 car. min)" };
  if (next !== confirm) return { error: "Les mots de passe ne correspondent pas" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return { error: "Compte non activé" };

  const valid = await verify(user.passwordHash, current);
  if (!valid) return { error: "Mot de passe actuel incorrect" };

  const newHash = await hash(next, ARGON2_OPTIONS);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { ok: true };
}
