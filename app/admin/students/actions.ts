"use server";

import { redirect } from "next/navigation";
import { eq, like, sql } from "drizzle-orm";
import { db, students, enquiries } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/storage";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, today } from "@/lib/utils";

async function nextStudentCode() {
  const prefix = (process.env.STUDENT_ID_PREFIX || "PS").toUpperCase() + today().slice(0, 4);
  const [row] = await db.select({ m: sql<string | null>`max(${students.studentCode})` }).from(students).where(like(students.studentCode, `${prefix}%`));
  const seq = row?.m ? Number(row.m.slice(prefix.length)) + 1 : 1;
  return prefix + String(seq).padStart(4, "0");
}

function readForm(fd: FormData) {
  return {
    firstName: str(fd, "firstName") ?? "",
    lastName: str(fd, "lastName"),
    dob: str(fd, "dob"),
    gender: str(fd, "gender"),
    classId: str(fd, "classId") ? Number(str(fd, "classId")) : null,
    bloodGroup: str(fd, "bloodGroup"),
    medicalNotes: str(fd, "medicalNotes"),
    address: str(fd, "address"),
    fatherName: str(fd, "fatherName"),
    motherName: str(fd, "motherName"),
    parentPhone: str(fd, "parentPhone") ?? "",
    parentEmail: str(fd, "parentEmail"),
    admissionDate: str(fd, "admissionDate") ?? today(),
  };
}

export async function createStudent(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("students.manage");
  const data = readForm(fd);
  if (!data.firstName || !data.parentPhone) return fail("Child's first name and parent mobile are required");
  let id: number;
  try {
    const photoKey = await uploadFile(fd.get("photo"), "students/photos");
    const [row] = await db.insert(students).values({ ...data, photoKey, studentCode: await nextStudentCode() }).returning({ id: students.id });
    id = row.id;
    const enquiryId = str(fd, "enquiryId");
    if (enquiryId) await db.update(enquiries).set({ status: "admitted" }).where(eq(enquiries.id, Number(enquiryId)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not save");
  }
  redirect(`/admin/students/${id}?created=1`);
}

export async function updateStudent(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("students.manage");
  const id = Number(str(fd, "id"));
  const data = readForm(fd);
  if (!data.firstName || !data.parentPhone) return fail("Child's first name and parent mobile are required");
  try {
    const photoKey = await uploadFile(fd.get("photo"), "students/photos");
    if (photoKey) {
      const [old] = await db.select({ k: students.photoKey }).from(students).where(eq(students.id, id));
      await deleteFile(old?.k);
    }
    await db.update(students).set({ ...data, status: str(fd, "status") ?? "active", ...(photoKey ? { photoKey } : {}) }).where(eq(students.id, id));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not save");
  }
  redirect(`/admin/students/${id}`);
}

export async function resetParentPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("students.manage");
  await db.update(students).set({ parentPasswordHash: null }).where(eq(students.id, Number(str(fd, "id"))));
  return ok("Parent password reset. They can create a new one at first login.");
}
