import type { OrderStatus } from "../../../../domain/entities/order";
import type {
  CreateOrderInput,
  ListOrdersParams,
  OrdersRepository,
  UpdateOrderInput,
} from "../../../../domain/repositories/orders-repository";
import { prisma } from "../../../../lib/prisma";

const DEFAULT_PAGE_SIZE = 20;

export class PrismaOrdersRepository implements OrdersRepository {
  async create(data: CreateOrderInput) {
    return prisma.order.create({
      data,
      include: { recipient: true, courier: { include: { user: true } } },
    });
  }

  async findMany(params: ListOrdersParams) {
    return prisma.order.findMany({
      where: {
        status: params.status,
        courierId: params.courierId,
        recipientId: params.recipientId,
      },
      include: { recipient: true, courier: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: DEFAULT_PAGE_SIZE,
      skip: (params.page - 1) * DEFAULT_PAGE_SIZE,
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { recipient: true, courier: { include: { user: true } } },
    });
  }

  async update(id: string, data: UpdateOrderInput) {
    return prisma.order.update({
      where: { id },
      data,
      include: { recipient: true, courier: { include: { user: true } } },
    });
  }

  async delete(id: string) {
    await prisma.order.delete({ where: { id } });
  }

  async findCourierOrders(courierId: string, status?: OrderStatus) {
    return prisma.order.findMany({
      where: {
        courierId,
        status,
      },
      include: { recipient: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAwaitingOrdersWithRecipient(courierId: string) {
    return prisma.order.findMany({
      where: {
        courierId,
        status: "AWAITING",
        recipient: {
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: { recipient: true },
    });
  }
}
