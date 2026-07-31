import { requireRole } from "@/lib/auth/utils";
import { TLDashboardClient } from "../tl-dashboard-client";
import { prisma } from "@/lib/db/prisma";
import { sanitizeForClient } from "@/lib/utils";

export default async function TLKWPage() {
  await requireRole("TEAM_LEADER");

  const [brands, clients, workTypes, templates, users] = await Promise.all([
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
    })
  ]);

  return (
    <TLDashboardClient 
      activeTab="kodewise"
      initialBrands={sanitizeForClient(brands)}
      initialClients={sanitizeForClient(clients)}
      initialWorkTypes={sanitizeForClient(workTypes)}
      initialProcessTemplates={sanitizeForClient(templates)}
      initialUsers={sanitizeForClient(users)}
    />
  );
}
