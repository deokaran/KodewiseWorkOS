import { auth } from "@/auth";
import { UserService } from "@/services/UserService";
import { UserCreateSchema } from "@/lib/validations/user.schema";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand") || undefined;

  try {
    const users = await UserService.list(brand);
    return Response.json({ success: true, data: users });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to list users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = UserCreateSchema.parse(body);
    const user = await UserService.create(parsed);
    return Response.json({ success: true, data: user });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message || "Failed to create user" }, { status: 400 });
  }
}
