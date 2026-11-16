import { desc, eq } from "drizzle-orm";
import { db, dailyReports, users } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { fileUrl } from "@/lib/storage";
import { PageHeader, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { MOOD_EMOJI, MEAL_LABEL } from "@/lib/constants";

export default async function Reports() {
  const s = await requireParent();
  const rows = await db.select({ r: dailyReports, by: users.name }).from(dailyReports).leftJoin(users, eq(dailyReports.createdBy, users.id))
    .where(eq(dailyReports.studentId, s.id)).orderBy(desc(dailyReports.date)).limit(60);
  return (
    <>
      <PageHeader title="Daily updates" emoji="🌻" subtitle={`What ${s.firstName} did, ate and enjoyed each day`} />
      {rows.length ? (
        <ol className="relative space-y-5 border-l-2 border-dashed border-brand-200 pl-6">
          {rows.map(({ r, by }) => (
            <li key={r.id} className="relative">
              <span className="absolute -left-[37px] grid h-9 w-9 place-items-center rounded-full bg-white text-xl shadow-soft">{MOOD_EMOJI[r.mood ?? ""] ?? "🙂"}</span>
              <div className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-lg font-semibold">{fmtDate(r.date, { weekday: "long", day: "numeric", month: "long" })}</p>
                  <p className="text-xs text-slate-400">by {by ?? "Teacher"}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {r.mood && <span className="rounded-full bg-sun-100 px-2.5 py-1 font-semibold capitalize text-sun-600">Mood: {r.mood}</span>}
                  {(["breakfast", "lunch", "snack"] as const).map((m) => r[m] && <span key={m} className="rounded-full bg-mint-100 px-2.5 py-1 font-semibold text-mint-600"><span className="capitalize">{m}</span>: {MEAL_LABEL[r[m]!]}</span>)}
                  {r.napMinutes ? <span className="rounded-full bg-sky-100 px-2.5 py-1 font-semibold text-sky-600">Nap {r.napMinutes} min</span> : null}
                </div>
                {r.activities && <p className="mt-3 text-sm"><b>Activities:</b> {r.activities}</p>}
                {r.comment && <p className="mt-2 rounded-xl bg-brand-50 p-3 text-sm italic text-slate-700">“{r.comment}”</p>}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.photoKey && <img src={fileUrl(r.photoKey)!} alt="" className="mt-3 max-h-64 rounded-xl object-cover" />}
              </div>
            </li>
          ))}
        </ol>
      ) : <div className="card"><Empty title="No updates yet" emoji="🌤️" /></div>}
    </>
  );
}
