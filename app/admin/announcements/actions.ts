"use server";

import { eq } from "drizzle-orm";
import { db, announcements } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";

export async function postAnnouncement(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("announcements.manage");
  const title = str(fd, "title"), body = str(fd, "body");
  if (!title || !body) return fail("Title and message are required");
  await db.insert(announcements).values({ title, body, audience: str(fd, "audience") ?? "all", classId: str(fd, "classId") ? Number(str(fd, "classId")) : null, pinned: fd.get("pinned") === "on", createdBy: me.id });
  return ok("Announcement published 📣");
}

export async function deleteAnnouncement(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("announcements.manage");
  await db.delete(announcements).where(eq(announcements.id, Number(str(fd, "id"))));
  return ok("Deleted");
}
