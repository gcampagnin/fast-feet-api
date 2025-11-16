import { z } from "zod";
import { makeCouriersService } from "../../infra/http/factories/make-couriers-service";
import type { FastifyZodInstance } from "../types";

export async function courierRoutes(app: FastifyZodInstance) {
  const courierService = makeCouriersService();

  const creationSchema = z.object({
    name: z.string(),
    cpf: z.string(),
    password: z.string().min(6),
    phone: z.string().optional(),
    vehicle: z.string().optional(),
  });

  const updateSchema = z.object({
    name: z.string().optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    vehicle: z.string().optional(),
  });

  app.post(
    "/",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        body: creationSchema,
      },
    },
    async (request, reply) => {
      const courier = await courierService.createCourier(request.body);
      return reply.status(201).send(courier);
    },
  );

  app.get(
    "/",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        querystring: z.object({
          search: z.string().optional(),
          page: z.coerce.number().int().positive().default(1),
        }),
      },
    },
    async (request) => {
      const { search, page } = request.query;
      return courierService.listCouriers(search, page);
    },
  );

  app.put(
    "/:id",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: updateSchema,
      },
    },
    async (request) => {
      const { id } = request.params;
      return courierService.updateCourier(id, request.body);
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
      await courierService.deleteCourier(id);
      return reply.status(204).send();
    },
  );
}
