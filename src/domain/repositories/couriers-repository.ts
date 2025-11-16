import type { Courier, CourierWithUser } from "../entities/courier";

export type CreateCourierInput = {
  userId: string;
  phone?: string | null;
  vehicle?: string | null;
};

export type UpdateCourierInput = {
  phone?: string | null;
  vehicle?: string | null;
};

export type ListCouriersParams = {
  search?: string;
  page: number;
};

export interface CouriersRepository {
  create(data: CreateCourierInput): Promise<Courier>;
  findById(id: string): Promise<CourierWithUser | null>;
  findByUserId(userId: string): Promise<CourierWithUser | null>;
  findMany(params: ListCouriersParams): Promise<CourierWithUser[]>;
  update(id: string, data: UpdateCourierInput): Promise<Courier>;
  delete(id: string): Promise<void>;
}
