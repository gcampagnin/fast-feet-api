import pino from "pino";
import { env } from "../env";

const loggerOptions = {
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
} satisfies pino.LoggerOptions;

export const logger = pino(loggerOptions);
export const fastifyLoggerOptions = env.NODE_ENV === "test" ? false : loggerOptions;
