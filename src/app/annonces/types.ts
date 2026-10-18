import { CalendarDays, DoorOpen, Hammer, Info, Pin, type LucideIcon } from "lucide-react";
import type { AnnouncementType } from "@/generated/prisma/client";

export const ANNOUNCEMENT_TYPES: Record<AnnouncementType, { label: string; icon: LucideIcon }> = {
  REUNION:     { label: "Réunion",     icon: CalendarDays },
  VISITE:      { label: "Visite",      icon: DoorOpen },
  TRAVAUX:     { label: "Travaux",     icon: Hammer },
  INFORMATION: { label: "Information", icon: Info },
  AUTRE:       { label: "Autre",       icon: Pin },
};
