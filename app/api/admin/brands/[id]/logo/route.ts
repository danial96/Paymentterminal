import { NextRequest, NextResponse } from "next/server";
import { currentUserHasPermission } from "@/lib/scope";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function checkAdmin() {
  return currentUserHasPermission("brands");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const brandId = Number(id);

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;
  if (!file || !file.size) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "png";
  const filename = `brand-${brandId}-${Date.now()}.${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "brands");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);

  const logoUrl = `/uploads/brands/${filename}`;
  await prisma.brand.update({ where: { id: brandId }, data: { logoUrl } });

  return NextResponse.json({ logoUrl });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  await prisma.brand.update({ where: { id: Number(id) }, data: { logoUrl: null } });
  return NextResponse.json({ ok: true });
}
