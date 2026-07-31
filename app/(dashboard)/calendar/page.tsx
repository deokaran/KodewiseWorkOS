import { requireAuth } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { CalendarClient } from "./calendar-client";
import { sanitizeForClient } from "@/lib/utils";

import { TagService } from "@/services/TagService";
import { ClientService } from "@/services/ClientService";
import { WorkTypeService } from "@/services/WorkTypeService";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { UserService } from "@/services/UserService";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await requireAuth();
  const params = await searchParams;

  // Parse or default current month/year
  const today = new Date();
  const currentMonth = params.month ? parseInt(params.month, 10) : today.getMonth(); // 0-indexed
  const currentYear = params.year ? parseInt(params.year, 10) : today.getFullYear();

  // Load calendar events, deadlines, tasks, reminders and task-creation dropdown dependencies in parallel (no brand filters)
  const [
    events,
    stageDeadlines,
    workItems,
    tags,
    clients,
    workTypes,
    processes,
    employees,
    dbUser,
    reminders
  ] = await Promise.all([
    prisma.calendarEvent.findMany({ include: { eventType: true } }),
    prisma.workItemStage.findMany({
      where: {
        deadline: { not: null }
      },
      include: {
        stageTemplate: true,
        assignedUser: true,
        workItem: {
          include: { primaryBrandTag: true }
        }
      }
    }),
    prisma.workItem.findMany({
      where: {
        estimatedEnd: { not: null }
      },
      include: {
        primaryBrandTag: true,
        client: true,
        stages: {
          include: { assignedUser: true, stageTemplate: true }
        }
      }
    }),
    TagService.list(),
    ClientService.list(),
    WorkTypeService.list(),
    ProcessTemplateService.list(),
    UserService.listByRole("EMPLOYEE"),
    user.role === 'EMPLOYEE' ? prisma.user.findUnique({
      where: { id: user.id },
      include: { capabilities: true }
    }) : null,
    prisma.reminder.findMany({
      where: { userId: user.id }
    })
  ]);

  // For the calendar day cells, show only active deadlines (non-completed, non-cancelled)
  let cellDeadlines = stageDeadlines.filter((stage: any) => stage.status !== 'COMPLETED' && stage.status !== 'CANCELLED');
  if (user.role === 'EMPLOYEE' && dbUser) {
    const userCapIds = dbUser.capabilities.map((c: any) => c.id);
    cellDeadlines = cellDeadlines.filter((stage: any) => {
      if (stage.assignedUserId === user.id) return true;
      if (!stage.assignedUserId) {
        if (!stage.capabilityId) return true;
        return userCapIds.includes(stage.capabilityId);
      }
      return false;
    });
  }

  // Filter tasks (work items) for employees: they only see tasks they have a stage assigned to
  let filteredWorkItems = workItems;
  if (user.role === 'EMPLOYEE' && dbUser) {
    filteredWorkItems = workItems.filter((item: any) =>
      item.stages.some((stage: any) => stage.assignedUserId === user.id)
    );
  }

  const publishedProcesses = processes.filter((p: any) => p.versions.some((v: any) => v.isPublished));

  // Prepare calendar dates
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 6 is Saturday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create array of days to render in grid (convert dates to ISO strings for hydration/serialization safety)
  const calendarCells: { date: string | null; isToday: boolean }[] = [];
  
  // Padding cells for previous month days
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push({ date: null, isToday: false });
  }

  // Active month cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(currentYear, currentMonth, day);
    const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    calendarCells.push({ date: dateObj.toISOString(), isToday });
  }

  // Month navigation
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <CalendarClient
      user={sanitizeForClient(user)}
      events={sanitizeForClient(events)}
      stageDeadlines={sanitizeForClient(cellDeadlines)}
      allStageDeadlines={sanitizeForClient(stageDeadlines)}
      workItems={sanitizeForClient(filteredWorkItems)}
      calendarCells={calendarCells}
      monthNames={monthNames}
      currentMonth={currentMonth}
      currentYear={currentYear}
      prevMonth={prevMonth}
      prevYear={prevYear}
      nextMonth={nextMonth}
      nextYear={nextYear}
      tags={sanitizeForClient(tags)}
      clients={sanitizeForClient(clients)}
      workTypes={sanitizeForClient(workTypes)}
      processes={sanitizeForClient(publishedProcesses)}
      employees={sanitizeForClient(employees)}
      reminders={sanitizeForClient(reminders)}
    />
  );
}
