import type { UseCase } from "@shared/app/contracts/UseCase";
import type { UserRepository } from "../ports/UserRepository";
import type { HashService } from "../ports/HashService";

type Input = {
  email: string;
  password: string;
};

export class RegisterAccount implements UseCase<Input> {
  constructor(
    private readonly deps: {
      repository: Pick<UserRepository, "createUser">;
      hashService: Pick<HashService, "hash" | "makeSalt">;
    },
  ) {}
  async execute(input: Input) {
    const { email, password } = input;
    const salt = await this.deps.hashService.makeSalt();
    const passwordHash = await this.deps.hashService.hash(password + salt);
    await this.deps.repository.createUser(email, passwordHash, salt);
  }
}
