# 🌈 Preschool Manager

A complete preschool management system: admissions, students, classes, attendance (students + staff), homework,
daily reports, progress, fees, expenses, HR & payroll, leave, announcements, events, roles & permissions —
plus a separate **parent portal**.

**Stack:** Next.js 15 (App Router, Server Actions) · Neon Postgres + Drizzle ORM · Cloudflare R2 (files) · Tailwind CSS · Recharts

---

## 1. Setup

```bash
npm install
cp .env.example .env      # then fill in the values
npm run db:push           # creates all tables in Neon
npm run db:seed           # roles, first admin, 4 classes
# optional: sample data to try everything
npm run db:seed -- --demo
npm run dev               # http://localhost:3000
```

Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (default `admin@school.com` / `Admin@123`). **Change it after first login** (My Desk → Password).

With `--demo`: staff password `Staff@123` (e.g. `priya@school.com` is a Teacher), parent Student ID `<PREFIX><YEAR>0001`, mobile `9876500000`.

### Neon
Create a project at neon.tech → copy the connection string into `DATABASE_URL`.
(If `DATABASE_URL` points at `localhost`, a normal Postgres driver is used — handy for local development.)

### Cloudflare R2
Cloudflare dashboard → R2 → create bucket (e.g. `preschool-files`) → **Manage R2 API tokens** → create a token with
Object Read & Write → put Account ID, Access Key ID, Secret and bucket name in `.env`.
Files stay **private**: the app checks the login, then gives a 10-minute signed link.

### Deploy (Vercel)
Import the repo, add the same environment variables, deploy. Run `npm run db:push` and `npm run db:seed` once from your machine.

---

## 2. Logins

| Who | Username | Password |
|---|---|---|
| Admin / staff | Email | Set by admin when adding staff (staff can change it) |
| Parent | **Student ID** (e.g. `LS20260001`, created automatically at admission) | **Parent creates it the first time** — "First time? Create password", verified with the mobile number registered at admission |

If a parent forgets the password: Students → open child → **Reset password**. They create a new one at next login.

## 3. Roles
Admin creates any role (Teacher, Accountant, Front Office, Nanny…) under **Roles & Access** and ticks what it can do.
The menu only shows allowed pages. Teachers who don't have "Add/edit students" only see the classes where they are class teacher.
Every staff member always has **My Desk**: check-in/out, monthly attendance, leave requests, payslips.

## 4. Modules
| Area | What it does |
|---|---|
| Dashboard | Students, today's attendance, fee collection & dues, staff present, income vs expenses vs salaries (6 months), admission funnel, class strength, recent payments, events, birthdays, follow-ups |
| Admissions | Enquiry board (New → Contacted → Visit → Admitted / Lost), follow-up dates, one click to admit |
| Students | Profile with photo, parent details, medical notes, attendance %, fees, progress chart, daily reports |
| Attendance | Take attendance per class (Present/Late/Absent/Leave) + monthly register |
| Homework | Post with attachments → visible to parents instantly |
| Daily reports | Mood, meals, nap, activities, teacher comment, photo per child per day |
| Progress | 1–5 rating in 7 learning areas per term → radar chart for parents |
| Fees | Invoice one child / a class / everyone, discounts, part payments, receipts (print/PDF), overdue tracking |
| Expenses | Categories, receipt upload, monthly breakdown |
| HR | Staff profiles with salary & bank details, staff attendance register, leave approval |
| Payroll | Generate monthly payroll (loss of pay from absences + unpaid leave), adjust bonus/deductions, mark salary credited, payslips |
| Communication | Announcements (everyone / parents / staff / one class), events & holidays calendar |
| Parent portal | Home, daily updates, homework, progress, attendance calendar, fees & payments, notices, change password |

## 5. Settings
School name, tagline, address, phone, academic year → **Settings** (used on login page, receipts, payslips).
Student ID prefix and time zone are in `.env` (`STUDENT_ID_PREFIX`, `APP_TIMEZONE`).
