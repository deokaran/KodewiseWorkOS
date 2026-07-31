import { requireRole } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { ClientsClientPage } from "../../clients/clients-client-page";

export default async function TlFcClientsPage() {
  await requireRole("TEAM_LEADER");

  const brands = await prisma.tag.findMany({
    where: { type: "BRAND", deletedAt: null }
  });

  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    include: {
      tags: { include: { tag: true } }
    }
  });

  return (
    <ClientsClientPage 
      initialClients={clients} 
      brands={brands}
      filterBrand="fc" 
    />
  );
}
