import { prisma } from "../lib/prisma";

async function reset() {
  const payments = await prisma.payment.deleteMany({ where: { externalRef: { not: null } } });
  console.log("Payments deleted:", payments.count);

  const services = await prisma.clientService.deleteMany({ where: { externalRef: { not: null } } });
  console.log("Services deleted:", services.count);

  const clients = await prisma.client.deleteMany({ where: { services: { none: {} } } });
  console.log("Clients deleted:", clients.count);

  const logs = await prisma.syncLog.deleteMany({});
  console.log("Sync logs cleared:", logs.count);

  await prisma.$disconnect();
  console.log("Done — ab Sync Now chalaao.");
}

reset().catch((e) => { console.error(e); process.exit(1); });
