import { AppError } from "../../errors/app-error";
import type {
  CreateRecipientInput,
  ListRecipientsParams,
  RecipientsRepository,
  UpdateRecipientInput,
} from "../../domain/repositories/recipients-repository";

export class RecipientsService {
  constructor(private recipientsRepository: RecipientsRepository) {}

  async createRecipient(data: CreateRecipientInput) {
    return this.recipientsRepository.create({
      ...data,
      cep: data.cep.replace(/\D/g, ""),
    });
  }

  async listRecipients(search?: string, page = 1) {
    const params: ListRecipientsParams = { search, page };
    return this.recipientsRepository.findMany(params);
  }

  async getRecipientOrFail(id: string) {
    const recipient = await this.recipientsRepository.findById(id);
    if (!recipient) {
      throw new AppError("Recipient not found", 404);
    }
    return recipient;
  }

  async updateRecipient(id: string, data: UpdateRecipientInput) {
    await this.getRecipientOrFail(id);
    const payload: UpdateRecipientInput = { ...data };
    if (data.cep) {
      payload.cep = data.cep.replace(/\D/g, "");
    }
    return this.recipientsRepository.update(id, payload);
  }

  async deleteRecipient(id: string) {
    await this.recipientsRepository.delete(id);
  }
}
