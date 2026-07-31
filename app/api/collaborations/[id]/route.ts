import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TEAM_LEADER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const formData = await req.formData();
    const clientName = formData.get("clientName") as string;
    const dateStr = formData.get("date") as string;
    const paymentType = formData.get("paymentType") as string;
    const amountStr = formData.get("amount") as string;
    const publishedStr = formData.get("published") as string | null;
    const publishLink = formData.get("publishLink") as string | null;
    const file = formData.get("proofImage") as File | null;

    if (!clientName || !dateStr || !paymentType || !amountStr) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return Response.json({ success: false, error: "Amount must be a positive number" }, { status: 400 });
    }

    const date = new Date(dateStr);

    const updateData: any = {
      clientName,
      date,
      paymentType,
      amount,
      published: publishedStr === "true",
      publishLink: publishLink || null,
    };

    if (file && file.size > 0) {
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return Response.json({ success: false, error: "Proof image exceeds 5MB limit" }, { status: 400 });
      }
      updateData.proofImage = Buffer.from(await file.arrayBuffer());
      updateData.proofImageMimeType = file.type;
    }

    const updated = await prisma.collaboration.update({
      where: { id },
      data: updateData
    });

    return Response.json({ success: true, data: { id: updated.id } });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || "Failed to update collaboration" },
      { status: 500 }
    );
  }
}
