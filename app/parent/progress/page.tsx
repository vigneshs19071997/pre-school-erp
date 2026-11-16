import { eq } from "drizzle-orm";
import { db, progressReports } from "@/lib/db";
import { requireParent } from "@/lib/auth";
import { PageHeader, Card, Empty, Pills } from "@/components/ui";
import { ProgressRadar } from "@/components/charts";
import { AREAS, TERMS, RATING_LABELS } from "@/lib/constants";

export default async function ParentProgress({ searchParams }: { searchParams: Promise<{ term?: string }> }) {
  const s = await requireParent();
  const rows = await db.select().from(progressReports).where(eq(progressReports.studentId, s.id));
  const terms = TERMS.filter((t) => rows.some((r) => r.term === t));
  const term = (await searchParams).term ?? terms[terms.length - 1] ?? TERMS[0];
  const cur = new Map(rows.filter((r) => r.term === term).map((r) => [r.area, r]));
  return (
    <>
      <PageHeader title="Progress" emoji="⭐" subtitle={`How ${s.firstName} is growing across learning areas`} />
      {terms.length > 0 && <Pills active={term} items={terms.map((t) => ({ key: t, label: t, href: `?term=${encodeURIComponent(t)}` }))} />}
      {cur.size ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={term}><ProgressRadar data={AREAS.map((a) => ({ area: a.split(" ")[0], rating: cur.get(a)?.rating ?? 0 }))} /></Card>
          <Card title="Teacher's notes" padded={false}>
            <ul className="divide-y divide-slate-100">
              {AREAS.filter((a) => cur.has(a)).map((a) => {
                const r = cur.get(a)!;
                return (
                  <li key={a} className="px-5 py-3">
                    <div className="flex items-center justify-between"><p className="font-semibold">{a}</p><span className="text-sun-500">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></span></div>
                    <p className="text-xs font-semibold text-brand-600">{RATING_LABELS[r.rating]}</p>
                    {r.remarks && <p className="mt-1 text-sm text-slate-600">{r.remarks}</p>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      ) : <div className="card"><Empty title="Progress report not published yet" text="Teachers update this every term." emoji="🌱" /></div>}
    </>
  );
}
