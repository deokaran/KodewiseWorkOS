import { requireAuth } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { CollaborationsClientPage } from "./collaborations-client-page";

export default async function CollaborationsPage() {
  const user = await requireAuth();

  const isTl = user.role === "TEAM_LEADER";
  const hasCollabCapability = user.capabilities?.includes("Collaborator");

  if (!isTl && !hasCollabCapability) {
    redirect("/employee");
  }

  return <CollaborationsClientPage userRole={user.role} userCapabilities={user.capabilities || []} />;
}
