import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";

export class AttendanceService {
  static async clockIn(userId: string, workLocation?: "IN_OFFICE" | "WORK_FROM_HOME") {
    // Check if there is an active attendance session
    const active = await prisma.attendance.findFirst({
      where: { userId, clockOut: null },
    });

    if (active) {
      throw new AppError("You are already clocked in.", "ALREADY_CLOCKED_IN");
    }

    const checkInTime = new Date();

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        clockIn: checkInTime,
        workLocation: workLocation || "IN_OFFICE",
      },
    });

    // Check punctuality streak
    try {
      const getISTDateString = (date: Date) => {
        const d = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      };

      const todayISTStr = getISTDateString(checkInTime);

      const recentSessions = await prisma.attendance.findMany({
        where: {
          userId,
          id: { not: attendance.id },
          clockIn: {
            gte: new Date(checkInTime.getTime() - 24 * 60 * 60 * 1000)
          }
        }
      });

      const isFirstCheckInOfToday = !recentSessions.some(
        (s) => getISTDateString(s.clockIn) === todayISTStr
      );

      if (!isFirstCheckInOfToday) {
        return attendance;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        // Convert checkInTime to IST (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(checkInTime.getTime() + istOffset);
        const hours = istDate.getUTCHours();
        const minutes = istDate.getUTCMinutes();

        const isPunctual = hours < 10 || (hours === 10 && minutes <= 20);

        if (!isPunctual) {
          // Reset streak
          await prisma.user.update({
            where: { id: userId },
            data: {
              consecutivePunctualDays: 0
            }
          });
        } else {
          if (!user.lastPunctualCheckIn || user.consecutivePunctualDays === 0) {
            // First punctual check-in or after reset
            await prisma.user.update({
              where: { id: userId },
              data: {
                consecutivePunctualDays: 1,
                lastPunctualCheckIn: checkInTime
              }
            });
          } else {
            const lastISTStr = getISTDateString(user.lastPunctualCheckIn);

            if (lastISTStr !== todayISTStr) {
              // Verify if there are working day breaks between lastISTStr and todayISTStr
              const start = new Date(lastISTStr + "T12:00:00Z");
              const end = new Date(todayISTStr + "T12:00:00Z");
              let hasWorkingDayGap = false;

              const current = new Date(start.getTime() + 24 * 60 * 60 * 1000);
              while (current < end) {
                const dayOfWeek = current.getUTCDay(); // 0 = Sunday, 6 = Saturday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                if (!isWeekend) {
                  const checkDate = new Date(current.toISOString().split('T')[0] + "T00:00:00.000Z");
                  const holiday = await prisma.holiday.findUnique({
                    where: { date: checkDate }
                  });
                  if (!holiday) {
                    hasWorkingDayGap = true;
                    break;
                  }
                }
                current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
              }

              let newStreak = hasWorkingDayGap ? 1 : user.consecutivePunctualDays + 1;
              let extraPaid = 0;

              if (newStreak >= 20) {
                newStreak = 0; // Reset streak
                extraPaid = 1;

                // In-app notification
                const { NotificationType } = await import("@prisma/client");
                const { NotificationService } = await import("./NotificationService");
                await NotificationService.createNotification(null, {
                  userId: user.id,
                  type: NotificationType.SYSTEM_ALERT,
                  title: "Discipline Reward Earned!",
                  body: "Congratulations! You completed 20 consecutive punctual working days and earned +1 paid leave.",
                  link: "/employee/leaves"
                });

                // Email reward
                const { EmailService } = await import("./EmailService");
                EmailService.sendPunctualityReward({
                  recipientEmail: user.email,
                  recipientName: user.name,
                  newPaidBalance: user.allowedPaid + 1,
                });
              }

              await prisma.user.update({
                where: { id: userId },
                data: {
                  consecutivePunctualDays: newStreak,
                  lastPunctualCheckIn: checkInTime,
                  allowedPaid: extraPaid > 0 ? { increment: extraPaid } : undefined
                }
              });

            }
          }
        }
      }
    } catch (streakError) {
      console.error("Failed to update punctuality streak:", streakError);
    }

    return attendance;
  }

  static async clockOut(userId: string) {
    // Find the latest active session
    const active = await prisma.attendance.findFirst({
      where: { userId, clockOut: null },
      orderBy: { clockIn: "desc" },
    });

    if (!active) {
      throw new AppError("You are not clocked in.", "NOT_CLOCKED_IN");
    }

    return prisma.attendance.update({
      where: { id: active.id },
      data: {
        clockOut: new Date(),
      },
    });
  }

  static async getActiveSession(userId: string) {
    return prisma.attendance.findFirst({
      where: { userId, clockOut: null },
      orderBy: { clockIn: "desc" },
    });
  }

  static async getTodaySessions(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return prisma.attendance.findMany({
      where: {
        userId,
        clockIn: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { clockIn: "asc" },
    });
  }

  static async getMonthlyAttendance(userId: string, year: number, month: number) {
    // month is 1-indexed (1 = January, 12 = December)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return prisma.attendance.findMany({
      where: {
        userId,
        clockIn: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { clockIn: "asc" },
    });
  }
}
