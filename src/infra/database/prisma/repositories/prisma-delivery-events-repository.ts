import type { DeliveryEventsRepository } from "../../../../domain/repositories/delivery-events-repository";
import { prisma } from "../../../../lib/prisma";

export class PrismaDeliveryEventsRepository implements DeliveryEventsRepository {
  async record(orderId: string, type: string, payload?: unknown) {
    await prisma.deliveryEvent.create({
      data: {
        orderId,
        type,
        payload: payload as any,
      },
    });
  }
}
