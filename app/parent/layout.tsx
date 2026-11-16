import { requireParent } from "@/lib/auth";
import { getSchool } from "@/lib/school";
import { Shell, type NavGroup } from "@/components/sidebar";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const groups: NavGroup[] = [
  { title: "My child", items: [
    { href: "/parent", label: "Home", icon: "Home" },
    { href: "/parent/reports", label: "Daily Updates", icon: "Smile" },
    { href: "/parent/homework", label: "Homework", icon: "BookOpen" },
    { href: "/parent/progress", label: "Progress", icon: "Award" },
    { href: "/parent/attendance", label: "Attendance", icon: "CalendarCheck" },
  ] },
  { title: "School", items: [
    { href: "/parent/fees", label: "Fees", icon: "IndianRupee" },
    { href: "/parent/notices", label: "Notices & Events", icon: "Bell" },
    { href: "/parent/account", label: "Account", icon: "Settings" },
  ] },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const [s, school] = await Promise.all([requireParent(), getSchool()]);
  return (
    <Shell groups={groups} school={school.name} user={{ name: `${s.firstName}'s parent`, sub: s.studentCode }} logout={logout} accent="coral">
      {children}
    </Shell>
  );
}
