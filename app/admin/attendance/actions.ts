"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db, students, studentAttendance } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, today } from "@/lib/utils";

export async function saveStudentAttendance(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("student_attendance.mark");
  const classId = Number(str(fd, "classId"));
  const date = str(fd, "date") ?? today();
  if (date > today()) return fail("You can't mark attendance for a future date");
  const kids = await db.select({ id: students.id }).from(students).where(and(eq(students.classId, classId), eq(students.status, "active")));
  if (!kids.length) return fail("No students in this class");
  const values = kids.map((k) => ({
    studentId: k.id, date, status: str(fd, `s_${k.id}`) ?? "present", note: str(fd, `n_${k.id}`), markedBy: me.id,
  }));
  await db.delete(studentAttendance).where(and(eq(studentAttendance.date, date), inArray(studentAttendance.studentId, kids.map((k) => k.id))));
  await db.insert(studentAttendance).values(values);
  const absent = values.filter((v) => v.status === "absent").length;
  return ok(`Attendance saved · ${values.length - absent} present, ${absent} absent`);
}
