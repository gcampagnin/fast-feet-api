import type { MultipartFile } from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../env";

export class LocalStorage {
  private uploadDir = env.UPLOAD_DIR;

  async ensureBaseDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async save(file: MultipartFile): Promise<string> {
    await this.ensureBaseDir();
    const extension = file.filename?.split(".").pop();
    const fileName = `${randomUUID()}${extension ? `.${extension}` : ""}`;
    const filePath = path.join(this.uploadDir, fileName);
    const buffer = await file.toBuffer();
    await fs.writeFile(filePath, buffer);
    return filePath;
  }
}

export const storage = new LocalStorage();
