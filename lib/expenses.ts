import { and, eq, gte, lte, lt } from "drizzle-orm";
import { db, expenses } from "@/lib/db";
import { monthRange, monthDate } from "@/lib/utils";

/**
 * Ensures every recurring expense template has an instance in `month`. Safe to call on every
 * page load: templates created on/after this month are skipped (the template row itself covers
 * its own creation month), and a template already instantiated for this month is not duplicated.
 *
 * The amount does NOT carry over — bills like electricity vary month to month, so each new
 * instance starts at 0 and the admin fills in that month's real amount via Edit.
 */
export async function materializeRecurringExpenses(month: string) {
  const { start, end } = monthRange(month);
  const templates = await db.select().from(expenses).where(and(eq(expenses.isRecurring, true), lt(expenses.date, start)));
  for (const t of templates) {
    const [existing] = await db.select({ id: expenses.id }).from(expenses)
      .where(and(eq(expenses.recurringSourceId, t.id), gte(expenses.date, start), lte(expenses.date, end)));
    if (existing) continue;
    const day = Number(t.date.slice(8, 10));
    await db.insert(expenses).values({
      category: t.category, title: t.title, amount: 0, date: monthDate(month, day),
      paymentMethod: t.paymentMethod, vendor: t.vendor, notes: t.notes,
      isRecurring: false, recurringSourceId: t.id, createdBy: t.createdBy,
    });
  }
}
