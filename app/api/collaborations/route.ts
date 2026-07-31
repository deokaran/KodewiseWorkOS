import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isTl = session.user.role === "TEAM_LEADER";
  const hasCollabCapability = session.user.capabilities?.includes("Collaborator");

  if (!isTl && !hasCollabCapability) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const yearStr = searchParams.get("year");
  const monthStr = searchParams.get("month");

  try {
    let where: any = {};
    
    // Filter by user if not TL (employee with Collaborator capability can only see their own uploads)
    if (!isTl) {
      where.userId = session.user.id;
    }

    if (yearStr && monthStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1-indexed (1-12)
      
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
      where.date = {
        gte: startOfMonth,
        lte: endOfMonth
      };
    }

    const collabs = await prisma.collaboration.findMany({
      where,
      orderBy: { date: "desc" },
      select: {
        id: true,
        clientName: true,
        date: true,
        paymentType: true,
        amount: true,
        proofImageMimeType: true,
        published: true,
        publishLink: true,
        userId: true,
        createdAt: true,
        user: {
          select: { name: true }
        }
      }
    });

    return Response.json({ success: true, data: collabs });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || "Failed to list collaborations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isTl = session.user.role === "TEAM_LEADER";
  const hasCollabCapability = session.user.capabilities?.includes("Collaborator");

  if (!isTl && !hasCollabCapability) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const clientName = formData.get("clientName") as string;
    const dateStr = formData.get("date") as string;
    const paymentType = formData.get("paymentType") as string;
    const amountStr = formData.get("amount") as string;
    const publishedStr = formData.get("published") as string | null;
    const publishLink = formData.get("publishLink") as string | null;
    const file = formData.get("proofImage") as File | null;

    if (!clientName || !dateStr || !paymentType || !amountStr || !file) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Limit file size to 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return Response.json({ success: false, error: "Proof image exceeds 5MB limit" }, { status: 400 });
    }

    const date = new Date(dateStr);
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ success: false, error: "Amount must be a positive number" }, { status: 400 });
    }

    const published = publishedStr === "true";
    const buffer = Buffer.from(await file.arrayBuffer());

    const collab = await prisma.collaboration.create({
      data: {
        clientName,
        date,
        paymentType,
        amount,
        proofImage: buffer,
        proofImageMimeType: file.type,
        published,
        publishLink: publishLink || null,
        userId: session.user.id, // Store who uploaded this entry
      }
    });

    return Response.json({ success: true, data: { id: collab.id } });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || "Failed to save collaboration" },
      { status: 500 }
    );
  }
}
