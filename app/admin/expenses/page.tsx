import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { Plus, Paperclip, Trash2, Repeat, Pencil, Receipt as ReceiptIcon, PieChart, CalendarDays } from "lucide-react";
import { db, expenses } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { fileUrl } from "@/lib/storage";
import { materializeRecurringExpenses } from "@/lib/expenses";
import { PageHeader, Card, Badge, Field, Empty, TableWrap, StatCard } from "@/components/ui";
import { ActionForm, SubmitButton, Modal, ActionButton, AutoSubmit } from "@/components/client";
import { Donut } from "@/components/charts";
import { inr, fmtDate, today, currentMonth, monthRange, fmtMonth } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { addExpense, updateExpense, deleteExpense } from "./actions";

const DONUT_TONES = ["brand", "coral", "sun", "mint", "sky", "slate"] as const;
const BAR_TONES: Record<(typeof DONUT_TONES)[number], string> = {
  brand: "bg-brand-500", coral: "bg-coral-500", sun: "bg-sun-500", mint: "bg-mint-500", sky: "bg-sky-500", slate: "bg-slate-500",
};
type Expense = typeof expenses.$inferSelect;

function ExpenseActions({ e }: { e: Expense }) {
  return (
    <>
      {e.receiptKey && <a href={fileUrl(e.receiptKey)!} target="_blank" className="btn-ghost btn-sm"><Paperclip className="h-3.5 w-3.5" /></a>}
      <Modal title="Edit expense" trigger={<Pencil className="h-3.5 w-3.5" />} triggerClass="btn-ghost btn-sm">
        <ActionForm action={updateExpense} className="space-y-4">
          <input type="hidden" name="id" value={e.id} />
          <ExpenseFields e={e} />
          <SubmitButton>Save changes</SubmitButton>
        </ActionForm>
      </Modal>
      <ActionButton action={deleteExpense} fields={{ id: e.id }} confirm="Delete this expense?"><Trash2 className="h-3.5 w-3.5" /></ActionButton>
    </>
  );
}

