import { asc, eq } from "drizzle-orm";
import { db, classes } from "@/lib/db";
import type { StaffSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

/** Teachers see only the classes assigned to them; admins / office staff see all. */
export async function allowedClasses(me: StaffSession) {
  const all = await db.select().from(classes).orderBy(asc(classes.id));
  if (can(me.permissions, "students.manage")) return all;
  const mine = all.filter((c) => c.teacherId === me.id);
  return mine.length ? mine : all;
}

export async function classById(id: number) {
  const [c] = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
  return c ?? null;
}
