# Studio.Track - Comprehensive Project Documentation & Setup Guide

This document combines the technical specs, setup guides, UX architecture blueprint, API/Service layers, seeding plan, and changelogs for the Studio.Track creative operations platform.

---

## 🚀 1. Setup & Local Development Guide

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL Database** (configured locally or hosted, e.g., Neon PostgreSQL)

### Running Locally
1. **Clone the Repository** and open the directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following keys (based on `.env.example`):
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   AUTH_SECRET="your-next-auth-secret-key-32-characters"
   NEXTAUTH_URL="http://localhost:3000"
   GEMINI_API_KEY="your-gemini-api-key"
   ```
4. **Push Database Schema**:
   Synchronize the database tables using Prisma:
   ```bash
   npx prisma db push
   ```
5. **Seed Initial Database**:
   Populate the master operational roles, seed users, brands, and template structures:
   ```bash
   npx prisma db seed
   ```
6. **Run Development Server**:
   Launch the Next.js local server:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` in your web browser.

### Seed Accounts (Password for all: `password123`)
- **Team Leader (TL)**: `loknath.epili@studiotrack.local` or `amit.yadav@studiotrack.local`
- **Employee (Designer/Editor)**: `aayush.dalvi@studiotrack.local`
- **Employee (Developer)**: `ravi.patadia@studiotrack.local`

---

## 🛠️ 2. Technical Specification & Design Principles

### Core Stack
1. **Next.js 15 (App Router)**: Leverages React Server Components (RSC) for page loading and SEO. Client Components (`'use client'`) are used solely for interactive panels and clock widgets.
2. **Prisma ORM**: Relational schema handling, type-safe queries, and transactions.
3. **Auth.js v5 (NextAuth)**: Credential login flow utilizing encrypted JWT session cookies. Token contains roles and capabilities for zero-DB-fetch authorization.
4. **Tailwind CSS v4 & shadcn/ui**: Modern, dark-slate styled layouts and components.

### Request Flow Standards
1. **Client Interaction**: Component triggers form submission or button action.
2. **Server Action**: Gatekeeper of logic. Validates inputs using **Zod** schema and asserts authentication/roles using `requireAuth()` or `requireRole()`.
3. **Service Layer**: Pure JS domain logic. Performs queries, wraps write operations in a transaction (`prisma.$transaction`), records an append-only `AuditLog` entry, and dispatches notification alerts.
4. **UI Reconciliation**: Revalidates layout cache via `revalidatePath()`, updating client components.

---

## 🎨 3. UX Architecture & Business Rules

### Creative Operations Logic (V2 Decoupling)
Studio.Track distinguishes between internal events and client retainer outputs through a polymorphic `WorkItem` type:
- **`INTERNAL_EVENT` (Shoots)**: Operational events (e.g., Matchday Shoot) that follow workflow stages but do not increment retention counts. Can spawn multiple deliverable sub-items.
- **`CLIENT_DELIVERABLE` (Reels, Posts)**: Retainer outputs. Increments monthly/weekly client quota counts *only* after receiving explicit Client Acceptance.

### Core Workflows & Logic
- **Open Work Pool (The Bazaar)**: Unassigned stages of active workflows are pushed to the Open Pool. Employees can view and claim these tasks if they possess matching capability permissions.
- **Spawning Workflow**: Upon shoot asset ingestion, Team Leaders can bulk-spawn multiple deliverables (e.g. 3 Reels, 5 Posts) which are auto-linked as children of the parent shoot.
- **Quota Engine**: Distributes monthly retainer quotas. If a TL does not specify a weekly target by Monday 9:00 AM, the engine divides the remaining monthly target equally across the remaining weeks in the month.

---

## 🔌 4. API Actions & Service Interface

conceptually mapped to **Server Actions (Mutations)** and **Services (Queries)**:

1. **Attendance Actions (`/actions/attendance.ts`)**:
   - `clockInAction()`: Logs clock-in event for the user session. Returns serializable JSON values.
   - `clockOutAction()`: Finalizes current check-in session.
   - `getActiveSessionAction()`: Checks if user has a running timer.
   - `getMonthlyAttendanceAction(year, month, targetUserId?)`: Returns logs of a specific month. Gated: TLs can view employee attendance logs; employees can view only their own.
2. **User Management (`/actions/users.ts`)**:
   - `createUserAction(data)`: Gated to TL only. Creates user accounts and assigns initial capabilities.
3. **Work Items (`/actions/work-items.ts`)**:
   - `createWorkItemAction(data)`: Spawns polymorphic shoots/deliverables with automated workNumber sequencing (e.g. `FC-000185`).
4. **Notifications (`/actions/notifications.ts`)**:
   - `markReadAction(id)`: Marks user alerts as read.

---

## 📜 5. Changelog & Project History

### [1.0.0] - Sprint 1-9 Completions
- **Authentication**: NextAuth integration with custom login pages, role routes protection (`/tl/*` vs `/employee/*`), and session validation.
- **Database & Schema**: Prisma configuration, model mappings, and PostgreSQL integration.
- **TL Dashboards**: Retainer contract quota charts, process template design editor, work spawning controls, and capability settings.
- **Employee Dashboards**: Assigned work lists, "Bazaar" open pool claiming workflow, process libraries sitemap, and user capabilities display.
- **Refined Attendance System**: Top header clock-in and clock-out controls, live elapsed work timer, and user profile monthly calendars.

### [1.1.0] - Attendance Refinements & Sidebar Theme
- **Refined Date States**: Color-coded calendar cells (Green for Present, Red for Absent weekdays, Grey for Weekends, White/Default for Future).
- **Log Details Modal**: Click date cell to open a pop-up modal showing chronological lists of check-in/out timestamps and daily work hours summary.
- **Dark Sidebar**: Styled navigation background (`bg-slate-900 border-slate-800`) with high-contrast text styles for a premium design structure.
