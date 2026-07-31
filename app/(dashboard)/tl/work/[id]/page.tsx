import { notFound } from "next/navigation";
import Link from "next/link";
import { WorkItemService } from "@/services/WorkItemService";
import { TagService } from "@/services/TagService";
import { ClientService } from "@/services/ClientService";
import { WorkTypeService } from "@/services/WorkTypeService";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { UserService } from "@/services/UserService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkHeader } from "./work-header";
import { StageActionButtons } from "./stage-action-buttons";
import { StageProgress } from "./stage-progress";
import { getSessionUser } from "@/lib/auth/utils";
import { formatDateTime } from "@/lib/utils";

export default async function WorkItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workItem = await WorkItemService.getById(id);
  const user = await getSessionUser();

  if (!workItem || !user) {
    notFound();
  }

  const [tags, clients, workTypes, processes, employees] = await Promise.all([
    TagService.list(),
    ClientService.list(),
    WorkTypeService.list(),
    ProcessTemplateService.list(),
    UserService.list()
  ]);

  const publishedProcesses = processes.filter((p: any) => p.versions.some((v: any) => v.isPublished));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/tl/work" className="hover:text-indigo-600 hover:underline">Work Items</Link>
        <span>/</span>
        <span className="text-gray-900">{workItem.workNumber}</span>
      </div>

      <WorkHeader 
        workItem={workItem} 
        tags={tags} 
        clients={clients} 
        workTypes={workTypes} 
        processes={publishedProcesses}
        employees={employees}
        currentUser={user}
      />

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
                <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                <p className="mt-1 text-sm font-semibold text-indigo-900">
                  {formatDateTime(workItem.createdAt)}
                </p>
              </div>

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
