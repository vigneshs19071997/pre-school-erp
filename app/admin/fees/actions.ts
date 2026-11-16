"use server";

import { and, eq, like, sql } from "drizzle-orm";
import { db, feeInvoices, feePayments, students } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, num, today } from "@/lib/utils";

export async function createInvoices(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("fees.manage");
  const title = str(fd, "title"), dueDate = str(fd, "dueDate");
  const amount = num(fd, "amount"), discount = num(fd, "discount");
  const target = str(fd, "target") ?? "";
  if (!title || !dueDate || amount <= 0) return fail("Title, amount and due date are required");
  let ids: number[] = [];
  if (target.startsWith("class:")) {
    const rows = await db.select({ id: students.id }).from(students).where(and(eq(students.classId, Number(target.slice(6))), eq(students.status, "active")));
    ids = rows.map((r) => r.id);
  } else if (target === "all") {
    ids = (await db.select({ id: students.id }).from(students).where(eq(students.status, "active"))).map((r) => r.id);
  } else if (target.startsWith("student:")) ids = [Number(target.slice(8))];
  if (!ids.length) return fail("No students found for this selection");
  const stamp = Date.now().toString(36);
  await db.insert(feeInvoices).values(ids.map((studentId, i) => ({ studentId, title, amount, discount, dueDate, invoiceNo: `TMP-${stamp}-${i}` })));
  await db.update(feeInvoices).set({ invoiceNo: sql`'INV-' || lpad(${feeInvoices.id}::text, 5, '0')` }).where(like(feeInvoices.invoiceNo, `TMP-${stamp}-%`));
  return ok(`${ids.length} invoice(s) created`);
}

export async function recordPayment(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("fees.manage");
  const invoiceId = Number(str(fd, "invoiceId"));
  const amount = num(fd, "amount");
  if (amount <= 0) return fail("Enter the amount received");
  const [inv] = await db.select().from(feeInvoices).where(eq(feeInvoices.id, invoiceId));
  if (!inv) return fail("Invoice not found");
  const balance = inv.amount - inv.discount - inv.paidAmount;
  if (amount > balance + 0.01) return fail(`Amount is more than the balance (₹${balance})`);
  await db.insert(feePayments).values({ invoiceId, amount, method: str(fd, "method") ?? "cash", reference: str(fd, "reference"), paidOn: str(fd, "paidOn") ?? today(), receivedBy: me.id });
  const paid = inv.paidAmount + amount;
  await db.update(feeInvoices).set({ paidAmount: paid, status: paid >= inv.amount - inv.discount - 0.01 ? "paid" : "partial" }).where(eq(feeInvoices.id, invoiceId));
  return ok("Payment recorded 💰");
}

export async function cancelInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("fees.manage");
  const id = Number(str(fd, "id"));
  const [inv] = await db.select().from(feeInvoices).where(eq(feeInvoices.id, id));
  if (inv && inv.paidAmount > 0) return fail("This invoice already has payments");
  await db.update(feeInvoices).set({ status: "cancelled" }).where(eq(feeInvoices.id, id));
  return ok("Invoice cancelled");
}
