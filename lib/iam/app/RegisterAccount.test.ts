import { RegisterAccount } from "@iam/app/RegisterAccount";

type Deps = {
  repository: {
    createUser: (
      email: string,
      passwordHash: string,
      salt: string,
    ) => Promise<void>;
  };
  hashService: {
    hash: (password: string) => Promise<string>;
    makeSalt: () => Promise<string>;
  };
};

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
    const uc = new RegisterAccount(deps as Deps);

    await uc.execute({ email: "test@example.com", password: "password" });

    expect(deps.hashService.makeSalt).toHaveBeenCalled();
    expect(deps.hashService.hash).toHaveBeenCalledWith("password" + "salt");
    expect(deps.repository.createUser).toHaveBeenCalledWith(
      "test@example.com",
      "hashed",
      "salt",
    );
  });

  it("should propagate errors from makeSalt and not call createUser", async () => {
    deps.hashService.makeSalt = vi
      .fn()
      .mockRejectedValue(new Error("salt fail"));
    const uc = new RegisterAccount(deps as Deps);

    await expect(
      uc.execute({ email: "a@b.com", password: "p" }),
    ).rejects.toThrow("salt fail");
    expect(deps.repository.createUser).not.toHaveBeenCalled();
  });

  it("should propagate errors from repository.createUser", async () => {
    deps.repository.createUser = vi
      .fn()
      .mockRejectedValue(new Error("db fail"));
    const uc = new RegisterAccount(deps as Deps);

    await expect(
      uc.execute({ email: "a@b.com", password: "p" }),
    ).rejects.toThrow("db fail");
  });
});
