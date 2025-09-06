import { UserRepository } from "../ports/UserRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { Email } from "../value-objects/Email";

describe(CreateUserUseCase, () => {
  it("should create and save a user", async () => {
    const mockUserRepository: UserRepository = {
      save: vi.fn().mockResolvedValue(undefined),
    };

    const createUserUseCase = new CreateUserUseCase(mockUserRepository);

    const userData = { fullName: "Jane Doe", email: "jane.doe@example.com" };

    const user = await createUserUseCase.execute(userData);

    expect(user.data.fullName).toBe("Jane Doe");
    expect(user.data.email).toBeInstanceOf(Email);
    expect(user.data.email.getValue()).toBe("jane.doe@example.com");
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });
});
