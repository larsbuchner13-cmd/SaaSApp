import { eq } from "drizzle-orm";

import {
  permissionDescriptions,
  permissionKeyValues,
  type PermissionKey,
} from "@/permissions/keys";
import { roleLabels } from "@/permissions/roles";
import { rolePermissionMatrix } from "@/permissions/role-matrix";

import { db } from "./client";
import { permissions, rolePermissions, roleKeyValues, roles } from "./schema";

async function seedRoles() {
  const rows = await Promise.all(
    roleKeyValues.map(async (key) => {
      const [row] = await db
        .insert(roles)
        .values({ key, label: roleLabels[key], isSystem: true })
        .onConflictDoUpdate({
          target: roles.key,
          set: { label: roleLabels[key] },
        })
        .returning();
      return row;
    }),
  );
  return rows;
}

async function seedPermissions() {
  const rows = await Promise.all(
    permissionKeyValues.map(async (key) => {
      const [row] = await db
        .insert(permissions)
        .values({ key, description: permissionDescriptions[key] })
        .onConflictDoUpdate({
          target: permissions.key,
          set: { description: permissionDescriptions[key] },
        })
        .returning();
      return row;
    }),
  );
  return rows;
}

async function seedRolePermissions(
  seededRoles: Array<typeof roles.$inferSelect>,
  seededPermissions: Array<typeof permissions.$inferSelect>,
) {
  for (const role of seededRoles) {
    const allowedKeys = new Set(rolePermissionMatrix[role.key]);
    const grants = seededPermissions.filter((permission) =>
      allowedKeys.has(permission.key as PermissionKey),
    );

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));

    if (grants.length === 0) continue;

    await db.insert(rolePermissions).values(
      grants.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
    );
  }
}

async function main() {
  console.log("Seede Rollen ...");
  const seededRoles = await seedRoles();

  console.log("Seede Berechtigungen ...");
  const seededPermissions = await seedPermissions();

  console.log("Verknuepfe Rollen mit Berechtigungen ...");
  await seedRolePermissions(seededRoles, seededPermissions);

  console.log("Seed abgeschlossen.");
}

main().catch((error) => {
  console.error("Seed fehlgeschlagen:", error);
  process.exit(1);
});
