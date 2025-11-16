export interface DeliveryEventsRepository {
  record(orderId: string, type: string, payload?: unknown): Promise<void>;
}
