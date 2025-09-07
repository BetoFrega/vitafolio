import { RegisterAccount } from "./RegisterAccount";

type Deps = ConstructorParameters<typeof RegisterAccount>[0];

describe("RegisterAccount", () => {
  let deps: {
    repository: { createUser: ReturnType<typeof vi.fn> };
    hashService: {
      hash: ReturnType<typeof vi.fn>;
      makeSalt: ReturnType<typeof vi.fn>;
    };
  } & Deps;

  beforeEach(() => {
    deps = {
      repository: { createUser: vi.fn().mockResolvedValue(undefined) },
      hashService: {
        makeSalt: vi.fn().mockResolvedValue("salt"),
        hash: vi.fn().mockResolvedValue("hashed"),
      },
    } as unknown as typeof deps;
  });

  it("should create a user with hashed password and salt", async () => {
    const uc = new RegisterAccount(deps);

    const result = await uc.execute({
      email: "test@example.com",
      password: "password",
    });

    expect(result.isSuccess()).toBe(true);
    expect(deps.hashService.makeSalt).toHaveBeenCalled();
    expect(deps.hashService.hash).toHaveBeenCalledWith("password" + "salt");
    expect(deps.repository.createUser).toHaveBeenCalledWith(
      "test@example.com",
      "hashed",
      "salt",
    );
  });

  it("should return failure when makeSalt fails and not call createUser", async () => {
    deps.hashService.makeSalt = vi
      .fn()
      .mockRejectedValue(new Error("salt fail"));
    const uc = new RegisterAccount(deps);

    const result = await uc.execute({ email: "a@b.com", password: "p" });

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe("salt fail");
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
