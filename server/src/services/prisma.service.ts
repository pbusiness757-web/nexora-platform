import prismaClient = require("@prisma/client");

const prisma = new prismaClient.PrismaClient();

export = prisma;
