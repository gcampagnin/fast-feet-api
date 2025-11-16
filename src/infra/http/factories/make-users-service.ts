import { UsersService } from "../../../application/services/users-service";
import { BcryptHasher } from "../../cryptography/bcrypt-hasher";
import { PrismaUsersRepository } from "../../database/prisma/repositories/prisma-users-repository";

export function makeUsersService() {
  const usersRepository = new PrismaUsersRepository();
  const passwordHasher = new BcryptHasher();
  return new UsersService(usersRepository, passwordHasher);
}
