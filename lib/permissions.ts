export const PERMISSIONS = [
  { key: "dashboard.view", label: "View dashboard & reports", group: "General" },
  { key: "students.manage", label: "Add / edit students", group: "Students" },
  { key: "admissions.manage", label: "Admission enquiries", group: "Students" },
  { key: "classes.manage", label: "Manage classes", group: "Students" },
  { key: "student_attendance.mark", label: "Take student attendance", group: "Classroom" },
  { key: "homework.manage", label: "Post homework", group: "Classroom" },
  { key: "daily_reports.manage", label: "Write daily reports & comments", group: "Classroom" },
  { key: "progress.manage", label: "Update progress reports", group: "Classroom" },
  { key: "fees.manage", label: "Fees & payments", group: "Finance" },
  { key: "expenses.manage", label: "Expenses", group: "Finance" },
  { key: "staff.manage", label: "Add / edit staff", group: "HR" },
  { key: "staff_attendance.manage", label: "Staff attendance register", group: "HR" },
  { key: "payroll.manage", label: "Payroll & salary credits", group: "HR" },
  { key: "leave.approve", label: "Approve leave requests", group: "HR" },
  { key: "announcements.manage", label: "Announcements", group: "Communication" },
  { key: "events.manage", label: "Events & holidays calendar", group: "Communication" },
  { key: "roles.manage", label: "Roles & permissions", group: "Admin" },
  { key: "settings.manage", label: "School settings", group: "Admin" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];

export function can(perms: string[] | undefined, p: Permission) {
  if (!perms) return false;
  return perms.includes("*") || perms.includes(p);
}
