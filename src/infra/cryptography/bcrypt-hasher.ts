import { compare, hash } from "bcryptjs";
import type { PasswordHasher } from "../../application/security/password-hasher";

const SALT_ROUNDS = 10;

export class BcryptHasher implements PasswordHasher {
  async hash(plainText: string): Promise<string> {
    return hash(plainText, SALT_ROUNDS);
  }

  async compare(plainText: string, digest: string): Promise<boolean> {
    return compare(plainText, digest);
  }
}
