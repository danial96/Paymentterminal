import { prisma } from "../lib/prisma";

const FROM = "Huz";
const TO = "Huzaifa";

async function main() {
  const cs1 = await prisma.clientService.updateMany({
    where: { soldByName: FROM },
    data: { soldByName: TO },
  });
  console.log(`soldByName updated:      ${cs1.count}`);

  const cs2 = await prisma.clientService.updateMany({
    where: { upsellerName: FROM },
    data: { upsellerName: TO },
  });
  console.log(`upsellerName updated:    ${cs2.count}`);

  const c1 = await prisma.client.updateMany({
    where: { frontSellerName: FROM },
    data: { frontSellerName: TO },
  });
  console.log(`frontSellerName updated: ${c1.count}`);

  // SellerProfile has unique name — delete "Huz" if "Huzaifa" already exists
  const existing = await prisma.sellerProfile.findUnique({ where: { name: TO } });
  const old = await prisma.sellerProfile.findUnique({ where: { name: FROM } });

  if (old && existing) {
    // Both exist — delete "Huz", keep "Huzaifa"
    await prisma.sellerProfile.delete({ where: { name: FROM } });
    console.log(`sellerProfile: deleted duplicate "${FROM}", kept "${TO}"`);
  } else if (old && !existing) {
    await prisma.sellerProfile.update({ where: { name: FROM }, data: { name: TO } });
    console.log(`sellerProfile: renamed "${FROM}" → "${TO}"`);
  } else {
    console.log(`sellerProfile: "${FROM}" not found, nothing to do`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
