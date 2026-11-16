"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, num } from "@/lib/utils";

export async function saveStaff(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("staff.manage");
  const id = str(fd, "id") ? Number(str(fd, "id")) : null;
  const name = str(fd, "name"), email = str(fd, "email")?.toLowerCase(), roleId = Number(str(fd, "roleId"));
  const password = str(fd, "password");
  if (!name || !email || !roleId) return fail("Name, email and role are required");
  if (!id && (!password || password.length < 6)) return fail("Set a password of at least 6 characters");
  const [dupe] = await db.select({ id: users.id }).from(users).where(and(eq(sql`lower(${users.email})`, email), id ? ne(users.id, id) : sql`true`));
  if (dupe) return fail("Another staff member already uses this email");
  if (id === me.id && str(fd, "status") === "inactive") return fail("You can't deactivate your own account");
  const data = {
    name, email, roleId, phone: str(fd, "phone"), designation: str(fd, "designation"), department: str(fd, "department"),
    joinDate: str(fd, "joinDate"), address: str(fd, "address"), emergencyContact: str(fd, "emergencyContact"),
    bankName: str(fd, "bankName"), bankAccount: str(fd, "bankAccount"), ifsc: str(fd, "ifsc"),
    basicSalary: num(fd, "basicSalary"), allowances: num(fd, "allowances"), deductions: num(fd, "deductions"),
    status: str(fd, "status") ?? "active",
  };
  try {
    const photoKey = await uploadFile(fd.get("photo"), "staff/photos");
    const extra = { ...(photoKey ? { photoKey } : {}), ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) };
    if (id) await db.update(users).set({ ...data, ...extra }).where(eq(users.id, id));
    else {
      const [{ c }] = await db.select({ c: sql<number>`coalesce(max(${users.id}),0)` }).from(users);
      await db.insert(users).values({ ...data, ...extra, passwordHash: extra.passwordHash!, employeeCode: `EMP${String(Number(c) + 1).padStart(3, "0")}` });
    }
  } catch (e) { return fail(e instanceof Error ? e.message : "Could not save"); }
  return ok(id ? "Staff updated" : "Staff added — share their Employee ID & password so they can log in");
}
