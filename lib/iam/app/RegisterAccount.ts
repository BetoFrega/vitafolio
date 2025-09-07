import type { UseCase } from "@shared/app/contracts/UseCase";

type Input = {
  email: string;
  password: string;
};

export class RegisterAccount implements UseCase<Input> {
  constructor(
    private readonly deps: {
      repository: {
        createUser: (email: string, passwordHash: string, salt: string) => Promise<void>;
      };
      hashService: {
        hash: (password: string) => Promise<string>;
        makeSalt: () => Promise<string>;
      };
    },
  ) {}
  async execute(input: Input) {
    const { email, password } = input;
    const salt = await this.deps.hashService.makeSalt();
    const passwordHash = await this.deps.hashService.hash(password + salt);
    await this.deps.repository.createUser(email, passwordHash, salt);
  }
}
