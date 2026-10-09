import { NextRequest, NextResponse } from "next/server";
import { currentUserHasPermission } from "@/lib/scope";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await currentUserHasPermission("brands"))) {
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
      invoiceTemplate: (fd.get("invoiceTemplate") as string) || "modern",
    },
  });

  return NextResponse.json({ ok: true });
}
