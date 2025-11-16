import type { OrderStatus } from "../../domain/entities/order";

export type NotificationPayload = {
  orderId: string;
  recipientId: string;
  status: OrderStatus;
  payload?: Record<string, unknown>;
};

export interface NotificationGateway {
  dispatch(input: NotificationPayload): Promise<void>;
}
