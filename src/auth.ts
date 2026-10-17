import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string;
      color: string;
      role: Role;
      householdId: string;
      email: string | null;
    };
  }
  interface User {
    id: string;
    username: string;
    displayName: string;
    color: string;
    role: Role;
    householdId: string;
    email: string | null;
    emailVerified: Date | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Identifiant" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const username = (credentials?.username as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;

        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await verify(user.passwordHash, password).catch(() => false);
        if (!valid) return null;

        return {
          id: user.id,
          username: user.username!,
          displayName: user.displayName,
          color: user.color,
          role: user.role,
          householdId: user.householdId,
          email: null,
          emailVerified: null,
        };
      },
    }),
  ],
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.displayName = user.displayName;
        token.color = user.color;
        token.role = user.role;
        token.householdId = user.householdId;
      }
      return token;
    },
    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any) = {
        id: token.id,
        username: token.username,
        displayName: token.displayName,
        color: token.color,
        role: token.role,
        householdId: token.householdId,
        email: null,
      };
      return session;
    },
  },
});
