import { RegisterAccount } from "./RegisterAccount";

type Deps = ConstructorParameters<typeof RegisterAccount>[0];

describe("RegisterAccount", () => {
  let deps: {
    repository: { createUser: ReturnType<typeof vi.fn> };
    hashService: {
      hash: ReturnType<typeof vi.fn>;
      randomUUID: ReturnType<typeof vi.fn>;
    };
  } & Deps;

  beforeEach(() => {
    deps = {
      repository: { createUser: vi.fn().mockResolvedValue(undefined) },
      hashService: {
        hash: vi.fn().mockResolvedValue("hashed"),
        randomUUID: vi.fn().mockResolvedValue("unique-id"),
      },
    } as unknown as typeof deps;
  });

  it("should create a user with hashed password", async () => {
    const uc = new RegisterAccount(deps);

    const result = await uc.execute({
      email: "test@example.com",
      password: "password",
    });

    expect(result.isSuccess()).toBe(true);
    expect(deps.hashService.hash).toHaveBeenCalledWith("password");
    expect(deps.repository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        hashedPassword: "hashed",
        id: expect.any(String),
      }),
    );
  });

  it("should return failure when hash fails and not call createUser", async () => {
    deps.hashService.hash = vi.fn().mockRejectedValue(new Error("hash fail"));
    const uc = new RegisterAccount(deps);

    const result = await uc.execute({ email: "a@b.com", password: "p" });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe("hash fail");
    expect(deps.repository.createUser).not.toHaveBeenCalled();
  });

  it("should return failure when repository.createUser fails", async () => {
    deps.repository.createUser = vi
      .fn()
      .mockRejectedValue(new Error("db fail"));
    const uc = new RegisterAccount(deps);

    const result = await uc.execute({ email: "a@b.com", password: "p" });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe("db fail");
  });
});
