import type { User } from "./user";

export type Courier = {
  id: string;
  userId: string;
  phone: string | null;
  vehicle: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CourierWithUser = Courier & {
  user: User;
};
