import { AppError } from "../../errors/app-error";
import type { User, UserRole } from "../../domain/entities";
import type {
  CreateUserInput,
  UpdateUserInput,
  UsersRepository,
} from "../../domain/repositories/users-repository";
import type { PasswordHasher } from "../security/password-hasher";
import { normalizeCpf } from "../../utils/cpf";

type CreateUserPayload = {
  cpf: string;
  name: string;
  password: string;
  role: UserRole;
};

export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private passwordHasher: PasswordHasher,
  ) {}

  private async buildUserPayload(
    data: CreateUserPayload,
  ): Promise<Omit<CreateUserInput, "role"> & { role: UserRole }> {
    const normalizedCpf = normalizeCpf(data.cpf);
    const existingUser = await this.usersRepository.findByCpf(normalizedCpf);

    if (existingUser) {
      throw new AppError("CPF already registered", 409);
    }

    const passwordHash = await this.passwordHasher.hash(data.password);

    return {
      cpf: normalizedCpf,
      name: data.name,
      passwordHash,
      role: data.role,
    };
  }

  async createUser(data: CreateUserPayload): Promise<User> {
    const payload = await this.buildUserPayload(data);
    return this.usersRepository.create(payload);
  }

  async authenticate(cpf: string, password: string): Promise<User> {
    const normalizedCpf = normalizeCpf(cpf);
    const user = await this.usersRepository.findByCpf(normalizedCpf);

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValidPassword = await this.passwordHasher.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    return user;
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.usersRepository.updatePassword(userId, passwordHash);
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    const payload: UpdateUserInput = {};

    if (data.name) {
      payload.name = data.name;
    }

    if (data.cpf) {
      const normalizedCpf = normalizeCpf(data.cpf);
      const existing = await this.usersRepository.findByCpf(normalizedCpf);
      if (existing && existing.id !== userId) {
        throw new AppError("CPF already registered", 409);
      }
      payload.cpf = normalizedCpf;
    }

    return this.usersRepository.update(userId, payload);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.usersRepository.delete(userId);
  }
}