function ExpenseFields({ e }: { e?: Expense }) {
  return (
    <>
      <Field label="What for? *"><input name="title" required defaultValue={e?.title} className="input" placeholder="Monthly electricity bill" /></Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category *">
          <select name="category" required defaultValue={e?.category} className="input">{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Amount ₹ *"><input type="number" step="0.01" name="amount" min={1} required defaultValue={e?.amount} className="input" /></Field>
        <Field label="Date"><input type="date" name="date" defaultValue={e?.date ?? today()} className="input" /></Field>
        <Field label="Paid via">
          <select name="paymentMethod" defaultValue={e?.paymentMethod ?? undefined} className="input">
            <option>Cash</option><option>UPI</option><option>Bank transfer</option><option>Card</option><option>Cheque</option>
          </select>
        </Field>
        <Field label="Vendor"><input name="vendor" defaultValue={e?.vendor ?? undefined} className="input" /></Field>
        <Field label={e?.receiptKey ? "Replace bill / receipt" : "Bill / receipt"}><input type="file" name="receipt" accept="image/*,.pdf" className="input text-xs" /></Field>
      </div>
      {e?.receiptKey && <a href={fileUrl(e.receiptKey)!} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"><Paperclip className="h-3 w-3" />Current receipt</a>}
      <Field label="Notes"><textarea name="notes" rows={2} defaultValue={e?.notes ?? undefined} className="input" /></Field>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="recurring" value="yes" defaultChecked={e?.isRecurring} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400" />
        Repeat this expense every month
      </label>
    </>
  );
}

export default async function Expenses({ searchParams }: { searchParams: Promise<{ month?: string; category?: string }> }) {
  await requireStaff("expenses.manage");
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();
  const { start, end } = monthRange(month);
  await materializeRecurringExpenses(month);
  const where: SQL[] = [gte(expenses.date, start), lte(expenses.date, end)];
  if (sp.category) where.push(eq(expenses.category, sp.category));
  const [rows, [recurring]] = await Promise.all([
    db.select().from(expenses).where(and(...where)).orderBy(desc(expenses.date), desc(expenses.id)),
    db.select({ s: sql<number>`coalesce(sum(${expenses.amount}),0)` }).from(expenses).where(eq(expenses.isRecurring, true)),
  ]);
  const total = rows.reduce((a, r) => a + r.amount, 0);
  const byCat = Object.entries(rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.category]: (a[r.category] ?? 0) + r.amount }), {})).sort((a, b) => b[1] - a[1]);
  const max = byCat[0]?.[1] || 1;
  const elapsedDays = month === currentMonth() ? Number(today().slice(8, 10)) : monthRange(month).days;
  const avgPerDay = total / elapsedDays;

  return (
    <>
      <PageHeader title="Expenses" emoji="🧾" subtitle={`${fmtMonth(month)} · ${inr(total)} spent`}>
        <Modal title="Add expense" trigger={<><Plus className="h-4 w-4" />Add expense</>}>
          <ActionForm action={addExpense} className="space-y-4">
            <ExpenseFields />
            <SubmitButton>Save expense</SubmitButton>
          </ActionForm>
        </Modal>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spent this month" value={inr(total)} icon={ReceiptIcon} tone="coral" hint={fmtMonth(month)} />
        <StatCard label="Top category" value={byCat[0]?.[0] ?? "—"} icon={PieChart} tone="sun" hint={byCat[0] ? inr(byCat[0][1]) : undefined} />
        <StatCard label="Recurring, monthly" value={inr(recurring?.s ?? 0)} icon={Repeat} tone="sky" hint="Active repeat expenses" />
        <StatCard label="Daily average" value={inr(avgPerDay)} icon={CalendarDays} tone="mint" hint={`Over ${elapsedDays} day(s)`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card padded={false} className="xl:col-span-2">
          <AutoSubmit className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
            <input type="month" name="month" defaultValue={month} className="input w-auto" />
            <select name="category" defaultValue={sp.category ?? ""} className="input w-auto"><option value="">All categories</option>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </AutoSubmit>
          {rows.length ? (
            <>
              {/* Mobile: card list, no horizontal scrolling needed */}
              <ul className="divide-y divide-slate-100 sm:hidden">
                {rows.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-semibold">
                        {e.title}
                        {(e.isRecurring || e.recurringSourceId) && <Repeat className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-label="Recurring monthly" />}
                      </p>
                      <p className="text-xs text-slate-500">{fmtDate(e.date, { day: "numeric", month: "short" })} · {[e.vendor, e.paymentMethod].filter(Boolean).join(" · ")}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><Badge tone="sky">{e.category}</Badge>{e.recurringSourceId && e.amount === 0 && <Badge tone="sun">Needs amount</Badge>}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold">{inr(e.amount)}</p>
                      <div className="mt-2 flex justify-end gap-1"><ExpenseActions e={e} /></div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop/tablet: full table */}
              <TableWrap className="hidden sm:block">
                <table className="table">
                  <thead><tr><th>Date</th><th>Expense</th><th>Category</th><th>Amount</th><th /></tr></thead>
                  <tbody>
                    {rows.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap">{fmtDate(e.date, { day: "numeric", month: "short" })}</td>
                        <td>
                          <p className="flex items-center gap-1.5 font-semibold">
                            {e.title}
                            {(e.isRecurring || e.recurringSourceId) && <Repeat className="h-3.5 w-3.5 text-brand-500" aria-label="Recurring monthly" />}
                          </p>
                          <p className="text-xs text-slate-500">{[e.vendor, e.paymentMethod].filter(Boolean).join(" · ")}</p>
                        </td>
                        <td><Badge tone="sky">{e.category}</Badge></td>
                        <td className="font-semibold">
                          {inr(e.amount)}
                          {e.recurringSourceId && e.amount === 0 && <span className="ml-2 inline-block"><Badge tone="sun">Needs amount</Badge></span>}
                        </td>
                        <td className="whitespace-nowrap text-right"><ExpenseActions e={e} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </>
          ) : <Empty title="No expenses this month" emoji="🪙" />}
        </Card>

        <Card title="Where the money went">
          {byCat.length ? (
            <>
              <Donut center={inr(total)} sub="total" data={byCat.map(([name, value], i) => ({ name, value, color: DONUT_TONES[i % DONUT_TONES.length] }))} />
              <ul className="mt-4 space-y-3">
                {byCat.map(([c, v], i) => (
                  <li key={c}>
                    <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{c}</span><span>{inr(v)} · {total > 0 ? Math.round((v / total) * 100) : 0}%</span></div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${BAR_TONES[DONUT_TONES[i % DONUT_TONES.length]]}`} style={{ width: `${(v / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : <Empty title="Nothing yet" emoji="📊" />}
        </Card>
      </div>
    </>
  );
}
