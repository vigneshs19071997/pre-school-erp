"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db, staffAttendance, leaveRequests, users } from "@/lib/db";
import { requireStaff, createSession, fingerprint } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, today } from "@/lib/utils";
import { getGeofence, distanceMeters } from "@/lib/geo";

/** Returns an error message if the submitted coordinates aren't within the school's geofence, otherwise null. */
async function checkLocation(fd: FormData) {
  const lat = Number(str(fd, "lat"));
  const lng = Number(str(fd, "lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Couldn't read your location. Enable location access in your browser and try again.";
  const geo = await getGeofence();
  if (geo.lat === null || geo.lng === null) return "The school's location isn't set up yet. Ask the admin to set it in Settings.";
  const d = distanceMeters(lat, lng, geo.lat, geo.lng);
  if (d > geo.radius) return `You're about ${Math.round(d)}m from school — move within ${geo.radius}m to continue.`;
  return null;
}

export async function checkIn(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const locErr = await checkLocation(fd);
  if (locErr) return fail(locErr);
  const d = today();
  const [row] = await db.select().from(staffAttendance).where(and(eq(staffAttendance.userId, me.id), eq(staffAttendance.date, d)));
  if (row?.checkIn) return fail("Already checked in today");
  if (row) await db.update(staffAttendance).set({ checkIn: new Date(), status: "present" }).where(eq(staffAttendance.id, row.id));
  else await db.insert(staffAttendance).values({ userId: me.id, date: d, checkIn: new Date(), status: "present" });
  return ok("Checked in — have a lovely day! 🌞");
}

export async function checkOut(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const locErr = await checkLocation(fd);
  if (locErr) return fail(locErr);
  const [row] = await db.select().from(staffAttendance).where(and(eq(staffAttendance.userId, me.id), eq(staffAttendance.date, today())));
  if (!row?.checkIn) return fail("Please check in first");
  await db.update(staffAttendance).set({ checkOut: new Date() }).where(eq(staffAttendance.id, row.id));
  return ok("Checked out. See you tomorrow! 👋");
}

export async function applyLeave(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const fromDate = str(fd, "fromDate"), toDate = str(fd, "toDate"), type = str(fd, "type") ?? "casual";
  if (!fromDate || !toDate) return fail("Choose the dates");
  if (toDate < fromDate) return fail("End date is before start date");
  await db.insert(leaveRequests).values({ userId: me.id, type, fromDate, toDate, reason: str(fd, "reason") });
  return ok("Leave request sent for approval");
}

export async function changeMyPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff();
  const current = str(fd, "current") ?? "", next = str(fd, "next") ?? "";
  if (next.length < 6) return fail("New password must be at least 6 characters");
  if (!(await bcrypt.compare(current, me.passwordHash))) return fail("Current password is wrong");
  const hash = await bcrypt.hash(next, 10);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, me.id));
  await createSession({ kind: "staff", id: me.id, v: fingerprint(hash) });
  return ok("Password changed");
}
