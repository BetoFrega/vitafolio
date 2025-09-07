import { describe, it, expect, beforeEach } from "vitest";
import { Login } from "./Login";
import { NodeTokenService } from "../adapters/NodeTokenService";
import { NodeHashService } from "../adapters/NodeHashService";
import { InMemoryUserRepository } from "../adapters/InMemoryUserRepository";
import { User } from "../domain/aggregates/User";
import { NewPassword } from "../domain/value-objects/NewPassword";

describe("Login Integration", () => {
  let login: Login;
  let tokenService: NodeTokenService;
  let hashService: NodeHashService;
  let userRepository: InMemoryUserRepository;

  beforeEach(async () => {
    tokenService = new NodeTokenService();
    hashService = new NodeHashService();
    userRepository = new InMemoryUserRepository();

    login = new Login({
      tokenService,
      hashService,
      userRepository,
    });

    // Create a test user
    const password = NewPassword.create("testPassword123");
    const hashedPassword = await hashService.hash(password);
    const user = User.create({
      id: "test-user-id",
      email: "test@example.com",
      hashedPassword,
    });

    await userRepository.createUser(user);
  });

  it("should successfully login and return real JWT tokens", async () => {
    const result = await login.execute({
      email: "test@example.com",
      password: "testPassword123",
    });

    expect(result.isSuccess()).toBe(true);

    const tokens = result.getValue();
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    // Verify the tokens are valid JWTs
    expect(tokens.accessToken.split(".")).toHaveLength(3);
    expect(tokens.refreshToken.split(".")).toHaveLength(3);

    // Verify the tokens contain the expected userId
    const accessPayload = JSON.parse(
      Buffer.from(tokens.accessToken.split(".")[1]!, "base64").toString(),
    );
    const refreshPayload = JSON.parse(
      Buffer.from(tokens.refreshToken.split(".")[1]!, "base64").toString(),
    );

    expect(accessPayload.userId).toBe("test-user-id");
    expect(refreshPayload.userId).toBe("test-user-id");

    // Verify tokens have different expiration times
    expect(refreshPayload.exp).toBeGreaterThan(accessPayload.exp);
  });

  it("should fail login with invalid credentials", async () => {
    const result = await login.execute({
      email: "test@example.com",
      password: "wrongPassword",
    });

    expect(result.isSuccess()).toBe(false);
    expect(result.getError().message).toBe("Authentication failed");
  });
});
