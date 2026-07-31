import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  if (session.user.id !== id && session.user.role !== "TEAM_LEADER") {
    return new Response("Forbidden", { status: 403 });
  }

  const userObj = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: { photo: true, photoMimeType: true }
  });

  if (!userObj || !userObj.photo) {
    return new Response("Not Found", { status: 404 });
  }

  const response = new Response(new Uint8Array(userObj.photo));
  response.headers.set("Content-Type", userObj.photoMimeType || "image/png");
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
