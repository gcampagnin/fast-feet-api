import { z } from "zod";
import { makeUsersService } from "../../infra/http/factories/make-users-service";
import type { FastifyZodInstance } from "../types";

export async function authRoutes(app: FastifyZodInstance) {
  const userService = makeUsersService();

  app.post(
    "/login",
    {
      schema: {
        body: z.object({
          cpf: z.string(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { cpf, password } = request.body;
      const user = await userService.authenticate(cpf, password);
      const token = await reply.jwtSign(
        { role: user.role },
        { sub: user.id, expiresIn: "1d" },
      );
      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      };
    },
  );
}
