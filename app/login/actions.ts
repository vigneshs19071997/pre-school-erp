"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users, students, roles } from "@/lib/db";
import { can } from "@/lib/permissions";
import { createSession, destroySession, fingerprint } from "@/lib/auth";
import { fail, type ActionState } from "@/lib/action";
import { str } from "@/lib/utils";

/** Single login for everyone: staff sign in with their Employee ID, parents with their child's Student ID. */
export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id")?.toUpperCase();
  const password = str(fd, "password");
  if (!id || !password) return fail("Enter your ID and password");

  const [u] = await db.select().from(users).where(eq(users.employeeCode, id)).limit(1);
  if (u) {
    if (!(await bcrypt.compare(password, u.passwordHash))) return fail("Wrong ID or password");
    if (u.status !== "active") return fail("Your account is inactive. Please contact the admin.");
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
    await createSession({ kind: "staff", id: u.id, v: fingerprint(u.passwordHash) });
    const [role] = await db.select().from(roles).where(eq(roles.id, u.roleId));
    redirect(can(role?.permissions, "dashboard.view") ? "/admin" : "/admin/my");
  }

  const [s] = await db.select().from(students).where(eq(students.studentCode, id)).limit(1);
  if (s) {
    if (s.status !== "active") return fail("This Student ID is not active. Contact the school.");
    if (!s.parentPasswordHash) return fail("No password yet — tap “First time? Create password”");
    if (!(await bcrypt.compare(password, s.parentPasswordHash))) return fail("Wrong ID or password");
    await db.update(students).set({ parentLastLoginAt: new Date() }).where(eq(students.id, s.id));
    await createSession({ kind: "parent", id: s.id, v: fingerprint(s.parentPasswordHash) });
    redirect("/parent");
  }

  return fail("ID not found");
}

const digits = (v: string) => v.replace(/\D/g, "").slice(-10);

export async function parentSetup(_: ActionState, fd: FormData): Promise<ActionState> {
  const code = str(fd, "studentCode")?.toUpperCase();
  const phone = str(fd, "phone");
  const password = str(fd, "password");
  const confirm = str(fd, "confirm");
  if (!code || !phone || !password) return fail("Please fill in all fields");
  if (password.length < 6) return fail("Password must be at least 6 characters");
  if (password !== confirm) return fail("Passwords do not match");
  const [s] = await db.select().from(students).where(eq(students.studentCode, code)).limit(1);
  if (!s || s.status !== "active") return fail("Student ID not found");
  if (digits(s.parentPhone) !== digits(phone)) return fail("Mobile number does not match school records");
  if (s.parentPasswordHash) return fail("Password already created. Please log in, or ask the school to reset it.");
  const hash = await bcrypt.hash(password, 10);
  await db.update(students).set({ parentPasswordHash: hash, parentLastLoginAt: new Date() }).where(eq(students.id, s.id));
  await createSession({ kind: "parent", id: s.id, v: fingerprint(hash) });
  redirect("/parent");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
