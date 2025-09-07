import { User } from "@iam/domain/aggregates/User";
import { Login } from "./Login";

describe("Login", () => {
  let deps: ConstructorParameters<typeof Login>[0];
  let login: Login;
  beforeEach(() => {
    deps = makeDeps();
    login = new Login(deps);
  });
  it("should fail if user is not found", async () => {
    const result = await login.execute({
      email: "unknown@example.com",
      password: "password",
    });
    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toEqual("Authentication failed");
  });
  it("should call verify even if user is not found", async () => {
    await login.execute({
      email: "unknown@example.com",
      password: "password",
    });
    expect(deps.hashService.verify).toHaveBeenCalled();
  });
  it("should fail if password is incorrect", async () => {
    const result = await login.execute({
      email: "test@example.com",
      password: "wrong-password",
    });
    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toEqual("Authentication failed");
  });
  it("should return a valid access token and refresh token", async () => {
    const result = await login.execute({
      email: "test@example.com",
      password: "password",
    });

    expect(result.getValue()).toEqual({
      accessToken: "validAccessToken",
      refreshToken: "validRefreshToken",
    });
  });
});

function makeDeps(): ConstructorParameters<typeof Login>[0] {
  return {
    tokenService: {
      generateAccessToken: vi.fn().mockResolvedValue("validAccessToken"),
      generateRefreshToken: vi.fn().mockResolvedValue("validRefreshToken"),
    },
    hashService: {
      verify: vi.fn().mockImplementation((password, hashedPassword) => {
        return password === "password" && hashedPassword === "hashed-password";
      }),
    },
    userRepository: {
      findByEmail: vi.fn().mockImplementation((email) => {
        if (email === "test@example.com") {
          return User.fromData({
            id: "userId",
            email: "test@example.com",
            hashedPassword: "hashed-password",
            createdAt: new Date(),
          });
        }
        return null;
      }),
    },
  };
}
