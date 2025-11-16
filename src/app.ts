import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import Fastify, {
  type FastifyError,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";
import { env } from "./env";
import { AppError } from "./errors/app-error";
import { fastifyLoggerOptions } from "./lib/logger";
import { authRoutes } from "./http/routes/auth.routes";
import { courierFlowRoutes } from "./http/routes/courier-flow.routes";
import { courierRoutes } from "./http/routes/couriers.routes";
import { orderRoutes } from "./http/routes/orders.routes";
import { recipientRoutes } from "./http/routes/recipients.routes";
import { userRoutes } from "./http/routes/users.routes";

export const app = Fastify({
  logger: fastifyLoggerOptions,
}).withTypeProvider<ZodTypeProvider>();

app.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

app.decorate(
  "authenticate",
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError("Unauthorized", 401);
    }
  },
);

app.decorate(
  "authorizeAdmin",
  async function (request: FastifyRequest, reply: FastifyReply) {
    await this.authenticate(request, reply);
    if (request.user.role !== "ADMIN") {
      throw new AppError("Admin access required", 403);
    }
  },
);

app.decorate(
  "authorizeCourier",
  async function (request: FastifyRequest, reply: FastifyReply) {
    await this.authenticate(request, reply);
    if (request.user.role !== "COURIER") {
      throw new AppError("Courier access required", 403);
    }
  },
);

app.setErrorHandler((error: FastifyError, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation error",
      issues: error.flatten(),
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      message: error.message,
    });
  }

  if (typeof error.statusCode === "number") {
    return reply.status(error.statusCode).send({
      message: error.message,
    });
  }

  request.log.error(error, "unexpected error");
  return reply.status(500).send({ message: "Internal server error" });
});

app.get("/healthcheck", async () => {
  return { status: "ok" };
});

app.register(authRoutes, { prefix: "/auth" });
app.register(userRoutes, { prefix: "/users" });
app.register(courierRoutes, { prefix: "/couriers" });
app.register(recipientRoutes, { prefix: "/recipients" });
app.register(orderRoutes, { prefix: "/orders" });
app.register(courierFlowRoutes, { prefix: "/courier" });
