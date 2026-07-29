import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Delete ghost PRESENT records (no checkIn) from Amna's leave period
  const deleted = await prisma.hRMAttendance.deleteMany({
    where: {
      id: { in: [4244, 4245, 4247, 4248, 4249] },
      checkIn: null,
    },
  });

  return NextResponse.json({ ok: true, deleted: deleted.count });
}
