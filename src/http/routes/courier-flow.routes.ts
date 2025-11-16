import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { storage } from "../../lib/storage";
import { makeCouriersService } from "../../infra/http/factories/make-couriers-service";
import { makeOrdersService } from "../../infra/http/factories/make-orders-service";
import type { FastifyZodInstance } from "../types";

export async function courierFlowRoutes(app: FastifyZodInstance) {
  const courierService = makeCouriersService();
  const orderService = makeOrdersService();

  app.get(
    "/me/orders",
    {
      preHandler: app.authorizeCourier,
      schema: {
        querystring: z.object({
          status: z
            .enum(["PENDING", "AWAITING", "WITHDRAWN", "DELIVERED", "RETURNED"])
            .optional(),
        }),
      },
    },
    async (request) => {
      const { status } = request.query;
      return orderService.listCourierOrders(request.user.sub, status);
    },
  );

  app.get(
    "/:courierId/orders",
    {
      preHandler: app.authenticate,
      schema: {
        params: z.object({ courierId: z.string().uuid() }),
      },
    },
    async (request) => {
      const { courierId } = request.params;

      if (request.user.role === "COURIER") {
        const courier = await courierService.getCourierOrFail(courierId);
        if (courier.userId !== request.user.sub) {
          throw new AppError("Forbidden", 403);
        }
      }

      return orderService.listOrders({ courierId });
    },
  );

  app.patch(
    "/orders/:id/withdraw",
    {
      preHandler: app.authorizeCourier,
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return orderService.withdrawOrder(id, request.user.sub);
    },
  );

  app.patch(
    "/orders/:id/deliver",
    {
      preHandler: app.authorizeCourier,
      schema: {
        params: z.object({ id: z.string().uuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      const file = await request.file();
      if (!file) {
        throw new AppError("Delivery proof photo is required", 400);
      }
      const photoPath = await storage.save(file);
      return orderService.deliverOrder({
        orderId: id,
        courierUserId: request.user.sub,
        photoPath,
      });
    },
  );

  app.patch(
    "/orders/:id/return",
    {
      preHandler: app.authorizeCourier,
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ reason: z.string().optional() }).optional(),
      },
    },
    async (request) => {
      const { id } = request.params;
      const reason = request.body?.reason;
      return orderService.returnOrder(id, request.user.sub, reason);
    },
  );

  app.get(
    "/orders/nearby",
    {
      preHandler: app.authorizeCourier,
      schema: {
        querystring: z.object({
          latitude: z.coerce.number(),
          longitude: z.coerce.number(),
          radiusKm: z.coerce.number().default(10),
        }),
      },
    },
    async (request) => {
      const { latitude, longitude, radiusKm } = request.query;
      return orderService.listNearbyOrders({
        courierUserId: request.user.sub,
        latitude,
        longitude,
        radiusKm,
      });
    },
  );
}
