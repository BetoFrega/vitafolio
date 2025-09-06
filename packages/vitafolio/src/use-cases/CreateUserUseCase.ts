import { User } from "../aggregates/User";
import { UserRepository } from "../ports/UserRepository";

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(data: { fullName: string; email: string }): Promise<User> {
    const user = new User(data);
    await this.userRepository.save(user);
    return user;
  }
}
