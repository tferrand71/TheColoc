import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json() as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    userAgent?: string;
  };

  const { endpoint, keys } = body.subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: body.userAgent ?? null,
    },
    update: {
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: body.userAgent ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
