import type {
  NotificationGateway,
  NotificationPayload,
} from "../../application/gateways/notification-gateway";
import type { Prisma } from "@prisma/client";
import { env } from "../../env";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";

export class PrismaNotificationGateway implements NotificationGateway {
  async dispatch({ orderId, recipientId, status, payload }: NotificationPayload) {
    const channel = env.NOTIFICATION_MOCK === "webhook" ? "webhook" : "console";

    const notification = await prisma.notification.create({
      data: {
        orderId,
        recipientId,
        status,
        channel,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    if (channel === "console") {
      logger.info({ orderId, recipientId, status, payload }, "recipient notified");
      return;
    }

    if (!env.NOTIFICATION_WEBHOOK) {
      logger.warn("webhook channel selected but NOTIFICATION_WEBHOOK is missing");
      return;
    }

    try {
      const result = await fetch(env.NOTIFICATION_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, recipientId, status, payload }),
      });

      if (!result.ok) {
        logger.error(
          { status: result.status, statusText: result.statusText },
          "failed to send notification webhook",
        );
        return;
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: { success: true },
      });
    } catch (error) {
      logger.error({ error }, "failed to send notification webhook");
    }
  }
}
