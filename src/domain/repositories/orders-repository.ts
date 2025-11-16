import type {
  Order,
  OrderStatus,
  OrderWithDetails,
  OrderWithRecipient,
} from "../entities/order";

export type CreateOrderInput = {
  recipientId: string;
  courierId?: string | null;
  description?: string | null;
  trackingCode: string;
};

export type UpdateOrderInput = Partial<
  Pick<
    Order,
    | "recipientId"
    | "courierId"
    | "description"
    | "status"
    | "deliveryPhoto"
    | "awaitingAt"
    | "withdrawnAt"
    | "deliveredAt"
    | "returnedAt"
  >
>;

export type ListOrdersParams = {
  status?: OrderStatus;
  courierId?: string;
  recipientId?: string;
  page: number;
};

export interface OrdersRepository {
  create(data: CreateOrderInput): Promise<OrderWithDetails>;
  findMany(params: ListOrdersParams): Promise<OrderWithDetails[]>;
  findById(id: string): Promise<OrderWithDetails | null>;
  update(id: string, data: UpdateOrderInput): Promise<OrderWithDetails>;
  delete(id: string): Promise<void>;
  findCourierOrders(courierId: string, status?: OrderStatus): Promise<OrderWithRecipient[]>;
  findAwaitingOrdersWithRecipient(courierId: string): Promise<OrderWithRecipient[]>;
}
