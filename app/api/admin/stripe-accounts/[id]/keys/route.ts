import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const keyType = formData.get("keyType") as "test" | "live";
  const secretKey = formData.get("secretKey") as string;
  const publishableKey = formData.get("publishableKey") as string;

  if (!keyType || !secretKey || !publishableKey) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const data =
    keyType === "test"
      ? { secretKeyTest: secretKey, publishableKeyTest: publishableKey }
      : { secretKeyLive: secretKey, publishableKeyLive: publishableKey };

  await prisma.stripeAccount.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json({ ok: true });
}
