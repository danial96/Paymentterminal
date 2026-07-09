import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.brand.createMany({
    data: [
      { name: "Craft Vision" },
      { name: "Craft Tide" },
      { name: "Alpha Web Creators" },
      { name: "Creative Web Codes" },
    ],
    skipDuplicates: true,
  });

  await prisma.serviceType.createMany({
    data: [
      { name: "Website Design & Development", isRecurring: false, category: "website" },
      { name: "Website Hosting", isRecurring: true, category: "hosting" },
      { name: "GDPR / Website Security", isRecurring: false, category: "security" },
      { name: "GMB / SEO", isRecurring: false, category: "seo" },
      { name: "Other", isRecurring: false, category: "other" },
    ],
    skipDuplicates: true,
  });

  const adminEmail = "admin@softcube.local";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
      },
    });
    console.log(`Seeded admin user: ${adminEmail} / admin123`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
