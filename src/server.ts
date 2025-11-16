import { app } from "./app";
import { env } from "./env";
import { storage } from "./lib/storage";

async function bootstrap() {
  await storage.ensureBaseDir();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`Server listening on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  }
}

bootstrap();
