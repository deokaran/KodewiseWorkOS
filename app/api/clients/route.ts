import { auth } from "@/auth";
import { ClientService } from "@/services/ClientService";
import { ClientCreateSchema } from "@/lib/validations/client.schema";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand") || undefined;

  try {
    const clients = await ClientService.list(brand);
    return Response.json({ success: true, data: clients });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to list clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = ClientCreateSchema.parse(body);
    const client = await ClientService.create(parsed);
    return Response.json({ success: true, data: client });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to create client" }, { status: 400 });
  }
}
