import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../lib/prisma";
prisma.client.deleteMany().then(r => {
  console.log("Deleted:", r.count, "clients");
  return prisma.$disconnect();
});
