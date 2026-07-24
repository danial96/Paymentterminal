import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const rec = await prisma.hRMAttendance.findFirst({
    where: {
      employee: { employeeId: "IKIA1025" },
      date: {
        gte: new Date("2026-07-24T00:00:00"),
        lte: new Date("2026-07-24T23:59:59"),
      },
    },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });

  if (!rec) { console.log("Record not found"); return; }
  console.log("Current checkOut:", rec.checkOut);

  // Was stored as UTC (18:26), fix to PKT by adding 5h → 23:26
  const fixedCheckOut = new Date(new Date(rec.checkOut!).getTime() + 5 * 60 * 60 * 1000);
  const workingHours = Math.max(0, (fixedCheckOut.getTime() - new Date(rec.checkIn!).getTime()) / 3600000);
  const overtimeHours = Math.max(0, workingHours - 8);

  await prisma.hRMAttendance.update({
    where: { id: rec.id },
    data: { checkOut: fixedCheckOut, workingHours, overtimeHours },
  });

  console.log("Fixed! checkOut →", fixedCheckOut, "| hours:", workingHours.toFixed(2));
}

main().finally(() => prisma.$disconnect());
