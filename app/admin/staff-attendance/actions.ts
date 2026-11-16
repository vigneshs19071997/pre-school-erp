"use server";

import { and, eq } from "drizzle-orm";
import { db, users, staffAttendance } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, today } from "@/lib/utils";

export async function saveStaffRegister(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("staff_attendance.manage");
  const date = str(fd, "date") ?? today();
  if (date > today()) return fail("Can't mark a future date");
  const staff = await db.select({ id: users.id }).from(users).where(eq(users.status, "active"));
  for (const s of staff) {
    const status = str(fd, `s_${s.id}`);
    if (!status) continue;
    const note = str(fd, `n_${s.id}`);
    const [row] = await db.select({ id: staffAttendance.id }).from(staffAttendance).where(and(eq(staffAttendance.userId, s.id), eq(staffAttendance.date, date)));
    if (row) await db.update(staffAttendance).set({ status, note }).where(eq(staffAttendance.id, row.id));
    else await db.insert(staffAttendance).values({ userId: s.id, date, status, note });
  }
  return ok("Staff register saved");
}
