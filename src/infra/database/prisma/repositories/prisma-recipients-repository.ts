import type {
  CreateRecipientInput,
  ListRecipientsParams,
  RecipientsRepository,
  UpdateRecipientInput,
} from "../../../../domain/repositories/recipients-repository";
import { prisma } from "../../../../lib/prisma";

export class PrismaRecipientsRepository implements RecipientsRepository {
  async create(data: CreateRecipientInput) {
    return prisma.recipient.create({ data });
  }

  async findById(id: string) {
    return prisma.recipient.findUnique({ where: { id } });
  }

  async findMany(params: ListRecipientsParams) {
    return prisma.recipient.findMany({
      where: params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { city: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 20,
      skip: (params.page - 1) * 20,
    });
  }

  async update(id: string, data: UpdateRecipientInput) {
    return prisma.recipient.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.recipient.delete({ where: { id } });
  }
}
