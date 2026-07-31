import { auth } from "@/auth";
import { WorkItemService } from "@/services/WorkItemService";
import { WorkItemCreateSchema } from "@/lib/validations/work-item.schema";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const clientId = searchParams.get("clientId") || undefined;
  const primaryBrandTagId = searchParams.get("primaryBrandTagId") || undefined;

  try {
    const workItems = await WorkItemService.list({
      status: status as any,
      clientId,
      primaryBrandTagId
    });
    return Response.json({ success: true, data: workItems });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to list work items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    // Parse date if present
    if (body.estimatedEnd) {
      body.estimatedEnd = new Date(body.estimatedEnd);
    }
    const parsed = WorkItemCreateSchema.parse(body);
    const workItem = await WorkItemService.create(parsed, session.user.id);
    return Response.json({ success: true, data: workItem });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to create work item" }, { status: 400 });
  }
}
