"use server";

import { and, eq } from "drizzle-orm";
import { db, dailyReports } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, today } from "@/lib/utils";

export async function saveDailyReport(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("daily_reports.manage");
  const studentId = Number(str(fd, "studentId"));
  const date = str(fd, "date") ?? today();
  try {
    const photoKey = await uploadFile(fd.get("photo"), "daily");
    const data = {
      mood: str(fd, "mood"), breakfast: str(fd, "breakfast"), lunch: str(fd, "lunch"), snack: str(fd, "snack"),
      napMinutes: str(fd, "napMinutes") ? Number(str(fd, "napMinutes")) : null,
      activities: str(fd, "activities"), comment: str(fd, "comment"), createdBy: me.id, ...(photoKey ? { photoKey } : {}),
    };
    const [existing] = await db.select({ id: dailyReports.id }).from(dailyReports).where(and(eq(dailyReports.studentId, studentId), eq(dailyReports.date, date)));
    if (existing) await db.update(dailyReports).set(data).where(eq(dailyReports.id, existing.id));
    else await db.insert(dailyReports).values({ ...data, studentId, date });
  } catch (e) { return fail(e instanceof Error ? e.message : "Could not save"); }
  return ok(`Saved ${str(fd, "name") ?? ""}'s day 💛`);
}
