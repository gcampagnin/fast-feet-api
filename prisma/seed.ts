import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { normalizeCpf } from "../src/utils/cpf";

const prisma = new PrismaClient();

async function main() {
  const adminCpf = normalizeCpf(process.env.SEED_ADMIN_CPF ?? "00011122233");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN", cpf: adminCpf },
  });

  if (existingAdmin) {
    console.log("Admin user already exists");
    return;
  }

  const passwordHash = await hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      name: "FastFeet Admin",
      cpf: adminCpf,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Seed admin created with CPF:", adminCpf);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
