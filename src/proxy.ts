import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/connexion", "/invitation/"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // /api/cron/ vérifie lui-même son Bearer CRON_SECRET
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/cron/");

  if (!req.auth && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Fichiers PWA (service worker, manifest, icônes) chargés par le navigateur sans session
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|swe-worker-.*\\.js|manifest\\.webmanifest|icons/|.*\\.(?:svg|png|ico|webp)$).*)",
  ],
};
