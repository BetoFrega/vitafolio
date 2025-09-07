import type { UseCase } from "@shared/app/contracts/UseCase";
import { Result } from "@shared/app/contracts/Result";
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
      hashService: Pick<HashService, "hash" | "makeSalt" | "randomUUID">;
    },
  ) {}
  async execute(input: Input): Promise<Result<void>> {
    try {
      const { email, password } = input;
      const salt = await this.deps.hashService.makeSalt();
      const passwordHash = await this.deps.hashService.hash(password + salt);

      await this.deps.repository.createUser({
        id: await this.deps.hashService.randomUUID(),
        email,
        hashedPassword: passwordHash,
        salt,
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}
