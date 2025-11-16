export type DeliveryEvent = {
  id: string;
  orderId: string;
  type: string;
  payload: unknown;
  createdAt: Date;
};
