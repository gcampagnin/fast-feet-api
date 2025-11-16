import type { User, UserRole } from "../entities";

export type CreateUserInput = {
  cpf: string;
  name: string;
  passwordHash: string;
  role: UserRole;
};

export type UpdateUserInput = {
  name?: string;
  cpf?: string;
};

export interface UsersRepository {
  create(data: CreateUserInput): Promise<User>;
  findByCpf(cpf: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  delete(id: string): Promise<void>;
}
