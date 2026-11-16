"use server";

import { and, eq } from "drizzle-orm";
import { db, progressReports } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";
import { AREAS } from "@/lib/constants";

export async function saveProgress(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("progress.manage");
  const studentId = Number(str(fd, "studentId"));
  const term = str(fd, "term");
  if (!studentId || !term) return fail("Choose a student and term");
  let n = 0;
  for (const [i, area] of AREAS.entries()) {
    const rating = Number(str(fd, `r_${i}`));
    if (!rating) continue;
    const remarks = str(fd, `m_${i}`);
    await db.delete(progressReports).where(and(eq(progressReports.studentId, studentId), eq(progressReports.term, term), eq(progressReports.area, area)));
    await db.insert(progressReports).values({ studentId, term, area, rating, remarks, createdBy: me.id });
    n++;
  }
  return n ? ok("Progress saved ⭐") : fail("Give at least one rating");
}
