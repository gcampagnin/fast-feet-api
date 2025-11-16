import { AppError } from "../../errors/app-error";
import type {
  CouriersRepository,
  ListCouriersParams,
} from "../../domain/repositories/couriers-repository";
import { UsersService } from "./users-service";

type CreateCourierInput = {
  name: string;
  cpf: string;
  password: string;
  phone?: string;
  vehicle?: string;
};

type UpdateCourierInput = {
  name?: string;
  cpf?: string;
  phone?: string;
  vehicle?: string;
};

export class CouriersService {
  constructor(
    private couriersRepository: CouriersRepository,
    private usersService: UsersService,
  ) {}

  async createCourier(data: CreateCourierInput) {
    const user = await this.usersService.createUser({
      cpf: data.cpf,
      name: data.name,
      password: data.password,
      role: "COURIER",
    });

    const courier = await this.couriersRepository.create({
      userId: user.id,
      phone: data.phone,
      vehicle: data.vehicle,
    });

    return this.getCourierOrFail(courier.id);
  }

  async listCouriers(search?: string, page = 1) {
    const params: ListCouriersParams = { search, page };
    return this.couriersRepository.findMany(params);
  }

  async getCourierOrFail(id: string) {
    const courier = await this.couriersRepository.findById(id);
    if (!courier) {
      throw new AppError("Courier not found", 404);
    }
    return courier;
  }

  async updateCourier(id: string, data: UpdateCourierInput) {
    const courier = await this.getCourierOrFail(id);

    if (data.name || data.cpf) {
      await this.usersService.updateUser(courier.userId, {
        name: data.name,
        cpf: data.cpf,
      });
    }

    await this.couriersRepository.update(id, {
      phone: data.phone ?? courier.phone,
      vehicle: data.vehicle ?? courier.vehicle,
    });

    return this.getCourierOrFail(id);
  }

  async deleteCourier(id: string) {
    const courier = await this.getCourierOrFail(id);
    await this.couriersRepository.delete(id);
    await this.usersService.deleteUser(courier.userId);
  }

  async getCourierByUserId(userId: string) {
    const courier = await this.couriersRepository.findByUserId(userId);
    if (!courier) {
      throw new AppError("Courier profile not found", 404);
    }
    return courier;
  }
}
