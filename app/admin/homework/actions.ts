"use server";

import { eq } from "drizzle-orm";
import { db, homework } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/storage";
import { ok, fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";

export async function createHomework(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("homework.manage");
  const title = str(fd, "title"), classId = str(fd, "classId");
  if (!title || !classId) return fail("Class and title are required");
  try {
    const file = fd.get("file");
    const key = await uploadFile(file, "homework");
    await db.insert(homework).values({
      classId: Number(classId), title, subject: str(fd, "subject"), description: str(fd, "description"), dueDate: str(fd, "dueDate"),
      attachmentKey: key, attachmentName: key && file instanceof File ? file.name : null, createdBy: me.id,
    });
  } catch (e) { return fail(e instanceof Error ? e.message : "Upload failed"); }
  return ok("Homework posted — parents can see it now 📚");
}

export async function deleteHomework(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("homework.manage");
  const id = Number(str(fd, "id"));
  const [h] = await db.select().from(homework).where(eq(homework.id, id));
  await deleteFile(h?.attachmentKey);
  await db.delete(homework).where(eq(homework.id, id));
  return ok("Deleted");
}
