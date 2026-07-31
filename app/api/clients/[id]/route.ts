import { auth } from "@/auth";
import { ClientService } from "@/services/ClientService";
import { ClientUpdateSchema } from "@/lib/validations/client.schema";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = ClientUpdateSchema.parse({ ...body, id });
    const client = await ClientService.update(parsed);
    return Response.json({ success: true, data: client });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to update client" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await ClientService.archive(id);
    return Response.json({ success: true, data: null });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to delete client" }, { status: 400 });
  }
}
