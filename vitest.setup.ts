import { vi } from "vitest";

class PrismaClientMock {
  $disconnect = vi.fn();
}

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: PrismaClientMock,
    Prisma: {},
  };
});
