import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { ClientCreateSchema, ClientUpdateSchema } from "@/lib/validations/client.schema";
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  buildWeeklyScheduleFromTargets,
  createEmptyWeeklySchedule,
  normalizeWeeklySchedule,
  parseClientNotes,
  serializeClientNotes,
} from "@/lib/client-metadata";

function decryptClient<T extends {
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}>(client: T): T {
  if (!client) return client;
  return {
    ...client,
    contactPerson: decrypt(client.contactPerson),
    email: decrypt(client.email),
    phone: decrypt(client.phone),
    address: decrypt(client.address),
  };
}

function parseRawNotes(notes: string | null | undefined): Record<string, unknown> {
  if (!notes) return {};

  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function hasOwn(rawNotes: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(rawNotes, key);
}

function hasTargetData(rawNotes: Record<string, unknown>) {
  return (
    hasOwn(rawNotes, "targets") ||
    hasOwn(rawNotes, "post") ||
    hasOwn(rawNotes, "reel") ||
    (typeof rawNotes.customTargetName === "string" && rawNotes.customTargetName.trim().length > 0)
  );
}

function normalizeNotesForWrite(
  incomingNotes: string | null | undefined,
  existingNotes?: string | null,
  isDeactivating: boolean = false
) {
  if (isDeactivating) {
    const baseMeta = parseClientNotes(incomingNotes !== undefined ? incomingNotes : existingNotes);
    const rawIncoming = parseRawNotes(incomingNotes !== undefined ? incomingNotes : existingNotes);
    return serializeClientNotes({
      amc: typeof rawIncoming.amc === "boolean" ? rawIncoming.amc : baseMeta.amc,
      seo: typeof rawIncoming.seo === "boolean" ? rawIncoming.seo : baseMeta.seo,
      status: typeof rawIncoming.status === "string" ? rawIncoming.status : baseMeta.status,
      revamp: typeof rawIncoming.revamp === "string" ? rawIncoming.revamp : baseMeta.revamp,
      targets: [],
      weeklySchedule: createEmptyWeeklySchedule(),
      post: 0,
      reel: 0,
    });
  }

  if (incomingNotes === undefined) return undefined;
  if (incomingNotes === null || incomingNotes === "") return incomingNotes;

  const existingMeta = parseClientNotes(existingNotes);
  const incomingMeta = parseClientNotes(incomingNotes);
  const rawIncoming = parseRawNotes(incomingNotes);
  const hasIncomingSchedule = hasOwn(rawIncoming, "weeklySchedule");
  const hasIncomingTargets = hasTargetData(rawIncoming);

  const nextTargets = hasIncomingTargets ? incomingMeta.targets : existingMeta.targets;
  let nextSchedule = existingMeta.weeklySchedule;

  if (hasIncomingSchedule) {
    nextSchedule = normalizeWeeklySchedule(rawIncoming.weeklySchedule, nextTargets);
  } else if (hasIncomingTargets) {
    nextSchedule = buildWeeklyScheduleFromTargets(nextTargets);
  } else if (existingMeta.targets.length === 0 && incomingMeta.targets.length > 0) {
    nextSchedule = buildWeeklyScheduleFromTargets(incomingMeta.targets);
  }

  return serializeClientNotes({
    amc: typeof rawIncoming.amc === "boolean" ? rawIncoming.amc : existingMeta.amc,
    seo: typeof rawIncoming.seo === "boolean" ? rawIncoming.seo : existingMeta.seo,
    status: typeof rawIncoming.status === "string" ? rawIncoming.status : existingMeta.status,
    revamp: typeof rawIncoming.revamp === "string" ? rawIncoming.revamp : existingMeta.revamp,
    targets: nextTargets,
    weeklySchedule: nextSchedule,
  });
}

export class ClientService {
  static async list(activeBrandName?: string, includeInactive: boolean = false) {
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
        ...(activeBrandName
          ? {
              tags: {
                some: {
                  tag: {
                    name: activeBrandName,
                    type: "BRAND",
                  },
                },
              },
            }
          : {}),
      },
      include: {
        tags: {
          include: { tag: true },
        },
        _count: {
          select: { contracts: true, workItems: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return clients.map(decryptClient);
  }

  static async getById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id, deletedAt: null },
      include: {
        tags: {
          include: { tag: true },
        },
        contracts: {
          orderBy: { startDate: "desc" },
        },
        _count: {
          select: { workItems: true },
        },
      },
    });
    return client ? decryptClient(client) : null;
  }

  static async create(data: z.infer<typeof ClientCreateSchema>) {
    return prisma.$transaction(async (tx) => {
      let clientCode = data.clientCode;
      if (!clientCode || !clientCode.trim()) {
        const lastClient = await tx.client.findFirst({
          where: { deletedAt: null, clientCode: { not: "" } },
          orderBy: { clientCode: "desc" },
        });
        let nextNum = 1;
        if (lastClient && lastClient.clientCode) {
          const parsed = parseInt(lastClient.clientCode, 10);
          if (!isNaN(parsed)) {
            nextNum = parsed + 1;
          }
        }
        clientCode = nextNum.toString().padStart(3, "0");
      }

      const client = await tx.client.create({
        data: {
          name: data.name,
          clientCode,
          description: data.description,
          contactPerson: encrypt(data.contactPerson),
          email: encrypt(data.email),
          phone: encrypt(data.phone),
          address: encrypt(data.address),
          website: data.website,
          notes: normalizeNotesForWrite(data.notes, undefined, data.isActive === false),
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      if (data.tagIds && data.tagIds.length > 0) {
        await tx.clientTag.createMany({
          data: data.tagIds.map((tagId) => ({
            clientId: client.id,
            tagId,
          })),
        });
      }

      const result = await tx.client.findUnique({
        where: { id: client.id },
        include: { tags: { include: { tag: true } } },
      });
      return result ? decryptClient(result) : null;
    });
  }

  static async update(data: z.infer<typeof ClientUpdateSchema>) {
    const existing = await prisma.client.findUnique({ where: { id: data.id } });
    if (!existing) throw new AppError("Client not found", "NOT_FOUND", 404);

    const isDeactivating = data.isActive === false;

    return prisma.$transaction(async (tx) => {
      let clientCode = data.clientCode;
      if (clientCode === undefined) {
        clientCode = existing.clientCode;
      }

      let notesToWrite: string | null | undefined;
      if (isDeactivating) {
        notesToWrite = normalizeNotesForWrite(data.notes, existing.notes, true);
      } else if (data.notes !== undefined) {
        notesToWrite = normalizeNotesForWrite(data.notes, existing.notes, false);
      }

      const client = await tx.client.update({
        where: { id: data.id },
        data: {
          name: data.name,
          clientCode,
          description: data.description,
          contactPerson: encrypt(data.contactPerson),
          email: encrypt(data.email),
          phone: encrypt(data.phone),
          address: encrypt(data.address),
          website: data.website,
          notes: notesToWrite,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
      });

      if (isDeactivating) {
        await tx.contract.updateMany({
          where: { clientId: client.id, isActive: true },
          data: { isActive: false },
        });
      }

      if (data.tagIds !== undefined) {
        await tx.clientTag.deleteMany({ where: { clientId: client.id } });
        if (data.tagIds.length > 0) {
          await tx.clientTag.createMany({
            data: data.tagIds.map((tagId) => ({
              clientId: client.id,
              tagId,
            })),
          });
        }
      }

      const result = await tx.client.findUnique({
        where: { id: client.id },
        include: { tags: { include: { tag: true } } },
      });
      return result ? decryptClient(result) : null;
    });
  }

  static async archive(id: string) {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) throw new AppError("Client not found", "NOT_FOUND", 404);

    const clearedNotes = normalizeNotesForWrite(existing.notes, existing.notes, true);

    return prisma.$transaction(async (tx) => {
      await tx.contract.updateMany({
        where: { clientId: id, isActive: true },
        data: { isActive: false },
      });

      const client = await tx.client.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          notes: clearedNotes,
        },
      });
      return decryptClient(client);
    });
  }

  static async restore(id: string) {
    const client = await prisma.client.update({
      where: { id },
      data: { deletedAt: null },
    });
    return decryptClient(client);
  }
}
