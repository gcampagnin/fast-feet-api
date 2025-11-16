"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = require("bcryptjs");
const prisma_1 = require("../generated/prisma");
const cpf_1 = require("../src/utils/cpf");
const prisma = new prisma_1.PrismaClient();
async function main() {
    const adminCpf = (0, cpf_1.normalizeCpf)(process.env.SEED_ADMIN_CPF ?? "00011122233");
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
    const existingAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN", cpf: adminCpf },
    });
    if (existingAdmin) {
        console.log("Admin user already exists");
        return;
    }
    const passwordHash = await (0, bcryptjs_1.hash)(adminPassword, 10);
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
