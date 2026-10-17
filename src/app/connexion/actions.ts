"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { checkRateLimit, recordFailure, recordSuccess } from "@/lib/rate-limit";

export type ConnexionFormState = {
  error?: string;
};

export async function login(
  _prev: ConnexionFormState,
  formData: FormData
): Promise<ConnexionFormState> {
  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!username || !password) {
    return { error: "Identifiant et mot de passe requis." };
  }

  const key = `login:${username.toLowerCase()}`;
  const { allowed, retryAfterMs } = checkRateLimit(key);

  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return {
      error: `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      recordFailure(key);
      return { error: "Identifiant ou mot de passe incorrect." };
    }
    // signIn réussie → NEXT_REDIRECT, on le laisse remonter
    recordSuccess(key);
    throw e;
  }

  return {};
}
