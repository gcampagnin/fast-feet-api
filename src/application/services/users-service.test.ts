import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { User } from "../../domain/entities";
import type {
  CreateUserInput,
  UpdateUserInput,
  UsersRepository,
} from "../../domain/repositories/users-repository";
import { AppError } from "../../errors/app-error";
import { UsersService } from "./users-service";
import type { PasswordHasher } from "../security/password-hasher";

class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async create(data: CreateUserInput): Promise<User> {
    const user: User = {
      id: randomUUID(),
      name: data.name,
      cpf: data.cpf,
      passwordHash: data.passwordHash,
      role: data.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(user);
    return user;
  }

  async findByCpf(cpf: string): Promise<User | null> {
    return this.items.find((item) => item.cpf === cpf) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    Object.assign(user, data, { updatedAt: new Date() });
    return user;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

class FakeHasher implements PasswordHasher {
  async hash(plainText: string): Promise<string> {
    return `hashed:${plainText}`;
  }

  async compare(plainText: string, digest: string): Promise<boolean> {
    return digest === `hashed:${plainText}`;
  }
}

describe("UsersService", () => {
  const buildService = () => {
    const repository = new InMemoryUsersRepository();
    const hasher = new FakeHasher();
    const service = new UsersService(repository, hasher);
    return { repository, service };
  };

  it("creates and authenticates users with normalized CPF", async () => {
    const { service } = buildService();

    const created = await service.createUser({
      cpf: "123.456.789-00",
      name: "Admin",
      password: "secret",
      role: "ADMIN",
    });

    const authenticated = await service.authenticate("12345678900", "secret");
    expect(authenticated.id).toBe(created.id);
    expect(authenticated.cpf).toBe("12345678900");
  });

  it("prevents duplicated CPF registrations", async () => {
    const { service } = buildService();

    await service.createUser({
      cpf: "12345678900",
      name: "One",
      password: "secret",
      role: "ADMIN",
    });

    await expect(
      service.createUser({
        cpf: "123.456.789-00",
        name: "Two",
        password: "secret",
        role: "ADMIN",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("changes password hashing the new value", async () => {
    const { service, repository } = buildService();

    const user = await service.createUser({
      cpf: "12345678900",
      name: "Admin",
      password: "secret",
      role: "ADMIN",
    });

    await service.changePassword(user.id, "new-secret");

    const stored = await repository.findById(user.id);
    expect(stored?.passwordHash).toBe("hashed:new-secret");
  });
});
