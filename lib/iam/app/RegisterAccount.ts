import type { UseCase } from "@shared/app/contracts/UseCase";

type Input = {
  email: string;
  password: string;
};

export class RegisterAccount implements UseCase<Input> {
  async execute(input: Input) {
    console.log(`Registrando conta para o email: ${input.email}`);
  }
}
