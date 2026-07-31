import { notFound } from "next/navigation";
import Link from "next/link";
import { WorkItemService } from "@/services/WorkItemService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageActionButtons } from "../../../tl/work/[id]/stage-action-buttons";
import { StageProgress } from "../../../tl/work/[id]/stage-progress";
import { getSessionUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";

export default async function EmployeeWorkItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) notFound();

  const [workItem, dbUser] = await Promise.all([
    WorkItemService.getById(id),
    prisma.user.findUnique({
      where: { id: user.id },
      include: { capabilities: true }
    })
  ]);

  if (!workItem || workItem.deletedAt || !dbUser) {
    notFound();
  }

  // Restrict access: only visible to assignee or if it's in the open pool and matches capabilities
  if (workItem.currentStage) {
    const stage = workItem.currentStage;
    const isAssignedToUser = stage.assignedUserId === user.id;
    const userCapIds = dbUser.capabilities.map((c: any) => c.id);
    const isOpenPoolMatch = !stage.assignedUserId && 
      (!stage.capabilityId || userCapIds.includes(stage.capabilityId));
    
    if (!isAssignedToUser && !isOpenPoolMatch) {
      notFound();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/employee/work" className="hover:text-indigo-600 hover:underline">Work Items</Link>
        <span>/</span>
        <span className="text-gray-900">{workItem.workNumber}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{workItem.workNumber}</h1>
            <span className="text-lg text-gray-500">{workItem.title}</span>
            <Badge variant="outline">{workItem.primaryBrandTag.name}</Badge>
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">{workItem.status}</Badge>
            <Badge variant={workItem.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>{workItem.priority}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workItem.stages.map((stage: any, index: number) => {
                  const isActive = stage.id === workItem.currentStageId;
                  return (
                    <div key={stage.id} className={`flex gap-4 p-4 border rounded-lg ${isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                      <div className="flex flex-col items-center justify-center border-r pr-4 min-w-[3rem]">
                        <div className={`text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`font-semibold ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {stage.stageTemplate.name}
                            </h4>
                            <div className="text-sm text-gray-500 mt-1 flex gap-2">
                              <span>{stage.stageTemplate.estimatedDurationMins} mins</span>
                              {stage.capability && (
                                <>
                                  <span>•</span>
                                  <span>{stage.capability.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant={isActive ? "default" : (stage.status === 'COMPLETED' ? "secondary" : "outline")}>
                            {stage.status}
                          </Badge>
                        </div>
                        {isActive && (
                          <StageActionButtons stage={stage} workItemId={workItem.id} userRole={user.role} userId={user.id} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <StageProgress workItem={workItem} />
          
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{workItem.description || 'No description provided.'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Client</h4>
                <p className="mt-1 text-sm text-gray-900">{workItem.client?.name || 'None'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Work Type</h4>
                <p className="mt-1 text-sm text-gray-900">{workItem.workType?.name || 'None'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Process</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {workItem.processVersion.template.name} (v{workItem.processVersion.version})
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Tags</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {workItem.tags.map((t: any) => (
                    <Badge key={t.tagId} variant="outline" style={{ borderColor: t.tag.color || undefined }}>
                      {t.tag.name}
                    </Badge>
                  ))}
                  {workItem.tags.length === 0 && <span className="text-sm text-gray-500">None</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
