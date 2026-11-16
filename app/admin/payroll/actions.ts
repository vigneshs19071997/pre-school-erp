"use server";

import { and, eq, gte, lte, inArray } from "drizzle-orm";
import { db, users, payrolls, staffAttendance, leaveRequests } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, num, today, monthRange } from "@/lib/utils";

const round = (n: number) => Math.round(n * 100) / 100;

/** Creates draft payroll for every active staff member who doesn't have one for the month.
 *  Loss of pay = absent days + ½ per half day + approved unpaid leave days in the month. */
export async function generatePayroll(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("payroll.manage");
  const month = str(fd, "month");
  if (!month) return fail("Choose a month");
  const { start, end, days } = monthRange(month);
  const staff = await db.select().from(users).where(eq(users.status, "active"));
  const existing = new Set((await db.select({ u: payrolls.userId }).from(payrolls).where(eq(payrolls.month, month))).map((r) => r.u));
  const todo = staff.filter((s) => !existing.has(s.id));
  if (!todo.length) return ok("Payroll already generated for everyone");
  const ids = todo.map((s) => s.id);
  const [att, leaves] = await Promise.all([
    db.select().from(staffAttendance).where(and(inArray(staffAttendance.userId, ids), gte(staffAttendance.date, start), lte(staffAttendance.date, end))),
    db.select().from(leaveRequests).where(and(inArray(leaveRequests.userId, ids), eq(leaveRequests.status, "approved"), eq(leaveRequests.type, "unpaid"), lte(leaveRequests.fromDate, end), gte(leaveRequests.toDate, start))),
  ]);
  const values = todo.map((s) => {
    const mine = att.filter((a) => a.userId === s.id);
    let lop = mine.filter((a) => a.status === "absent").length + mine.filter((a) => a.status === "half_day").length * 0.5;
    for (const l of leaves.filter((x) => x.userId === s.id)) {
      const from = l.fromDate > start ? l.fromDate : start, to = l.toDate < end ? l.toDate : end;
      lop += (new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1;
    }
    const gross = s.basicSalary + s.allowances;
    const lopAmount = round((gross / days) * lop);
    return { userId: s.id, month, basic: s.basicSalary, allowances: s.allowances, deductions: s.deductions, bonus: 0, lopDays: lop, lopAmount,
      netPay: round(Math.max(0, gross - s.deductions - lopAmount)) };
  });
  await db.insert(payrolls).values(values);
  return ok(`Payroll drafted for ${values.length} staff`);
}

export async function updatePayroll(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("payroll.manage");
  const id = Number(str(fd, "id"));
  const [p] = await db.select().from(payrolls).where(eq(payrolls.id, id));
  if (!p) return fail("Not found");
  if (p.status === "paid") return fail("Already paid — can't edit");
  const bonus = num(fd, "bonus"), deductions = num(fd, "deductions"), lopAmount = num(fd, "lopAmount"), lopDays = num(fd, "lopDays");
  const netPay = round(Math.max(0, p.basic + p.allowances + bonus - deductions - lopAmount));
  await db.update(payrolls).set({ bonus, deductions, lopAmount, lopDays, netPay }).where(eq(payrolls.id, id));
  return ok("Payroll updated");
}

export async function markPaid(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("payroll.manage");
  const ids = String(fd.get("ids") ?? "").split(",").map(Number).filter(Boolean);
  if (!ids.length) return fail("Nothing to pay");
  await db.update(payrolls).set({ status: "paid", paidOn: str(fd, "paidOn") ?? today(), paymentRef: str(fd, "paymentRef") })
    .where(and(inArray(payrolls.id, ids), eq(payrolls.status, "draft")));
  return ok(`Salary credited for ${ids.length} staff 🎉`);
}

export async function deleteDraft(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("payroll.manage");
  await db.delete(payrolls).where(and(eq(payrolls.id, Number(str(fd, "id"))), eq(payrolls.status, "draft")));
  return ok("Draft removed");
}
