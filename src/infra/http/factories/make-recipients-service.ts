import { RecipientsService } from "../../../application/services/recipients-service";
import { PrismaRecipientsRepository } from "../../database/prisma/repositories/prisma-recipients-repository";

export function makeRecipientsService() {
  const recipientsRepository = new PrismaRecipientsRepository();
  return new RecipientsService(recipientsRepository);
}
