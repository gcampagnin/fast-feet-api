import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

const authenticateMock = vi.fn();
const changePasswordMock = vi.fn();

vi.mock("../../infra/http/factories/make-users-service", () => {
  return {
    makeUsersService: () => ({
      authenticate: authenticateMock,
      changePassword: changePasswordMock,
    }),
  };
});

describe("Auth HTTP routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
    process.env.JWT_SECRET ??= "test-secret";
    process.env.UPLOAD_DIR ??= "./tmp/test-uploads";
    const mod = await import("../../app");
    app = mod.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authenticateMock.mockReset();
    changePasswordMock.mockReset();
  });

  it("returns JWT token after successful login", async () => {
    authenticateMock.mockResolvedValue({
      id: "user-1",
      name: "Admin",
      role: "ADMIN",
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        cpf: "12345678900",
        password: "secret",
      },
    });

    const body = response.json();
    expect(response.statusCode).toBe(200);
    expect(body).toHaveProperty("token");
    expect(body.user).toMatchObject({ id: "user-1", role: "ADMIN" });
  });

  it("allows admins to change passwords", async () => {
    changePasswordMock.mockResolvedValue(undefined);
    const token = await app.jwt.sign({ role: "ADMIN" }, { sub: "admin-1" });

    const response = await app.inject({
      method: "PATCH",
      url: "/users/00000000-0000-0000-0000-000000000000/password",
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        newPassword: "12345678",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(changePasswordMock).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000000",
      "12345678",
    );
  });
});
