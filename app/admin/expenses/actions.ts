"use server";

import { eq } from "drizzle-orm";
import { db, expenses } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/storage";
import { ok, fail, type ActionState } from "@/lib/action";
import { str, num, today } from "@/lib/utils";

export async function addExpense(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireStaff("expenses.manage");
  const title = str(fd, "title"), category = str(fd, "category"), amount = num(fd, "amount");
  if (!title || !category || amount <= 0) return fail("Title, category and amount are required");
  try {
    const receiptKey = await uploadFile(fd.get("receipt"), "expenses");
    await db.insert(expenses).values({
      title, category, amount, date: str(fd, "date") ?? today(), paymentMethod: str(fd, "paymentMethod"), vendor: str(fd, "vendor"),
      notes: str(fd, "notes"), receiptKey, isRecurring: str(fd, "recurring") === "yes", createdBy: me.id,
    });
  } catch (e) { return fail(e instanceof Error ? e.message : "Could not save"); }
  return ok("Expense added");
}

export async function updateExpense(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("expenses.manage");
  const id = Number(str(fd, "id"));
  const title = str(fd, "title"), category = str(fd, "category"), amount = num(fd, "amount");
  if (!title || !category || amount <= 0) return fail("Title, category and amount are required");
  try {
    const receiptKey = await uploadFile(fd.get("receipt"), "expenses");
    if (receiptKey) {
      const [old] = await db.select({ k: expenses.receiptKey }).from(expenses).where(eq(expenses.id, id));
      await deleteFile(old?.k);
    }
    await db.update(expenses).set({
      title, category, amount, date: str(fd, "date") ?? today(), paymentMethod: str(fd, "paymentMethod"), vendor: str(fd, "vendor"),
      notes: str(fd, "notes"), isRecurring: str(fd, "recurring") === "yes", ...(receiptKey ? { receiptKey } : {}),
    }).where(eq(expenses.id, id));
  } catch (e) { return fail(e instanceof Error ? e.message : "Could not save"); }
  return ok("Expense updated");
}

export async function deleteExpense(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireStaff("expenses.manage");
  const id = Number(str(fd, "id"));
  const [e] = await db.select().from(expenses).where(eq(expenses.id, id));
  await deleteFile(e?.receiptKey);
  await db.delete(expenses).where(eq(expenses.id, id));
  return ok("Expense deleted");
}
