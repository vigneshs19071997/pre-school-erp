"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Coffee, Users, UserPlus, School, CalendarCheck, BookOpen, Smile, Award, IndianRupee, Receipt,
  Briefcase, Clock, Wallet, Plane, Megaphone, Calendar, Shield, Settings, Menu, X, LogOut, Home, ClipboardList, BarChart3, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const icons = {
  LayoutDashboard, Coffee, Users, UserPlus, School, CalendarCheck, BookOpen, Smile, Award, IndianRupee, Receipt,
  Briefcase, Clock, Wallet, Plane, Megaphone, Calendar, Shield, Settings, Home, ClipboardList, BarChart3, Bell,
};
export type NavItem = { href: string; label: string; icon: keyof typeof icons };
export type NavGroup = { title: string; items: NavItem[] };

export function Shell({ groups, school, user, logout, children, accent = "brand" }: {
  groups: NavGroup[]; school: string; user: { name: string; sub: string };
  logout: () => Promise<void>; children: React.ReactNode; accent?: "brand" | "coral";
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => href === path || (href !== "/admin" && href !== "/parent" && path.startsWith(href + "/")) || (href !== "/admin" && href !== "/parent" && path === href);

  const nav = (
    <nav className="flex h-full flex-col">
      <Link href={groups[0]?.items[0]?.href ?? "/"} className="flex items-center gap-3 px-5 py-5">
        <Logo initial={school[0]?.toUpperCase()} tone={accent} size={40} />
        <span className="font-display text-lg font-semibold leading-tight text-slate-800">{school}</span>
      </Link>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.title}</p>
            {g.items.map((i) => {
              const Icon = icons[i.icon];
              const active = isActive(i.href);
              return (
                <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
                  className={cn("group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    active ? "bg-brand-600 text-white shadow-md shadow-brand-600/25" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700")}>
                  <Icon className={cn("h-[18px] w-[18px]", active ? "text-white" : "text-slate-400 group-hover:text-brand-600")} />
                  {i.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sun-100 font-display font-semibold text-sun-600">{user.name[0]}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.sub}</p>
          </div>
          <form action={logout}><button className="btn-ghost btn-sm" title="Log out"><LogOut className="h-4 w-4" /></button></form>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-100 bg-white lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="animate-pop absolute inset-y-0 left-0 w-72 bg-white">{nav}</aside>
        </div>
      )}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
        <button className="btn-ghost btn-sm" onClick={() => setOpen(true)} aria-label="Menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <span className="font-display font-semibold">{school}</span>
      </header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
