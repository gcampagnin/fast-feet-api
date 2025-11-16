import { z } from "zod";
import { makeRecipientsService } from "../../infra/http/factories/make-recipients-service";
import type { FastifyZodInstance } from "../types";

const baseSchema = {
  name: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  city: z.string(),
  state: z.string().length(2),
  cep: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
};

export async function recipientRoutes(app: FastifyZodInstance) {
  const recipientService = makeRecipientsService();

  app.post(
    "/",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        body: z.object(baseSchema),
      },
    },
    async (request, reply) => {
      const recipient = await recipientService.createRecipient(request.body);
      return reply.status(201).send(recipient);
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
      return recipientService.listRecipients(search, page);
    },
  );

  app.put(
    "/:id",
    {
      preHandler: app.authorizeAdmin,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object(baseSchema).partial(),
      },
    },
    async (request) => {
      const { id } = request.params;
      return recipientService.updateRecipient(id, request.body);
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
      await recipientService.deleteRecipient(id);
      return reply.status(204).send();
    },
  );
}
