import type { HashService } from "@iam/ports/HashService";
import type { TokenService } from "@iam/ports/TokenService";
import type { UserRepository } from "@iam/ports/UserRepository";
import { Result } from "@shared/app/contracts/Result";
import type { UseCase } from "@shared/app/contracts/UseCase";

export type Input = {
  email: string;
  password: string;
};

export type Output = {
  refreshToken: string;
  accessToken: string;
};

export class Login implements UseCase<Input, Output> {
  constructor(private deps: {
    tokenService: TokenService;
    hashService: Pick<HashService, "verify">;
    userRepository: Pick<UserRepository, "findByEmail">;
  }) {
  }

  async execute(input: Input): Promise<Result<Output>> {
    const { email, password } = input;
    const user = await this.deps.userRepository.findByEmail(email);
    const passwordHash = user?.data.hashedPassword ?? "$2b$10$invalidsaltstring22charsmin";
    const isPasswordValid = await this.deps.hashService.verify(password, passwordHash);
    if (!user || !isPasswordValid) {
        return Result.failure(
            new Error("Authentication failed"),
        );
    }
    const accessToken = await this.deps.tokenService.generateAccessToken({
      userId: user.data.id,
    });
    const refreshToken = await this.deps.tokenService.generateRefreshToken({
      userId: user.data.id,
    });
    return Result.success({
        accessToken,
        refreshToken,
    });
  }
}
