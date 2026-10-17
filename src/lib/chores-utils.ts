import type { User } from "@/generated/prisma/client";

// Epoch de référence : samedi 18 octobre 2026 (première semaine de l'app)
export const ROTATION_EPOCH = new Date("2026-10-18T00:00:00.000Z");

/**
 * Retourne le samedi 00:00 UTC de la semaine contenant `date`.
 * La semaine va du samedi au vendredi.
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Dim … 6=Sam
  const offset = day === 6 ? 0 : -(day + 1);
  d.setUTCDate(d.getUTCDate() + offset);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Retourne les n prochains weekStart (semaine courante incluse). */
export function getUpcomingWeeks(n = 4): Date[] {
  const current = getWeekStart();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(current);
    d.setUTCDate(d.getUTCDate() + i * 7);
    return d;
  });
}

/**
 * Retourne l'utilisateur assigné à une semaine donnée selon la rotation.
 */
export function getUserForWeek(
  weekStart: Date,
  colocs: Pick<User, "id" | "rotationOrder">[]
): Pick<User, "id" | "rotationOrder"> {
  const sorted = [...colocs].sort(
    (a, b) => (a.rotationOrder ?? 99) - (b.rotationOrder ?? 99)
  );
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekIndex = Math.round(
    (weekStart.getTime() - ROTATION_EPOCH.getTime()) / weekMs
  );
  const idx = ((weekIndex % sorted.length) + sorted.length) % sorted.length;
  return sorted[idx];
}

/** Formate une date weekStart en label lisible (ex: "18 oct. – 24 oct.") */
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  return `${weekStart.toLocaleDateString("fr-FR", opts)} – ${end.toLocaleDateString("fr-FR", opts)}`;
}
