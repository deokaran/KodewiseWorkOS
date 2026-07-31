import { prisma } from "@/lib/db/prisma";

export class HolidayService {
  static async listHolidays() {
    return prisma.holiday.findMany({
      orderBy: { date: "asc" }
    });
  }

  static async createHoliday(title: string, date: Date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);

    return prisma.holiday.create({
      data: {
        title,
        date: normalized,
      }
    });
  }

  static async deleteHoliday(id: string) {
    return prisma.holiday.delete({
      where: { id }
    });
  }

  static async isHoliday(date: Date) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const holiday = await prisma.holiday.findUnique({
      where: { date: checkDate }
    });

    return !!holiday;
  }
}
