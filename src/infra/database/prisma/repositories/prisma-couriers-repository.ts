import type {
  CouriersRepository,
  CreateCourierInput,
  ListCouriersParams,
  UpdateCourierInput,
} from "../../../../domain/repositories/couriers-repository";
import { prisma } from "../../../../lib/prisma";

export class PrismaCouriersRepository implements CouriersRepository {
  async create(data: CreateCourierInput) {
    return prisma.courier.create({ data });
  }

  async findById(id: string) {
    return prisma.courier.findUnique({ where: { id }, include: { user: true } });
  }

  async findByUserId(userId: string) {
    return prisma.courier.findUnique({ where: { userId }, include: { user: true } });
  }

  async findMany(params: ListCouriersParams) {
    return prisma.courier.findMany({
      where: params.search
        ? {
            OR: [
              { user: { name: { contains: params.search, mode: "insensitive" } } },
              { user: { cpf: { contains: params.search.replace(/\D/g, "") } } },
            ],
          }
        : undefined,
      include: { user: true },
      take: 20,
      skip: (params.page - 1) * 20,
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: UpdateCourierInput) {
    return prisma.courier.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.courier.delete({ where: { id } });
  }
}
