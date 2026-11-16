"use server";

import { eq } from "drizzle-orm";
import { db, events } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";

export async function addEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("events.manage");
  const title = str(fd, "title"), date = str(fd, "date");
  if (!title || !date) return fail("Title and date are required");
  await db.insert(events).values({ title, date, type: str(fd, "type") ?? "event", description: str(fd, "description") });
  return ok("Added to calendar 📅");
}
export async function deleteEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("events.manage");
  await db.delete(events).where(eq(events.id, Number(str(fd, "id"))));
  return ok("Removed");
}
