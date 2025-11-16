export type Recipient = {
  id: string;
  name: string;
  street: string;
  number: string;
  complement: string | null;
  city: string;
  state: string;
  cep: string;
  latitude: number | null;
  longitude: number | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};
