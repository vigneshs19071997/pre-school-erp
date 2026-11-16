"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, LineChart, Line,
} from "recharts";

const C = { brand: "#2b6b4d", coral: "#b5465c", sun: "#c18a2e", mint: "#1f8f74", sky: "#3c5a92", slate: "#94a3b8" };
const inrShort = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);
const tip = { contentStyle: { borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(16,47,35,.15)", fontSize: 12 } };

export function FinanceChart({ data }: { data: { month: string; income: number; expense: number; salary: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.mint} stopOpacity={0.35} /><stop offset="1" stopColor={C.mint} stopOpacity={0} /></linearGradient>
          <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.coral} stopOpacity={0.3} /><stop offset="1" stopColor={C.coral} stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={inrShort} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip {...tip} formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="income" name="Fee income" stroke={C.mint} strokeWidth={2.5} fill="url(#gi)" />
        <Area type="monotone" dataKey="expense" name="Expenses" stroke={C.coral} strokeWidth={2.5} fill="url(#ge)" />
        <Area type="monotone" dataKey="salary" name="Salaries" stroke={C.brand} strokeWidth={2} fill="transparent" strokeDasharray="5 4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FunnelBars({ data }: { data: { name: string; value: number }[] }) {
  const colors = [C.brand, C.sky, C.sun, C.mint, C.coral];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
        <Tooltip {...tip} cursor={{ fill: "#f0f7f3" }} />
        <Bar dataKey="value" name="Families" radius={[0, 8, 8, 0]} barSize={22}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClassBars({ data }: { data: { name: string; students: number; capacity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -20, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip {...tip} cursor={{ fill: "#f0f7f3" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="students" name="Enrolled" fill={C.brand} radius={[8, 8, 0, 0]} barSize={22} />
        <Bar dataKey="capacity" name="Capacity" fill="#dbebe1" radius={[8, 8, 0, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, center, sub }: { data: { name: string; value: number; color: keyof typeof C }[]; center: string; sub: string }) {
  const has = data.some((d) => d.value > 0);
  const rows = has ? data : [{ name: "No data", value: 1, color: "slate" as const }];
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={has ? 3 : 0} stroke="none">
            {rows.map((d, i) => <Cell key={i} fill={C[d.color]} />)}
          </Pie>
          {has && <Tooltip {...tip} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold text-slate-800">{center}</span>
        <span className="text-xs text-slate-500">{sub}</span>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: C[d.color] }} />{d.name} <b>{d.value}</b></span>
        ))}
      </div>
    </div>
  );
}

export function ProgressRadar({ data }: { data: { area: string; rating: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: "#475569" }} />
        <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
        <Radar dataKey="rating" stroke={C.brand} fill={C.brand} fillOpacity={0.3} strokeWidth={2} />
        <Tooltip {...tip} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data, color = "brand", suffix = "%" }: { data: { label: string; value: number }[]; color?: keyof typeof C; suffix?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip {...tip} formatter={(v) => `${v}${suffix}`} />
        <Line type="monotone" dataKey="value" name="Attendance" stroke={C[color]} strokeWidth={3} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
