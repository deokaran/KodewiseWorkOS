import { WorkItemService } from "@/services/WorkItemService";
import { TagService } from "@/services/TagService";
import { ClientService } from "@/services/ClientService";
import { WorkTypeService } from "@/services/WorkTypeService";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { WorkClient } from "../../work/work-client";
import { UserService } from "@/services/UserService";

export default async function TlKwWorkPage() {
  const [workItems, tags, clients, workTypes, processes, employees] = await Promise.all([
    WorkItemService.list(),
    TagService.list(),
    ClientService.list(),
    WorkTypeService.list(),
    ProcessTemplateService.list(),
    UserService.listByRole("EMPLOYEE")
  ]);

  const publishedProcesses = processes.filter(p => p.versions.some(v => v.isPublished));
  const filteredWorkItems = workItems.filter((w: any) => w.primaryBrandTag?.name === "Kodewise");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">Kodewise Work Items</h2>
        <p className="text-sm text-gray-500">
          Manage all Kodewise active tasks and web revamp modules.
        </p>
      </div>

      <WorkClient 
        initialWorkItems={filteredWorkItems} 
        tags={tags}
        clients={clients}
        workTypes={workTypes}
        processes={publishedProcesses}
        employees={employees}
      />
    </div>
  );
}
