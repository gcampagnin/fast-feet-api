import type {
  CreateUserInput,
  UpdateUserInput,
  UsersRepository,
} from "../../../../domain/repositories/users-repository";
import { prisma } from "../../../../lib/prisma";

export class PrismaUsersRepository implements UsersRepository {
  async create(data: CreateUserInput) {
    return prisma.user.create({ data });
  }

  async findByCpf(cpf: string) {
    return prisma.user.findUnique({ where: { cpf } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: UpdateUserInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, passwordHash: string) {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async delete(id: string) {
    await prisma.user.delete({ where: { id } });
  }
}
