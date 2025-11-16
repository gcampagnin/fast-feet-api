export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
  compare(plainText: string, digest: string): Promise<boolean>;
}
