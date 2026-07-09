import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const fd = await req.formData();

  await prisma.brand.update({
    where: { id: Number(id) },
    data: {
      address: (fd.get("address") as string) || null,
      phone: (fd.get("phone") as string) || null,
      email: (fd.get("email") as string) || null,
      website: (fd.get("website") as string) || null,
      brandColor: (fd.get("brandColor") as string) || "#1a1a2e",
    },
  });

  return NextResponse.json({ ok: true });
}
