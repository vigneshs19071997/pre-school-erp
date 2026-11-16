"use server";

import { and, eq } from "drizzle-orm";
import { db, leaveRequests, staffAttendance } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, addDays } from "@/lib/utils";

export async function reviewLeave(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("leave.approve");
  const id = Number(str(fd, "id"));
  const decision = str(fd, "decision") === "approved" ? "approved" : "rejected";
  const [l] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
  if (!l || l.status !== "pending") return fail("Already reviewed");
  await db.update(leaveRequests).set({ status: decision, reviewedBy: me.id }).where(eq(leaveRequests.id, id));
  if (decision === "approved") {
    // Mark the staff register as "leave" for those days (unpaid leave is counted as loss of pay by payroll)
    for (let d = l.fromDate; d <= l.toDate; d = addDays(d, 1)) {
      const [row] = await db.select({ id: staffAttendance.id }).from(staffAttendance).where(and(eq(staffAttendance.userId, l.userId), eq(staffAttendance.date, d)));
      if (row) await db.update(staffAttendance).set({ status: "leave", note: `${l.type} leave` }).where(eq(staffAttendance.id, row.id));
      else await db.insert(staffAttendance).values({ userId: l.userId, date: d, status: "leave", note: `${l.type} leave` });
    }
  }
  return ok(`Leave ${decision}`);
}
