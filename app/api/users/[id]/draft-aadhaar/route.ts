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

  const draft = await prisma.profileDraft.findUnique({
    where: { userId: id },
    select: { aadhaarPhoto: true, aadhaarPhotoMimeType: true }
  });

  if (!draft || !draft.aadhaarPhoto) {
    return new Response("Not Found", { status: 404 });
  }

  const response = new Response(new Uint8Array(draft.aadhaarPhoto));
  response.headers.set("Content-Type", draft.aadhaarPhotoMimeType || "image/png");
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return response;
}
