import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db, announcements, classes, users } from "@/lib/db";
import type { Student } from "@/lib/db";

export async function childClass(s: Student) {
  if (!s.classId) return null;
  const [row] = await db.select({ c: classes, teacher: users.name }).from(classes).leftJoin(users, eq(classes.teacherId, users.id)).where(eq(classes.id, s.classId));
  return row ?? null;
}

export function parentNotices(s: Student, limit = 20) {
  return db.select().from(announcements)
    .where(and(inArray(announcements.audience, ["all", "parents"]), s.classId ? or(isNull(announcements.classId), eq(announcements.classId, s.classId)) : isNull(announcements.classId)))
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt)).limit(limit);
}
