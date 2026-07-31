import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EmployeeProfileCard } from "./employee-profile-card";
import { TeamMemberAssignActions } from "./assign-actions";
import { AttendanceCalendar } from "@/components/shared/attendance-calendar";
import { sanitizeForClient } from "@/lib/utils";

export default async function TLTeamMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("TEAM_LEADER");
  const { id } = await params;

  // Fetch the employee details
  const employee = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: {
      capabilities: true,
      brand: true,
      department: true,
    }
  });

  if (!employee || (employee.role !== "EMPLOYEE" && employee.role !== "TEAM_LEADER")) {
    notFound();
  }

  // Fetch all capabilities, brand tags, clients, workTypes, and unassigned active stages to edit/assign
  const [
    allCapabilities,
    allBrands,
    allClients,
    allWorkTypes,
    unassignedStages,
    allProcessTemplates,
    allUsers,
    allDepartments
  ] = await Promise.all([
    prisma.capability.findMany(),
    prisma.tag.findMany({ where: { type: "BRAND", deletedAt: null } }),
    prisma.client.findMany({
      where: { deletedAt: null },
      include: {
        tags: {
          include: { tag: true }
        }
      }
    }),
    prisma.workType.findMany(),
    prisma.workItemStage.findMany({
      where: { 
        assignedUserId: null, 
        status: { in: ['READY', 'LOCKED', 'REJECTED', 'IN_PROGRESS'] },
        workItem: { deletedAt: null }
      },
      include: {
        stageTemplate: true,
        workItem: {
          include: {
            client: true,
            primaryBrandTag: true
          }
        }
      }
    }),
    prisma.processTemplate.findMany({
      include: {
        versions: {
          where: { isPublished: true },
          include: {
            stages: {
              include: { capability: true },
              orderBy: { order: "asc" }
            }
          }
        }
      }
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { capabilities: true }
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  // Fetch their work history (stages assigned)
  const stages = await prisma.workItemStage.findMany({
    where: { assignedUserId: id },
    include: {
      stageTemplate: true,
      workItem: {
        include: {
          primaryBrandTag: true,
          client: true,
        }
      }
    },
    orderBy: { statusChangedAt: 'desc' }
  });

  // Fetch audit log entries triggered by this user
  const activities = await prisma.auditLog.findMany({
    where: { userId: id },
    include: {
      workItem: {
        include: { primaryBrandTag: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Limit to recent 50
  });

  const activeStages = stages.filter(s => s.status !== "COMPLETED" && s.status !== "CANCELLED");
  const completedStages = stages.filter(s => s.status === "COMPLETED");

  return (
    <div className="space-y-8">
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/tl/team" 
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-2"
          >
            ← Back to Team
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{employee.name}</h2>
          <p className="text-sm text-gray-500">
            {employee.role === "TEAM_LEADER" ? "Team Leader profile and log history." : "Employee profile and comprehensive work history."}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <TeamMemberAssignActions 
            employee={sanitizeForClient(employee)}
            unassignedStages={sanitizeForClient(unassignedStages)}
            allBrands={sanitizeForClient(allBrands)}
            allClients={sanitizeForClient(allClients)}
            allWorkTypes={sanitizeForClient(allWorkTypes)}
            allProcessTemplates={sanitizeForClient(allProcessTemplates)}
            allUsers={sanitizeForClient(allUsers)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inline Profile Editor */}
        <EmployeeProfileCard
          employee={sanitizeForClient(employee)}
          allCapabilities={sanitizeForClient(allCapabilities)}
          allBrands={sanitizeForClient(allBrands)}
          allDepartments={sanitizeForClient(allDepartments)}
        />

        {/* Right Column: Work History Tabs/Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments */}
          <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Active Stage Assignments ({activeStages.length})</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Item</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStages.map(stage => (
                  <TableRow key={stage.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <Link href={`/tl/work/${stage.workItemId}`} className="text-indigo-600 hover:underline">
                          {stage.workItem.workNumber}
                        </Link>
                        <span className="text-xs text-gray-500 max-w-[200px] truncate">{stage.workItem.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{stage.stageTemplate.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{stage.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(stage.statusChangedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {activeStages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                      No active assignments at the moment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Completed Assignments */}
          <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Completed Stages ({completedStages.length})</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Item</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Completed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedStages.map(stage => (
                  <TableRow key={stage.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <Link href={`/tl/work/${stage.workItemId}`} className="text-indigo-600 hover:underline">
                          {stage.workItem.workNumber}
                        </Link>
                        <span className="text-xs text-gray-500 max-w-[200px] truncate">{stage.workItem.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{stage.stageTemplate.name}</TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(stage.statusChangedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {completedStages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                      No completed stages yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Activity Log Audit */}
          {/* <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Recent Audit History</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto px-6 py-4 space-y-4">
              {activities.map(log => {
                const metadata = log.metadata as Record<string, any> | null;
                const details = metadata?.message || "-";

                return (
                  <div key={log.id} className="text-sm border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="font-semibold text-gray-800">
                          {log.workItem.workNumber}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-600 mt-1 text-xs">{details}</p>
                  </div>
                );
              })}
              {activities.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No activity logs recorded for this employee.
                </div>
              )}
            </div>
          </div> */}
        </div>
      </div>

      <div className="mt-8">
        <AttendanceCalendar userId={id} />
      </div>
    </div>
  );
}
