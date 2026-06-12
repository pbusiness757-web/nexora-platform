const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.client.upsert({
    where: { id: "test-client" },
    update: {},
    create: {
      id: "test-client",
      companyName: "Test Company",
      country: "Russia",
      riskLevel: "LOW",
    },
  });

  console.log("Test client seeded");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });