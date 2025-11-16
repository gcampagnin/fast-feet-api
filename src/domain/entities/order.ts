import type { Courier } from "./courier";
import type { Recipient } from "./recipient";
import type { User } from "./user";

export type OrderStatus =
  | "PENDING"
  | "AWAITING"
  | "WITHDRAWN"
  | "DELIVERED"
  | "RETURNED";

export type Order = {
  id: string;
  recipientId: string;
  courierId: string | null;
  description: string | null;
  trackingCode: string;
  status: OrderStatus;
  deliveryPhoto: string | null;
  awaitingAt: Date | null;
  withdrawnAt: Date | null;
  deliveredAt: Date | null;
  returnedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderWithDetails = Order & {
  recipient: Recipient;
  courier: (Courier & { user: User }) | null;
};

export type OrderWithRecipient = Order & {
  recipient: Recipient;
};
