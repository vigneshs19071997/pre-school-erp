"use server";

import { eq } from "drizzle-orm";
import { db, enquiries } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";

export async function saveEnquiry(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("admissions.manage");
  const childName = str(fd, "childName"), parentName = str(fd, "parentName"), phone = str(fd, "phone");
  if (!childName || !parentName || !phone) return fail("Child name, parent name and phone are required");
  const data = {
    childName, parentName, phone, childDob: str(fd, "childDob"), email: str(fd, "email"), programInterest: str(fd, "programInterest"),
    source: str(fd, "source"), notes: str(fd, "notes"), followUpDate: str(fd, "followUpDate"), status: str(fd, "status") ?? "new",
  };
  const id = str(fd, "id");
  if (id) await db.update(enquiries).set(data).where(eq(enquiries.id, Number(id)));
  else await db.insert(enquiries).values(data);
  return ok(id ? "Enquiry updated" : "Enquiry added");
}

export async function moveEnquiry(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("admissions.manage");
  await db.update(enquiries).set({ status: str(fd, "status") ?? "new" }).where(eq(enquiries.id, Number(str(fd, "id"))));
  return ok("Moved");
}

export async function deleteEnquiry(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("admissions.manage");
  await db.delete(enquiries).where(eq(enquiries.id, Number(str(fd, "id"))));
  return ok("Enquiry deleted");
}
