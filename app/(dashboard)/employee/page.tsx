import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EmployeePage() {
  const user = await requireRole("EMPLOYEE");

  const [
    dbUser,
    assignedStages,
    completedStages,
    upcomingEvents
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: { brand: true }
    }),
    prisma.workItemStage.findMany({ 
      where: { assignedUserId: user.id, status: { notIn: ['COMPLETED', 'SKIPPED', 'CANCELLED'] } },
      include: { workItem: true, stageTemplate: true }
    }),
    prisma.workItemStage.count({ where: { assignedUserId: user.id, status: 'COMPLETED' } }),
    prisma.calendarEvent.findMany({
      take: 5,
      where: {
        startTime: { gte: new Date() }
      },
      orderBy: { startTime: 'asc' }
    })
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Employee Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedStages.length}</div>
            <p className="text-xs text-muted-foreground">Stages waiting for your action</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedStages}</div>
            <p className="text-xs text-muted-foreground">Total stages you&apos;ve completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Brand Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbUser?.brand?.name || "Global / All"}</div>
            <p className="text-xs text-muted-foreground">Your primary workspace division</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Active Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedStages.slice(0, 5).map(stage => (
                <div key={stage.id} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <Link href={`/employee/work/${stage.workItem.id}`} className="font-medium text-indigo-600 hover:underline">
                      {stage.workItem.workNumber} - {stage.stageTemplate.name}
                    </Link>
                    <Badge variant="outline">{stage.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{stage.workItem.title}</p>
                </div>
              ))}
              {assignedStages.length === 0 && (
                <div className="text-sm text-gray-500">No active stages assigned to you.</div>
              )}
              {assignedStages.length > 5 && (
                <Link href="/employee/work" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
                  View all assigned work...
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900 line-clamp-1">{event.title}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>{new Date(event.startTime).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-sm text-gray-500">No upcoming events.</div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/calendar" className="text-sm text-indigo-600 hover:underline">
                View full calendar &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
