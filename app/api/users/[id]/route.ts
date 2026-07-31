import { auth } from "@/auth";
import { UserService } from "@/services/UserService";
import { UserUpdateSchema } from "@/lib/validations/user.schema";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = UserUpdateSchema.parse({ ...body, id });
    const user = await UserService.update(parsed);
    return Response.json({ success: true, data: user });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to update user" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await UserService.softDelete(id);
    return Response.json({ success: true, data: null });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to delete user" }, { status: 400 });
  }
}
