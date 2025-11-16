import type { OrderStatus } from "./order";

export type Notification = {
  id: string;
  orderId: string;
  recipientId: string;
  status: OrderStatus | string;
  channel: string;
  payload: unknown;
  success: boolean;
  createdAt: Date;
};
