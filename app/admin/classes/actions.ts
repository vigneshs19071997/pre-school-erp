"use server";

import { eq } from "drizzle-orm";
import { db, classes, students } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, num } from "@/lib/utils";

export async function saveClass(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("classes.manage");
  const name = str(fd, "name");
  if (!name) return fail("Class name is required");
  const data = { name, ageGroup: str(fd, "ageGroup"), room: str(fd, "room"), capacity: num(fd, "capacity") || 20,
    teacherId: str(fd, "teacherId") ? Number(str(fd, "teacherId")) : null, color: str(fd, "color") ?? "brand" };
  const id = str(fd, "id");
  if (id) await db.update(classes).set(data).where(eq(classes.id, Number(id)));
  else await db.insert(classes).values(data);
  return ok("Class saved");
}

export async function deleteClass(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("classes.manage");
  const id = Number(str(fd, "id"));
  const [has] = await db.select({ id: students.id }).from(students).where(eq(students.classId, id)).limit(1);
  if (has) return fail("Move the students to another class first");
  await db.delete(classes).where(eq(classes.id, id));
  return ok("Class deleted");
}
