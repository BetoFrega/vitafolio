import type { UseCase } from "@shared/app/contracts/UseCase";
import { Result } from "@shared/app/contracts/Result";
import type { UserRepository } from "../ports/UserRepository";
import type { HashService } from "../ports/HashService";
import { User } from "../domain/aggregates/User";
import { NewPassword } from "@iam/domain/value-objects/NewPassword";

type Input = {
  email: string;
  password: string;
};

export class RegisterAccount implements UseCase<Input, { userId: string }> {
  constructor(
    private readonly deps: {
      repository: Pick<UserRepository, "createUser">;
      hashService: Pick<HashService, "hash" | "randomUUID">;
    },
  ) {}

  async execute(input: Input): Promise<Result<{ userId: string }>> {
    try {
      const passwordHash = await this.deps.hashService.hash(
        NewPassword.create(input.password),
      );
      const id = await this.deps.hashService.randomUUID();

      const user = User.create({
        id,
        email: input.email,
        hashedPassword: passwordHash,
      });

      await this.deps.repository.createUser(user);

      return Result.success({ userId: user.data.id });
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}
