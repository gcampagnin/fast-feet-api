import { z } from "zod";
import { makeOrdersService } from "../../infra/http/factories/make-orders-service";
import type { FastifyZodInstance } from "../types";

export async function orderRoutes(app: FastifyZodInstance) {
  const orderService = makeOrdersService();

  const baseSchema = z.object({
    recipientId: z.string().uuid(),
    courierId: z.string().uuid().nullable().optional(),
    description: z.string().optional(),
  });

  app.post(
    "/",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        body: baseSchema,
      },
    },
    async (request, reply) => {
      const order = await orderService.createOrder(request.body);
      return reply.status(201).send(order);
    },
  );

  app.get(
    "/",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        querystring: z.object({
          status: z
            .enum(["PENDING", "AWAITING", "WITHDRAWN", "DELIVERED", "RETURNED"])
            .optional(),
          courierId: z.string().uuid().optional(),
          recipientId: z.string().uuid().optional(),
          page: z.coerce.number().int().positive().default(1),
        }),
      },
    },
    async (request) => {
      return orderService.listOrders(request.query);
    },
  );

  app.get(
    "/:id",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return orderService.getOrderOrFail(id);
    },
  );

  app.put(
    "/:id",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: baseSchema.partial(),
      },
    },
    async (request) => {
      const { id } = request.params;
      return orderService.updateOrder(id, request.body);
    },
  );

  app.delete(
    "/:id",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      await orderService.deleteOrder(id);
      return reply.status(204).send();
    },
  );

  app.patch(
    "/:id/await",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return orderService.markAwaiting(id);
    },
  );
}
