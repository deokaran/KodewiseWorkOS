import { requireRole } from "@/lib/auth/utils";
import { UserService } from "@/services/UserService";
import { CapabilityService } from "@/services/CapabilityService";
import { prisma } from "@/lib/db/prisma";
import { TeamClient } from "../settings/team/team-client";
import { TagService } from "@/services/TagService";
import { ClientService } from "@/services/ClientService";
import { WorkTypeService } from "@/services/WorkTypeService";
import { ProcessTemplateService } from "@/services/ProcessTemplateService";
import { sanitizeForClient } from "@/lib/utils";

export default async function TLTeamMembersPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const user = await requireRole("TEAM_LEADER");
  const { brand } = await searchParams;

  // Load team, capabilities, brands, and unassigned active stages for worker management
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
    UserService.list(),
    CapabilityService.list(),
    prisma.tag.findMany({ where: { type: "BRAND", deletedAt: null } }),
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
    TagService.list(),
    ClientService.list(),
    WorkTypeService.list(),
    ProcessTemplateService.list(),
    prisma.department.findMany({ orderBy: { name: "asc" } })
  ]);

  let filteredUsers = users;
  if (brand) {
    const brandName = brand.toLowerCase() === "fc" ? "Football Counter" : "Kodewise";
    filteredUsers = users.filter((u: any) => u.brand?.name === brandName);
  }

  const pageTitle = brand?.toLowerCase() === "fc"
    ? "Football Counter Team"
    : brand?.toLowerCase() === "kw"
      ? "Kodewise Team"
      : "Team Members";

  const publishedProcesses = processes.filter((p: any) => p.versions.some((v: any) => v.isPublished));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">{pageTitle}</h2>
        <p className="text-sm text-gray-500">
          Manage employee details, add members, remove members, and assign work.
        </p>
      </div>

      <TeamClient 
        users={sanitizeForClient(filteredUsers)} 
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
