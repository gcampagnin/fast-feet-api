export type UserRole = "ADMIN" | "COURIER";

export type User = {
  id: string;
  name: string;
  cpf: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};
