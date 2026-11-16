"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, students } from "@/lib/db";
import { requireParent, createSession, fingerprint } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";

export async function changeParentPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const s = await requireParent();
  const current = str(fd, "current") ?? "", next = str(fd, "next") ?? "";
  if (next.length < 6) return fail("New password must be at least 6 characters");
  if (next !== str(fd, "confirm")) return fail("Passwords do not match");
  if (!(await bcrypt.compare(current, s.parentPasswordHash!))) return fail("Current password is wrong");
  const hash = await bcrypt.hash(next, 10);
  await db.update(students).set({ parentPasswordHash: hash }).where(eq(students.id, s.id));
  await createSession({ kind: "parent", id: s.id, v: fingerprint(hash) });
  return ok("Password changed");
}
