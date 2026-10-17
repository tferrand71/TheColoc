/**
 * Config Auth.js utilisable dans le middleware Edge (pas de binaires natifs).
 * Pas d'import de prisma ni d'argon2 ici.
 */
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

export const authConfig: NextAuthConfig = {
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Les autres champs sont déjà dans le JWT signé
      }
      return token;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  pages: {
    signIn: "/connexion",
  },
};

// Re-export du type Role pour usage dans le middleware si besoin
export type { Role };
