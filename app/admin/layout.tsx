import { requireStaff } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import { getSchool } from "@/lib/school";
import { Shell, type NavGroup, type NavItem } from "@/components/sidebar";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const NAV: { title: string; items: (NavItem & { perm?: Permission })[] }[] = [
  { title: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", perm: "dashboard.view" },
    { href: "/admin/my", label: "My Desk", icon: "Coffee" },
  ] },
  { title: "Students", items: [
    { href: "/admin/students", label: "Students", icon: "Users", perm: "students.manage" },
    { href: "/admin/admissions", label: "Admissions", icon: "UserPlus", perm: "admissions.manage" },
    { href: "/admin/classes", label: "Classes", icon: "School", perm: "classes.manage" },
  ] },
  { title: "Classroom", items: [
    { href: "/admin/attendance", label: "Attendance", icon: "CalendarCheck", perm: "student_attendance.mark" },
    { href: "/admin/homework", label: "Homework", icon: "BookOpen", perm: "homework.manage" },
    { href: "/admin/daily-reports", label: "Daily Reports", icon: "Smile", perm: "daily_reports.manage" },
    { href: "/admin/progress", label: "Progress", icon: "Award", perm: "progress.manage" },
  ] },
  { title: "Finance", items: [
    { href: "/admin/fees", label: "Fees", icon: "IndianRupee", perm: "fees.manage" },
    { href: "/admin/expenses", label: "Expenses", icon: "Receipt", perm: "expenses.manage" },
  ] },
  { title: "HR", items: [
    { href: "/admin/staff", label: "Staff", icon: "Briefcase", perm: "staff.manage" },
    { href: "/admin/staff-attendance", label: "Staff Attendance", icon: "Clock", perm: "staff_attendance.manage" },
    { href: "/admin/payroll", label: "Payroll", icon: "Wallet", perm: "payroll.manage" },
    { href: "/admin/leaves", label: "Leave Requests", icon: "Plane", perm: "leave.approve" },
  ] },
  { title: "Communication", items: [
    { href: "/admin/announcements", label: "Announcements", icon: "Megaphone", perm: "announcements.manage" },
    { href: "/admin/events", label: "Events & Holidays", icon: "Calendar", perm: "events.manage" },
  ] },
  { title: "Admin", items: [
    { href: "/admin/roles", label: "Roles & Access", icon: "Shield", perm: "roles.manage" },
    { href: "/admin/settings", label: "Settings", icon: "Settings", perm: "settings.manage" },
  ] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [me, school] = await Promise.all([requireStaff(), getSchool()]);
  const groups: NavGroup[] = NAV.map((g) => ({
    title: g.title,
    items: g.items.filter((i) => !i.perm || can(me.permissions, i.perm)).map(({ href, label, icon }) => ({ href, label, icon })),
  })).filter((g) => g.items.length);
  return (
    <Shell groups={groups} school={school.name} user={{ name: me.name, sub: me.roleName }} logout={logout}>
      {children}
    </Shell>
  );
}
