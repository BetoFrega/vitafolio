import { describe, it, expect, beforeEach } from "vitest";
import { RegisterAccount } from "./RegisterAccount";
import { NodeHashService } from "../adapters/NodeHashService";
import { InMemoryUserRepository } from "../adapters/InMemoryUserRepository";

describe("RegisterAccount Integration", () => {
  let registerAccount: RegisterAccount;
  let hashService: NodeHashService;
  let userRepository: InMemoryUserRepository;

  beforeEach(() => {
    hashService = new NodeHashService();
    userRepository = new InMemoryUserRepository();

    registerAccount = new RegisterAccount({
      repository: userRepository,
      hashService,
    });
  });

  it("should successfully register a new account", async () => {
    const result = await registerAccount.execute({
      email: "newuser@example.com",
      password: "validPassword123",
    });

    expect(result.isSuccess()).toBe(true);

    const { userId } = result.getValue();
    expect(userId).toBeDefined();

    // Verify user was created
    const user = await userRepository.findById(userId);
    expect(user).toBeDefined();
    expect(user!.data.email).toBe("newuser@example.com");
  });

  it("should fail with invalid password", async () => {
    const result = await registerAccount.execute({
      email: "test@example.com",
      password: "", // invalid password
    });

    expect(result.isSuccess()).toBe(false);
  });

  it("should fail when registering with existing email", async () => {
    // First registration
    await registerAccount.execute({
      email: "duplicate@example.com",
      password: "validPassword123",
    });

    // Second registration with same email
    const result = await registerAccount.execute({
      email: "duplicate@example.com",
      password: "anotherPassword123",
    });

    expect(result.isSuccess()).toBe(false);
    expect(result.getError().message).toBe(
      "User with email duplicate@example.com already exists",
    );
  });
});
