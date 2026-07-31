import { Prisma } from "@prisma/client";

export class WorkNumberService {
  static async generateWorkNumber(tx: Prisma.TransactionClient, tagId: string, clientId?: string | null): Promise<string> {
    // We need the tag name to determine prefix if it doesn't exist
    const tag = await tx.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new Error("Brand Tag not found");
    }

    // Prefix: lowercase "fc" or "kw"
    const prefix = tag.name.toLowerCase().includes("kodewise") ? "kw" : "fc";

    // Client Code: numeric e.g. "001"
    let clientCode = "000";
    if (clientId) {
      const client = await tx.client.findUnique({ where: { id: clientId } });
      if (client && client.clientCode) {
        clientCode = client.clientCode;
      }
    }

    // Determine sequence number globally across all workItems, regardless of brand/client
    const existingCount = await tx.workItem.count();

    const nextNumber = existingCount + 1;
    const numberPart = nextNumber.toString().padStart(5, "0");

    return `${prefix}-${clientCode}-T-${numberPart}`;
  }
}
