import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DESIGNATIONS: Record<string, string[]> = {
  "Production Department": [
    "Production Head",
    "Design Team Lead",
    "Sr. Designer",
    "Web Designer",
    "Content Writer",
    "CMS Manager",
    "SEO",
    "IT",
    "Sr. Executive Developer",
    "Executive Developer",
    "Associate Executive Developer",
    "WordPress Intern",
  ],
  "Sales Department": [
    "Head of Sales",
    "Front Sales Team Lead",
    "Sr Sales Executive",
    "Sales Executive",
    "Associate Project Manager",
  ],
};

async function main() {
  const departments = await prisma.hRMDepartment.findMany({
    select: { id: true, name: true },
  });

  console.log("Found departments:", departments.map((d) => d.name));

  for (const [deptName, designations] of Object.entries(DESIGNATIONS)) {
    const dept = departments.find((d) =>
      d.name.toLowerCase().includes(deptName.toLowerCase().split(" ")[0])
    );

    if (!dept) {
      console.log(`⚠ Department not found: ${deptName} — inserting without department`);
    }

    for (const name of designations) {
      const existing = await prisma.hRMDesignation.findFirst({ where: { name } });
      if (existing) {
        console.log(`  ↩ Skipped (exists): ${name}`);
        continue;
      }
      await prisma.hRMDesignation.create({
        data: {
          name,
          departmentId: dept?.id ?? null,
          isActive: true,
        },
      });
      console.log(`  ✓ Added: ${name} → ${dept?.name ?? "No dept"}`);
    }
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
