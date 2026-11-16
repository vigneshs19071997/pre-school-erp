import {
  pgTable, serial, text, integer, boolean, numeric, date, timestamp, jsonb, uniqueIndex, index, type AnyPgColumn,
} from "drizzle-orm/pg-core";

const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

/* ---------------- Settings ---------------- */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/* ---------------- Roles & Staff ---------------- */
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: createdAt(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  employeeCode: text("employee_code").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id").notNull().references(() => roles.id),
  designation: text("designation"),
  department: text("department"),
  joinDate: date("join_date"),
  status: text("status").notNull().default("active"), // active | inactive
  photoKey: text("photo_key"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  ifsc: text("ifsc"),
  basicSalary: money("basic_salary").notNull().default(0),
  allowances: money("allowances").notNull().default(0),
  deductions: money("deductions").notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/* ---------------- Classes & Students ---------------- */
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ageGroup: text("age_group"),
  room: text("room"),
  capacity: integer("capacity").notNull().default(20),
  teacherId: integer("teacher_id").references(() => users.id),
  color: text("color").notNull().default("brand"),
  createdAt: createdAt(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentCode: text("student_code").notNull().unique(), // parent login username
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  dob: date("dob"),
  gender: text("gender"),
  classId: integer("class_id").references(() => classes.id),
  photoKey: text("photo_key"),
  bloodGroup: text("blood_group"),
  medicalNotes: text("medical_notes"),
  address: text("address"),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  parentPhone: text("parent_phone").notNull(),
  parentEmail: text("parent_email"),
  admissionDate: date("admission_date"),
  status: text("status").notNull().default("active"), // active | withdrawn | graduated
  parentPasswordHash: text("parent_password_hash"),
  parentLastLoginAt: timestamp("parent_last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/* ---------------- Admissions (enquiries) ---------------- */
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  childName: text("child_name").notNull(),
  childDob: date("child_dob"),
  parentName: text("parent_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  programInterest: text("program_interest"),
  source: text("source"), // walk-in, website, referral, social, other
  status: text("status").notNull().default("new"), // new | contacted | visit | admitted | lost
  notes: text("notes"),
  followUpDate: date("follow_up_date"),
  createdAt: createdAt(),
});

/* ---------------- Attendance ---------------- */
export const studentAttendance = pgTable("student_attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: text("status").notNull(), // present | absent | late | leave
  note: text("note"),
  markedBy: integer("marked_by").references(() => users.id),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("student_att_unique").on(t.studentId, t.date), index("student_att_date").on(t.date)]);

export const staffAttendance = pgTable("staff_attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  checkIn: timestamp("check_in", { withTimezone: true }),
  checkOut: timestamp("check_out", { withTimezone: true }),
  status: text("status").notNull().default("present"), // present | absent | half_day | leave
  note: text("note"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("staff_att_unique").on(t.userId, t.date), index("staff_att_date").on(t.date)]);

/* ---------------- Learning ---------------- */
export const homework = pgTable("homework", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subject: text("subject"),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  attachmentKey: text("attachment_key"),
  attachmentName: text("attachment_name"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: createdAt(),
});

export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  mood: text("mood"), // happy | calm | tired | upset | excited
  breakfast: text("breakfast"), // all | some | none
  lunch: text("lunch"),
  snack: text("snack"),
  napMinutes: integer("nap_minutes"),
  activities: text("activities"),
  comment: text("comment"),
  photoKey: text("photo_key"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("daily_report_unique").on(t.studentId, t.date)]);

export const progressReports = pgTable("progress_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  area: text("area").notNull(),
  rating: integer("rating").notNull(), // 1..5
  remarks: text("remarks"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("progress_unique").on(t.studentId, t.term, t.area)]);

/* ---------------- Finance ---------------- */
export const feeInvoices = pgTable("fee_invoices", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull().unique(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  amount: money("amount").notNull(),
  discount: money("discount").notNull().default(0),
  paidAmount: money("paid_amount").notNull().default(0),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending | partial | paid | cancelled
  createdAt: createdAt(),
});

export const feePayments = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => feeInvoices.id, { onDelete: "cascade" }),
  amount: money("amount").notNull(),
  method: text("method").notNull(), // cash | upi | card | bank | cheque
  reference: text("reference"),
  paidOn: date("paid_on").notNull(),
  receivedBy: integer("received_by").references(() => users.id),
  createdAt: createdAt(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  amount: money("amount").notNull(),
  date: date("date").notNull(),
  paymentMethod: text("payment_method"),
  vendor: text("vendor"),
  receiptKey: text("receipt_key"),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringSourceId: integer("recurring_source_id").references((): AnyPgColumn => expenses.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: createdAt(),
});

/* ---------------- HR ---------------- */
export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // YYYY-MM
  basic: money("basic").notNull(),
  allowances: money("allowances").notNull().default(0),
  bonus: money("bonus").notNull().default(0),
  deductions: money("deductions").notNull().default(0),
  lopDays: numeric("lop_days", { precision: 5, scale: 1, mode: "number" }).notNull().default(0),
  lopAmount: money("lop_amount").notNull().default(0),
  netPay: money("net_pay").notNull(),
  status: text("status").notNull().default("draft"), // draft | paid
  paidOn: date("paid_on"),
  paymentRef: text("payment_ref"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("payroll_unique").on(t.userId, t.month)]);

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // casual | sick | earned | unpaid
  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: createdAt(),
});

/* ---------------- Communication ---------------- */
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: text("audience").notNull().default("all"), // all | parents | staff
  classId: integer("class_id").references(() => classes.id, { onDelete: "set null" }),
  pinned: boolean("pinned").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: createdAt(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  type: text("type").notNull().default("event"), // holiday | event | ptm | celebration
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Role = typeof roles.$inferSelect;
