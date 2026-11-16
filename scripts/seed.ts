/**
 * npm run db:seed            → roles, first admin, classes, settings
 * npm run db:seed -- --demo  → also adds sample staff, students and a few months of activity
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  db, roles, users, classes, settings, students, enquiries, studentAttendance, staffAttendance, feeInvoices, feePayments,
  expenses, payrolls, events, announcements, homework, dailyReports, progressReports,
} from "../lib/db";

const demo = process.argv.includes("--demo");
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

async function main() {
  console.log("🌱 Seeding…");

  // Roles
  const roleDefs = [
    { name: "Administrator", description: "Full access to everything", permissions: ["*"], isSystem: true },
    { name: "Teacher", description: "Class attendance, homework, daily reports and progress", permissions: ["students.manage", "student_attendance.mark", "homework.manage", "daily_reports.manage", "progress.manage"] },
    { name: "Accountant", description: "Fees, expenses and payroll", permissions: ["dashboard.view", "fees.manage", "expenses.manage", "payroll.manage"] },
    { name: "Front Office", description: "Admissions, students and announcements", permissions: ["dashboard.view", "students.manage", "admissions.manage", "announcements.manage", "events.manage", "fees.manage"] },
  ];
  for (const r of roleDefs) await db.insert(roles).values(r).onConflictDoNothing();
  const allRoles = await db.select().from(roles);
  const roleId = (n: string) => allRoles.find((r) => r.name === n)!.id;

  // Admin
  const email = (process.env.ADMIN_EMAIL || "admin@school.com").toLowerCase();
  const [exists] = await db.select().from(users).where(eq(users.email, email));
  if (!exists) {
    await db.insert(users).values({
      employeeCode: "EMP001", name: "School Admin", email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@123", 10),
      roleId: roleId("Administrator"), designation: "Principal", department: "Administration", joinDate: daysAgo(400), basicSalary: 45000, allowances: 5000,
    });
    console.log(`👤 Admin created: ${email}`);
  }

  // Settings
  for (const [key, value] of Object.entries({ name: process.env.SCHOOL_NAME || "Little Sprouts Preschool", tagline: "Where little minds grow big" })) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing();
  }

  // Classes
  if (!(await db.select().from(classes).limit(1)).length) {
    await db.insert(classes).values([
      { name: "Playgroup", ageGroup: "1.5 – 2.5 yrs", room: "Sunflower Room", capacity: 15, color: "sun" },
      { name: "Nursery", ageGroup: "2.5 – 3.5 yrs", room: "Rainbow Room", capacity: 20, color: "coral" },
      { name: "LKG", ageGroup: "3.5 – 4.5 yrs", room: "Butterfly Room", capacity: 25, color: "brand" },
      { name: "UKG", ageGroup: "4.5 – 5.5 yrs", room: "Star Room", capacity: 25, color: "mint" },
    ]);
  }

  if (demo) await seedDemo(roleId);
  console.log("✅ Done");
}

async function seedDemo(roleId: (n: string) => number) {
  if ((await db.select().from(students).limit(1)).length) { console.log("Demo data already present, skipping"); return; }
  console.log("🎈 Adding demo data…");
  const pw = await bcrypt.hash("Staff@123", 10);
  const staffSeed = [
    ["Priya Raman", "priya@school.com", "Teacher", "Class Teacher", 22000], ["Divya Krishnan", "divya@school.com", "Teacher", "Class Teacher", 21000],
    ["Meena Sundar", "meena@school.com", "Teacher", "Class Teacher", 20000], ["Kavitha Rao", "kavitha@school.com", "Teacher", "Class Teacher", 20000],
    ["Arun Kumar", "arun@school.com", "Accountant", "Accounts Officer", 25000], ["Lakshmi Devi", "lakshmi@school.com", "Front Office", "Front Office", 16000],
  ] as const;
  const staff = await db.insert(users).values(staffSeed.map(([name, email, role, des, sal], i) => ({
    employeeCode: `EMP${String(i + 2).padStart(3, "0")}`, name, email, passwordHash: pw, roleId: roleId(role), designation: des,
    department: role === "Teacher" ? "Teaching" : "Administration", joinDate: daysAgo(300 - i * 20), basicSalary: sal, allowances: 2000, deductions: 1200,
    bankName: "Indian Bank", bankAccount: `6012345678${i}`, ifsc: "IDIB000T012", phone: `98400${10000 + i}`,
  }))).returning();
  const cls = await db.select().from(classes);
  for (const [i, c] of cls.entries()) await db.update(classes).set({ teacherId: staff[i]?.id }).where(eq(classes.id, c.id));

  const first = ["Aarav", "Diya", "Vihaan", "Anika", "Kabir", "Ira", "Reyansh", "Saanvi", "Arjun", "Myra", "Advik", "Kiara", "Ishaan", "Aadhya", "Dhruv", "Navya", "Yuvan", "Tara", "Rudra", "Mahi", "Nila", "Kavin", "Yazhini", "Inian"];
  const last = ["Kumar", "Sharma", "Iyer", "Reddy", "Nair", "Menon", "Pillai", "Raj"];
  const prefix = (process.env.STUDENT_ID_PREFIX || "PS").toUpperCase() + new Date().getFullYear();
  const kids = await db.insert(students).values(first.map((f, i) => ({
    studentCode: prefix + String(i + 1).padStart(4, "0"), firstName: f, lastName: pick(last), gender: i % 2 ? "Girl" : "Boy",
    dob: daysAgo(365 * (2 + (i % 4)) + i * 9), classId: cls[i % cls.length].id, parentPhone: `9876${String(500000 + i)}`,
    fatherName: `${pick(["Ramesh", "Suresh", "Vijay", "Karthik", "Prakash"])} ${pick(last)}`, motherName: pick(["Anitha", "Revathi", "Sangeetha", "Deepa", "Gayathri"]),
    admissionDate: daysAgo(30 + i * 7), address: "Chennai",
  }))).returning();

  await db.insert(enquiries).values([
    ...["Riya", "Aditya", "Sana", "Varun", "Pooja", "Kiran", "Nithya", "Harish", "Zoya"].map((n, i) => ({
      childName: n, parentName: `Parent of ${n}`, phone: `9000000${100 + i}`, programInterest: pick(cls).name, source: pick(["walk-in", "website", "referral", "social media"]),
      status: ["new", "new", "contacted", "contacted", "visit", "visit", "admitted", "lost", "admitted"][i], followUpDate: daysAgo(-(i % 4)),
    })),
  ]);

  // 60 days of attendance on weekdays
  const sa: (typeof studentAttendance.$inferInsert)[] = [];
  const ta: (typeof staffAttendance.$inferInsert)[] = [];
  for (let n = 60; n >= 1; n--) {
    const d = new Date(); d.setDate(d.getDate() - n);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const date = iso(d);
    for (const k of kids) sa.push({ studentId: k.id, date, status: Math.random() < 0.88 ? "present" : pick(["absent", "late", "leave"]) });
    for (const s of staff) {
      const inT = new Date(d); inT.setHours(8, 30 + Math.floor(Math.random() * 25)); const outT = new Date(d); outT.setHours(15, 30 + Math.floor(Math.random() * 30));
      ta.push({ userId: s.id, date, status: Math.random() < 0.95 ? "present" : "absent", checkIn: inT, checkOut: outT });
    }
  }
  for (let i = 0; i < sa.length; i += 500) await db.insert(studentAttendance).values(sa.slice(i, i + 500));
  await db.insert(staffAttendance).values(ta);

  // Fees: 3 months of tuition
  const inv: (typeof feeInvoices.$inferInsert)[] = [];
  for (let m = 2; m >= 0; m--) {
    const d = new Date(); d.setMonth(d.getMonth() - m, 10);
    for (const k of kids) inv.push({ invoiceNo: `INV-${m}${String(k.id).padStart(4, "0")}`, studentId: k.id, title: `Tuition – ${d.toLocaleString("en-IN", { month: "long" })}`, amount: 4500, dueDate: iso(d) });
  }
  const invoices = await db.insert(feeInvoices).values(inv).returning();
  const pays: (typeof feePayments.$inferInsert)[] = [];
  for (const i of invoices) {
    if (Math.random() < (i.dueDate < daysAgo(20) ? 0.92 : 0.55)) {
      pays.push({ invoiceId: i.id, amount: i.amount, method: pick(["upi", "cash", "bank"]), paidOn: i.dueDate > daysAgo(0) ? daysAgo(0) : i.dueDate });
      await db.update(feeInvoices).set({ paidAmount: i.amount, status: "paid" }).where(eq(feeInvoices.id, i.id));
    }
  }
  await db.insert(feePayments).values(pays);

  // Expenses for 6 months
  const ex: (typeof expenses.$inferInsert)[] = [];
  for (let m = 5; m >= 0; m--) {
    for (const [cat, amt] of [["Rent", 35000], ["Utilities", 6000], ["Food & snacks", 9000], ["Teaching material", 4000], ["Housekeeping", 3000]] as const) {
      const d = new Date(); d.setMonth(d.getMonth() - m, 5 + Math.floor(Math.random() * 15));
      if (d > new Date()) d.setTime(Date.now());
      ex.push({ category: cat, title: `${cat} – ${d.toLocaleString("en-IN", { month: "short" })}`, amount: Math.round(amt * (0.85 + Math.random() * 0.3)), date: iso(d), paymentMethod: "Bank transfer" });
    }
  }
  await db.insert(expenses).values(ex);

  // Paid payroll for last 2 months
  const everyone = await db.select().from(users);
  for (let m = 2; m >= 1; m--) {
    const d = new Date(); d.setMonth(d.getMonth() - m);
    const month = iso(d).slice(0, 7);
    await db.insert(payrolls).values(everyone.map((u) => ({
      userId: u.id, month, basic: u.basicSalary, allowances: u.allowances, deductions: u.deductions, netPay: u.basicSalary + u.allowances - u.deductions, status: "paid", paidOn: `${month}-28`,
    })));
  }

  await db.insert(events).values([
    { title: "Children's Day celebration", date: daysAgo(-3), type: "celebration" }, { title: "Parent-teacher meeting", date: daysAgo(-10), type: "ptm" },
    { title: "Christmas holiday", date: `${new Date().getFullYear()}-12-25`, type: "holiday" }, { title: "Annual Day", date: daysAgo(-30), type: "event" },
  ]);
  await db.insert(announcements).values([
    { title: "Welcome to our parent app! 🎉", body: "You can now see daily updates, homework, progress and fees right here.", audience: "parents", pinned: true },
    { title: "Fancy dress on Friday", body: "Children can come dressed as their favourite fruit or vegetable 🍎🥕", audience: "all" },
  ]);
  for (const c of cls) {
    await db.insert(homework).values([
      { classId: c.id, subject: "Art & Craft", title: "Colour the butterfly", description: "Use crayons to colour the worksheet sent in the bag.", dueDate: daysAgo(-1) },
      { classId: c.id, subject: "Rhymes", title: "Practise 'Twinkle Twinkle'", dueDate: daysAgo(-2) },
    ]);
  }
  const moods = ["happy", "excited", "calm", "tired"];
  for (const k of kids) {
    for (let n = 1; n <= 3; n++) {
      await db.insert(dailyReports).values({ studentId: k.id, date: daysAgo(n), mood: pick(moods), breakfast: "all", lunch: pick(["all", "some"]), snack: "all", napMinutes: 45 + Math.floor(Math.random() * 30), activities: pick(["Clay modelling, story time", "Sand play, rhymes", "Finger painting, music"]), comment: `${k.firstName} had a wonderful day and played nicely with friends!` });
    }
    for (const area of ["Language & Communication", "Numeracy", "Fine Motor", "Gross Motor", "Social & Emotional", "Creativity & Art", "Self-help Habits"]) {
      await db.insert(progressReports).values({ studentId: k.id, term: "Term 1", area, rating: 2 + Math.floor(Math.random() * 4) });
    }
  }
  console.log("👩‍🏫 Demo staff password: Staff@123 (e.g. priya@school.com)");
  console.log(`👪 Demo parent login: Student ID ${prefix}0001, first-time setup with mobile 9876500000`);
}

main().catch((e) => { console.error(e); process.exit(1); });
