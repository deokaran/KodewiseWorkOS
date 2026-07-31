"use server";

import { requireRole, requireAuth, getSessionUser } from "@/lib/auth/utils";
import { WorkItemService } from "@/services/WorkItemService";
import { WorkItemCreateSchema, WorkItemUpdateSchema } from "@/lib/validations/work-item.schema";
import { revalidatePath } from "next/cache";
import { formatError, sanitizeForClient } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export async function createWorkItemAction(data: unknown) {
  try {
    const user = await requireAuth();
    const parsed = WorkItemCreateSchema.parse(data);

    if (parsed.clientId) {
      const clientObj = await prisma.client.findUnique({ where: { id: parsed.clientId } });
      if (clientObj && !clientObj.isActive) {
        throw new Error("Cannot create tasks for an inactive client.");
      }
    }

    const workItem = await WorkItemService.create(parsed, user.id);
    
    revalidatePath("/tl/work");
    revalidatePath("/employee/work");
    
    return { success: true as const, data: sanitizeForClient(workItem) };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to create work item" };
  }
}

export async function updateWorkItemAction(data: unknown) {
  try {
    const user = await requireRole("TEAM_LEADER");
    const parsed = WorkItemUpdateSchema.parse(data);
    const workItem = await WorkItemService.update(parsed, user.id);
    
    revalidatePath("/tl/work");
    revalidatePath("/employee/work");
    revalidatePath(`/tl/work/${workItem.id}`);
    
    return { success: true as const, data: sanitizeForClient(workItem) };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to update work item" };
  }
}

export async function archiveWorkItemAction(id: string) {
  try {
    const user = await requireRole("TEAM_LEADER");
    await WorkItemService.archive(id, user.id);
    
    revalidatePath("/tl/work");
    revalidatePath("/employee/work");
    
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: formatError(error) || "Failed to archive work item" };
  }
}

export async function getTaskCreationMasterDataAction() {
  try {
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");

    const [brands, clients, workTypes, processTemplates, users] = await Promise.all([
      prisma.tag.findMany({
        where: { type: "BRAND", deletedAt: null },
        orderBy: { name: "asc" }
      }),
      prisma.client.findMany({
        where: { deletedAt: null },
        include: {
          tags: { include: { tag: true } }
        },
        orderBy: { name: "asc" }
      }),
      prisma.workType.findMany({
        orderBy: { name: "asc" }
      }),
      prisma.processTemplate.findMany({
        where: { deletedAt: null },
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
        },
        orderBy: { name: "asc" }
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        include: { capabilities: true },
        orderBy: { name: "asc" }
      })
    ]);
    return {
      success: true as const,
      data: sanitizeForClient({
        currentUser: user,
        brands,
        clients,
        workTypes,
        processTemplates,
        users
      })
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to load master data" };
  }
}
