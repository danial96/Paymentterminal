import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(id) }, select: { id: true, status: true } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "paid") return NextResponse.json({ ok: true });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "paid", paidAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
