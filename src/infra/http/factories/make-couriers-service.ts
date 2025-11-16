import { CouriersService } from "../../../application/services/couriers-service";
import { PrismaCouriersRepository } from "../../database/prisma/repositories/prisma-couriers-repository";
import { makeUsersService } from "./make-users-service";

export function makeCouriersService() {
  const couriersRepository = new PrismaCouriersRepository();
  const usersService = makeUsersService();
  return new CouriersService(couriersRepository, usersService);
}
