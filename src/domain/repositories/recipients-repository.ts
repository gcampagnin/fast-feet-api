import type { Recipient } from "../entities";

export type CreateRecipientInput = {
  name: string;
  street: string;
  number: string;
  complement?: string | null;
  city: string;
  state: string;
  cep: string;
  email?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type UpdateRecipientInput = Partial<CreateRecipientInput>;

export type ListRecipientsParams = {
  search?: string;
  page: number;
};

export interface RecipientsRepository {
  create(data: CreateRecipientInput): Promise<Recipient>;
  findById(id: string): Promise<Recipient | null>;
  findMany(params: ListRecipientsParams): Promise<Recipient[]>;
  update(id: string, data: UpdateRecipientInput): Promise<Recipient>;
  delete(id: string): Promise<void>;
}
