const { PrismaClient } = require("../lib/generated/prisma");

const prisma = new PrismaClient({
  datasources: {
    db: { url: "mysql://root:AXiZVLUDalWtbqZANGznraJKZaruNlay@tokaido.proxy.rlwy.net:38827/railway" },
  },
});

const content = `We're excited to introduce your Employee Self-Service Portal — a dedicated space where you can manage your work life at your fingertips.

What you can do:
• View your real-time attendance — check-in/out times & working hours
• Apply for leaves and track approval status
• Request your payslip from HR
• Request your Bank Account Opening Letter from HR
• Read company notices & announcements
• Submit complaints or concerns privately
• View and request updates to your profile information
• Change your portal password

Login with your company email and your Employee ID as the default password.`;

prisma.hRMNotice
  .create({
    data: {
      title: "Employee Self-Service Portal is Now Live",
      content,
      type: "GENERAL",
      priority: "HIGH",
      targetAll: true,
      isPublished: true,
      publishedAt: new Date(),
    },
  })
  .then((n) => {
    console.log("Notice created — ID:", n.id, "| Title:", n.title);
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());
