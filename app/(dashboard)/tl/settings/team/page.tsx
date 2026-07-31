import { UserService } from "@/services/UserService";
import { CapabilityService } from "@/services/CapabilityService";
import { TeamClient } from "./team-client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { TagService } from "@/services/TagService";
import { ClientService } from "@/services/ClientService";
import { WorkTypeService } from "@/services/WorkTypeService";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { requireRole } from "@/lib/auth/utils";
import { sanitizeForClient } from "@/lib/utils";

export default async function TeamPage() {
  const user = await requireRole("TEAM_LEADER");
  const cookieStore = await cookies();
  const activeBrand = cookieStore.get("activeBrand")?.value || "Football Counter";

  const [
    users,
    capabilities,
    brands,
    poolItems,
    tags,
    clients,
    workTypes,
    processes,
    departments
  ] = await Promise.all([
    UserService.list(activeBrand),
    CapabilityService.list(),
    prisma.tag.findMany({ where: { type: "BRAND", deletedAt: null } }),
    prisma.workItemStage.findMany({
      where: { 
        assignedUserId: null, 
        status: { in: ['READY', 'LOCKED', 'REJECTED', 'IN_PROGRESS'] },
        workItem: { 
          deletedAt: null,
          primaryBrandTag: { name: activeBrand }
        }
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
    TagService.list(),
    ClientService.list(),
    WorkTypeService.list(),
    ProcessTemplateService.list(),
    prisma.department.findMany({ orderBy: { name: "asc" } })
  ]);

  const publishedProcesses = processes.filter((p: any) => p.versions.some((v: any) => v.isPublished));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
          <p className="text-sm text-gray-500">Manage your internal team members and their designations.</p>
        </div>
      </div>

      <TeamClient 
        users={sanitizeForClient(users)} 
        capabilities={sanitizeForClient(capabilities)} 
        brands={sanitizeForClient(brands)} 
        poolItems={sanitizeForClient(poolItems)}
        tags={sanitizeForClient(tags)}
        clients={sanitizeForClient(clients)}
        workTypes={sanitizeForClient(workTypes)}
        processes={sanitizeForClient(publishedProcesses)}
        currentUserId={user.id}
        departments={sanitizeForClient(departments)}
      />
    </div>
  );
}
