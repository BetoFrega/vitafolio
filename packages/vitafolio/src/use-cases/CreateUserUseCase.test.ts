import { UserRepository } from "../adapters/UserRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";

describe(CreateUserUseCase, () => {
  it("should create and save a user", async () => {
    const mockUserRepository: UserRepository = {
      save: vi.fn().mockResolvedValue(undefined),
    };

    const createUserUseCase = new CreateUserUseCase(mockUserRepository);

    const userData = { fullName: "Jane Doe", email: "jane.doe@example.com" };

    const user = await createUserUseCase.execute(userData);

    expect(user.data.fullName).toBe("Jane Doe");
    expect(user.data.email).toBe("jane.doe@example.com");
    expect(mockUserRepository.save).toHaveBeenCalledWith(user);
  });
});
