import { z } from "zod";
import { makeUsersService } from "../../infra/http/factories/make-users-service";
import type { FastifyZodInstance } from "../types";

export async function userRoutes(app: FastifyZodInstance) {
  const userService = makeUsersService();

  app.patch(
    "/:id/password",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          newPassword: z.string().min(8),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { newPassword } = request.body;
      await userService.changePassword(id, newPassword);
      return reply.status(204).send();
    },
  );
}
