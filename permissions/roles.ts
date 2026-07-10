import type { RoleKey } from "@/db/schema";

export const roleLabels: Record<RoleKey, string> = {
  owner: "Owner",
  administrator: "Administrator",
  buero: "Büro",
  mitarbeiter: "Mitarbeiter",
  steuerberater: "Steuerberater",
};
