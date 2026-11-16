"use server";

import { eq, sql } from "drizzle-orm";
import { db, roles, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/permissions";

export async function saveRole(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("roles.manage");
  const name = str(fd, "name");
  if (!name) return fail("Role name is required");
  const valid = new Set<string>(PERMISSIONS.map((p) => p.key));
  const permissions = fd.getAll("perm").map(String).filter((p) => valid.has(p));
  const id = str(fd, "id");
  try {
    if (id) {
      const [r] = await db.select().from(roles).where(eq(roles.id, Number(id)));
      if (r?.isSystem) return fail("The Administrator role always has full access");
      await db.update(roles).set({ name, description: str(fd, "description"), permissions }).where(eq(roles.id, Number(id)));
    } else await db.insert(roles).values({ name, description: str(fd, "description"), permissions });
  } catch { return fail("A role with this name already exists"); }
  return ok("Role saved");
}

export async function deleteRole(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("roles.manage");
  const id = Number(str(fd, "id"));
  const [r] = await db.select().from(roles).where(eq(roles.id, id));
  if (r?.isSystem) return fail("System role can't be deleted");
  const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(users).where(eq(users.roleId, id));
  if (Number(c) > 0) return fail("Move staff to another role first");
  await db.delete(roles).where(eq(roles.id, id));
  return ok("Role deleted");
}
