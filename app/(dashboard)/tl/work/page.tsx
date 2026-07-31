import { WorkItemService } from "@/services/WorkItemService";
import { TagService } from "@/services/TagService";
import { ClientService } from "@/services/ClientService";
import { WorkTypeService } from "@/services/WorkTypeService";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { WorkClient } from "./work-client";
import { UserService } from "@/services/UserService";
import { getSessionUser } from "@/lib/auth/utils";

export default async function WorkItemsPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand } = await searchParams;
  const user = await getSessionUser();

  // Query all items, tags, clients, and employees across Football Counter and Kodewise
  const [workItems, tags, clients, workTypes, processes, employees] = await Promise.all([
    WorkItemService.list(),
    TagService.list(),
    ClientService.list(),
    WorkTypeService.list(),
    ProcessTemplateService.list(),
    UserService.list()
  ]);

  const publishedProcesses = processes.filter(p => p.versions.some(v => v.isPublished));

  let filteredWorkItems = workItems;
  if (brand) {
    const brandName = brand.toLowerCase() === "fc" ? "Football Counter" : "Kodewise";
    filteredWorkItems = workItems.filter((w: any) => w.primaryBrandTag?.name === brandName);
  }

  const pageTitle = brand?.toLowerCase() === "fc"
    ? "Football Counter Work Items"
    : brand?.toLowerCase() === "kw"
      ? "Kodewise Work Items"
      : "Work Items";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">{pageTitle}</h2>
        <p className="text-sm text-gray-500">
          Manage all active work across the studio.
        </p>
      </div>

      <WorkClient 
        initialWorkItems={filteredWorkItems} 
        tags={tags} 
        clients={clients} 
        workTypes={workTypes} 
        processes={publishedProcesses} 
        employees={employees} 
        currentUser={user}
      />
    </div>
  );
}
