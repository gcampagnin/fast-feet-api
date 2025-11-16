import { OrdersService } from "../../../application/services/orders-service";
import { PrismaNotificationGateway } from "../../notifications/prisma-notification-gateway";
import { PrismaCouriersRepository } from "../../database/prisma/repositories/prisma-couriers-repository";
import { PrismaRecipientsRepository } from "../../database/prisma/repositories/prisma-recipients-repository";
import { PrismaOrdersRepository } from "../../database/prisma/repositories/prisma-orders-repository";
import { PrismaDeliveryEventsRepository } from "../../database/prisma/repositories/prisma-delivery-events-repository";

export function makeOrdersService() {
  const ordersRepository = new PrismaOrdersRepository();
  const recipientsRepository = new PrismaRecipientsRepository();
  const couriersRepository = new PrismaCouriersRepository();
  const deliveryEventsRepository = new PrismaDeliveryEventsRepository();
  const notificationGateway = new PrismaNotificationGateway();

  return new OrdersService(
    ordersRepository,
    recipientsRepository,
    couriersRepository,
    deliveryEventsRepository,
    notificationGateway,
  );
}
