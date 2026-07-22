import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });

  const count = await (prisma as any).hRMProfileUpdateRequest.count({
    where: { status: "PENDING" },
  });

  return NextResponse.json({ count });
}
