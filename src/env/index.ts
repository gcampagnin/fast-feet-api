import { config as loadEnv, parse as parseEnv } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

loadEnv();

const fallbackEnv = (() => {
  const examplePath = path.resolve(process.cwd(), ".env.example");
  if (!existsSync(examplePath)) {
    return {};
  }

  try {
    return parseEnv(readFileSync(examplePath));
  } catch (error) {
    console.warn("Failed to parse .env.example, continuing without fallbacks", error);
    return {};
  }
})();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10, "JWT secret must be at least 10 characters"),
  UPLOAD_DIR: z.string().default("./uploads"),
  NOTIFICATION_WEBHOOK: z.string().url().optional(),
  NOTIFICATION_MOCK: z.enum(["console", "webhook"]).default("console"),
});

const parsedEnv = envSchema.safeParse({
  ...fallbackEnv,
  ...process.env,
});

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.format());
  throw new Error("Invalid environment variables.");
}

export const env = parsedEnv.data;
