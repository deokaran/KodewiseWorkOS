import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isTl = session.user.role === "TEAM_LEADER";
  const hasCollabCapability = session.user.capabilities?.includes("Collaborator");

  if (!isTl && !hasCollabCapability) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { id } = await params;

  try {
    const col = await prisma.collaboration.findUnique({
      where: { id }
    });

    if (!col || !col.proofImage) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Secure owner filter: if they are not TL, they can only view proof image for entries they uploaded
    if (!isTl && col.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const mimeType = col.proofImageMimeType || "image/jpeg";
    
    return new NextResponse(new Uint8Array(col.proofImage), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error("Error serving proof image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
