import { describe, expect, it, vi } from "vitest";
import type { OrderWithDetails } from "../../domain/entities/order";
import type { CouriersRepository } from "../../domain/repositories/couriers-repository";
import type { DeliveryEventsRepository } from "../../domain/repositories/delivery-events-repository";
import type { OrdersRepository } from "../../domain/repositories/orders-repository";
import type { RecipientsRepository } from "../../domain/repositories/recipients-repository";
import type { NotificationGateway } from "../gateways/notification-gateway";
import { OrdersService } from "./orders-service";
import { AppError } from "../../errors/app-error";

const sampleRecipient = {
  id: "recipient-1",
  name: "Jane",
  street: "Street",
  number: "10",
  complement: null,
  city: "City",
  state: "ST",
  cep: "12345",
  latitude: -23.55052,
  longitude: -46.633308,
  email: null,
  phone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleCourier = {
  id: "courier-1",
  userId: "user-1",
  phone: null,
  vehicle: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: {
    id: "user-1",
    name: "Courier",
    cpf: "12345678900",
    passwordHash: "hashed",
    role: "COURIER" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const buildOrder = (overrides?: Partial<OrderWithDetails>): OrderWithDetails => ({
  id: "order-1",
  recipientId: sampleRecipient.id,
  courierId: sampleCourier.id,
  description: null,
  trackingCode: "FF-123",
  status: "WITHDRAWN",
  deliveryPhoto: null,
  awaitingAt: null,
  withdrawnAt: new Date(),
  deliveredAt: null,
  returnedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  recipient: sampleRecipient,
  courier: sampleCourier,
  ...overrides,
});

const buildService = () => {
  const orders = {
    create: vi.fn<OrdersRepository["create"]>(),
    findMany: vi.fn<OrdersRepository["findMany"]>(),
    findById: vi.fn<OrdersRepository["findById"]>(),
    update: vi.fn<OrdersRepository["update"]>(),
    delete: vi.fn<OrdersRepository["delete"]>(),
    findCourierOrders: vi.fn<OrdersRepository["findCourierOrders"]>(),
    findAwaitingOrdersWithRecipient: vi.fn<OrdersRepository["findAwaitingOrdersWithRecipient"]>(),
  };

  const recipients = {
    create: vi.fn<RecipientsRepository["create"]>(),
    findById: vi.fn<RecipientsRepository["findById"]>(),
    findMany: vi.fn<RecipientsRepository["findMany"]>(),
    update: vi.fn<RecipientsRepository["update"]>(),
    delete: vi.fn<RecipientsRepository["delete"]>(),
  };

  const couriers = {
    create: vi.fn<CouriersRepository["create"]>(),
    findById: vi.fn<CouriersRepository["findById"]>(),
    findByUserId: vi.fn<CouriersRepository["findByUserId"]>(),
    findMany: vi.fn<CouriersRepository["findMany"]>(),
    update: vi.fn<CouriersRepository["update"]>(),
    delete: vi.fn<CouriersRepository["delete"]>(),
  };

  const events = {
    record: vi.fn<DeliveryEventsRepository["record"]>(),
  };

  const notifications = {
    dispatch: vi.fn<NotificationGateway["dispatch"]>(),
  };

  const ordersRepository: OrdersRepository = { ...orders };
  const recipientsRepository: RecipientsRepository = { ...recipients };
  const couriersRepository: CouriersRepository = { ...couriers };
  const eventsRepository: DeliveryEventsRepository = { ...events };
  const notificationGateway: NotificationGateway = { ...notifications };

  const service = new OrdersService(
    ordersRepository,
    recipientsRepository,
    couriersRepository,
    eventsRepository,
    notificationGateway,
  );

  return {
    service,
    ordersRepositoryMocks: orders,
    couriersRepositoryMocks: couriers,
    notificationGatewayMocks: notifications,
  };
};

describe("OrdersService", () => {
  it("delivers orders only after withdrawal", async () => {
    const { service, ordersRepositoryMocks, couriersRepositoryMocks, notificationGatewayMocks } = buildService();

    couriersRepositoryMocks.findByUserId.mockResolvedValue(sampleCourier);
    const pendingOrder = buildOrder({ status: "AWAITING", withdrawnAt: null, courier: null, courierId: null });
    ordersRepositoryMocks.findById.mockResolvedValue(pendingOrder);

    await expect(
      service.deliverOrder({
        orderId: pendingOrder.id,
        courierUserId: sampleCourier.userId,
        photoPath: "photo.jpg",
      }),
    ).rejects.toBeInstanceOf(AppError);

    const withdrawed = buildOrder();
    ordersRepositoryMocks.findById.mockResolvedValue(withdrawed);
    const delivered = buildOrder({ status: "DELIVERED", deliveryPhoto: "photo.jpg", deliveredAt: new Date() });
    ordersRepositoryMocks.update.mockResolvedValue(delivered);

    await service.deliverOrder({
      orderId: withdrawed.id,
      courierUserId: sampleCourier.userId,
      photoPath: "photo.jpg",
    });

    expect(ordersRepositoryMocks.update).toHaveBeenCalledWith(withdrawed.id, {
      status: "DELIVERED",
      deliveryPhoto: "photo.jpg",
      deliveredAt: expect.any(Date),
    });
    expect(notificationGatewayMocks.dispatch).toHaveBeenCalledTimes(1);
  });

  it("filters nearby orders by radius", async () => {
    const { service, ordersRepositoryMocks, couriersRepositoryMocks } = buildService();

    couriersRepositoryMocks.findByUserId.mockResolvedValue(sampleCourier);
    ordersRepositoryMocks.findAwaitingOrdersWithRecipient.mockResolvedValue([
      {
        ...buildOrder({ id: "order-near", status: "AWAITING", courier: sampleCourier, courierId: sampleCourier.id }),
        recipient: { ...sampleRecipient, latitude: -23.55052, longitude: -46.633308 },
      },
      {
        ...buildOrder({ id: "order-far", status: "AWAITING", courier: sampleCourier, courierId: sampleCourier.id }),
        recipient: { ...sampleRecipient, latitude: -22.906847, longitude: -43.172897 },
      },
    ]);

    const result = await service.listNearbyOrders({
      courierUserId: sampleCourier.userId,
      latitude: -23.55052,
      longitude: -46.633308,
      radiusKm: 10,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("order-near");
    expect(result[0]).toHaveProperty("distanceKm", 0);
  });
});
