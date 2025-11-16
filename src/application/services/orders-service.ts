import { randomUUID } from "node:crypto";
import { AppError } from "../../errors/app-error";
import type { OrderStatus, OrderWithDetails } from "../../domain/entities/order";
import type {
  CreateOrderInput,
  ListOrdersParams,
  OrdersRepository,
  UpdateOrderInput,
} from "../../domain/repositories/orders-repository";
import type { CouriersRepository } from "../../domain/repositories/couriers-repository";
import type { RecipientsRepository } from "../../domain/repositories/recipients-repository";
import type { DeliveryEventsRepository } from "../../domain/repositories/delivery-events-repository";
import type { NotificationGateway } from "../gateways/notification-gateway";
import { haversineDistance } from "../../utils/geo";

type CreateOrderPayload = {
  recipientId: string;
  courierId?: string | null;
  description?: string | null;
};

type DeliverOrderPayload = {
  orderId: string;
  courierUserId: string;
  photoPath: string;
};

export class OrdersService {
  constructor(
    private ordersRepository: OrdersRepository,
    private recipientsRepository: RecipientsRepository,
    private couriersRepository: CouriersRepository,
    private deliveryEventsRepository: DeliveryEventsRepository,
    private notificationGateway: NotificationGateway,
  ) {}

  private generateTrackingCode() {
    return `FF-${randomUUID().split("-")[0].toUpperCase()}`;
  }

  private async notify(order: OrderWithDetails) {
    await this.notificationGateway.dispatch({
      orderId: order.id,
      recipientId: order.recipientId,
      status: order.status,
      payload: {
        orderId: order.id,
        trackingCode: order.trackingCode,
        status: order.status,
      },
    });
  }

  private async recordEvent(orderId: string, type: string, payload?: unknown) {
    await this.deliveryEventsRepository.record(orderId, type, payload);
  }

  private async ensureRecipientExists(recipientId: string) {
    const recipient = await this.recipientsRepository.findById(recipientId);
    if (!recipient) {
      throw new AppError("Recipient not found", 404);
    }
    return recipient;
  }

  private async ensureCourierExists(courierId: string) {
    const courier = await this.couriersRepository.findById(courierId);
    if (!courier) {
      throw new AppError("Courier not found", 404);
    }
    return courier;
  }

  private async findCourierByUserId(userId: string) {
    const courier = await this.couriersRepository.findByUserId(userId);
    if (!courier) {
      throw new AppError("Courier profile not found", 404);
    }
    return courier;
  }

  async createOrder(data: CreateOrderPayload) {
    await this.ensureRecipientExists(data.recipientId);

    if (data.courierId) {
      await this.ensureCourierExists(data.courierId);
    }

    const payload: CreateOrderInput = {
      recipientId: data.recipientId,
      courierId: data.courierId ?? null,
      description: data.description,
      trackingCode: this.generateTrackingCode(),
    };

    const order = await this.ordersRepository.create(payload);
    await this.recordEvent(order.id, "CREATED", {
      recipientId: data.recipientId,
      courierId: data.courierId,
    });
    return order;
  }

  async listOrders(params: Omit<ListOrdersParams, "page"> & { page?: number }) {
    return this.ordersRepository.findMany({
      status: params.status,
      courierId: params.courierId,
      recipientId: params.recipientId,
      page: params.page ?? 1,
    });
  }

  async getOrderOrFail(id: string) {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return order;
  }

  async updateOrder(id: string, data: UpdateOrderInput) {
    await this.getOrderOrFail(id);

    if (data.recipientId) {
      await this.ensureRecipientExists(data.recipientId);
    }

    if (data.courierId) {
      await this.ensureCourierExists(data.courierId);
    }

    return this.ordersRepository.update(id, data);
  }

  async deleteOrder(id: string) {
    await this.ordersRepository.delete(id);
  }

  async markAwaiting(id: string) {
    const order = await this.getOrderOrFail(id);
    if (!["PENDING", "RETURNED"].includes(order.status)) {
      throw new AppError("Only pending or returned orders can be set to awaiting", 400);
    }

    const updated = await this.ordersRepository.update(id, {
      status: "AWAITING",
      awaitingAt: new Date(),
    });

    await this.recordEvent(id, "AWAITING", { awaitingAt: updated.awaitingAt });
    await this.notify(updated);
    return updated;
  }

  async withdrawOrder(orderId: string, courierUserId: string) {
    const courier = await this.findCourierByUserId(courierUserId);
    const order = await this.getOrderOrFail(orderId);

    if (order.status !== "AWAITING") {
      throw new AppError("Order is not available for withdrawal", 400);
    }

    if (order.courier && order.courier.id !== courier.id) {
      throw new AppError("Order is assigned to another courier", 403);
    }

    const updated = await this.ordersRepository.update(orderId, {
      courierId: order.courierId ?? courier.id,
      status: "WITHDRAWN",
      withdrawnAt: new Date(),
    });

    await this.recordEvent(orderId, "WITHDRAWN", { courierId: courier.id });
    await this.notify(updated);
    return updated;
  }

  async deliverOrder(params: DeliverOrderPayload) {
    const courier = await this.findCourierByUserId(params.courierUserId);
    const order = await this.getOrderOrFail(params.orderId);

    if (order.status !== "WITHDRAWN") {
      throw new AppError("Order must be withdrawn before delivery", 400);
    }

    if (!order.courier || order.courier.id !== courier.id) {
      throw new AppError("Only the courier assigned can deliver this order", 403);
    }

    const updated = await this.ordersRepository.update(params.orderId, {
      status: "DELIVERED",
      deliveryPhoto: params.photoPath,
      deliveredAt: new Date(),
    });

    await this.recordEvent(params.orderId, "DELIVERED", { deliveryPhoto: params.photoPath });
    await this.notify(updated);
    return updated;
  }

  async returnOrder(orderId: string, courierUserId: string, reason?: string) {
    const courier = await this.findCourierByUserId(courierUserId);
    const order = await this.getOrderOrFail(orderId);

    if (order.status !== "WITHDRAWN") {
      throw new AppError("Only withdrawn orders can be returned", 400);
    }

    if (!order.courier || order.courier.id !== courier.id) {
      throw new AppError("Only the assigned courier can return this order", 403);
    }

    const updated = await this.ordersRepository.update(orderId, {
      status: "RETURNED",
      returnedAt: new Date(),
    });

    await this.recordEvent(orderId, "RETURNED", { reason });
    await this.notify(updated);
    return updated;
  }

  async listCourierOrders(courierUserId: string, status?: OrderStatus) {
    const courier = await this.findCourierByUserId(courierUserId);
    return this.ordersRepository.findCourierOrders(courier.id, status);
  }

  async listNearbyOrders(params: {
    courierUserId: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
  }) {
    const courier = await this.findCourierByUserId(params.courierUserId);
    const orders = await this.ordersRepository.findAwaitingOrdersWithRecipient(courier.id);

    return orders
      .map((order) => {
        const distanceKm = haversineDistance(
          params.latitude,
          params.longitude,
          order.recipient.latitude!,
          order.recipient.longitude!,
        );
        return {
          ...order,
          distanceKm,
        };
      })
      .filter((order) => order.distanceKm <= params.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
}
