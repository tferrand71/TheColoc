import type { MessageTag } from "@/generated/prisma/client";

export const TAG_CONFIG: Record<MessageTag, { label: string; className: string }> = {
  MENAGE:  { label: "Ménage",  className: "badge-ok" },
  BRUIT:   { label: "Bruit",   className: "badge-down" },
  ARGENT:  { label: "Argent",  className: "badge-pink" },
  GENERAL: { label: "Général", className: "badge-mauve" },
};
