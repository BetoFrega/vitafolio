import { CreateAccountUseCase } from "./CreateAccountUseCase";
import { Account } from "../aggregates/Account";
import { AccountId } from "../value-objects/AccountId";
import { Credential } from "../aggregates/Credential";
import { AccountRepository } from "../ports/AccountRepository";
import { Email } from "@lib/shared";

describe(CreateAccountUseCase, () => {
  it("should create and save an account", async () => {
    const accountId = AccountId.generate();
    const email = Email.create("test@example.com");
    const credential = Credential.createPassword("hashedPass");

    const mockRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn().mockResolvedValue(false),
      delete: vi.fn(),
    } as AccountRepository;

    const mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      publishAll: vi.fn(),
    };

    const useCase = new CreateAccountUseCase(mockRepo, mockEventBus);
    const account = await useCase.execute({ accountId, email, credential });

    expect(account).toBeInstanceOf(Account);
    expect(account.accountId).toEqual(accountId);
    expect(mockRepo.save).toHaveBeenCalledWith(account);
    expect(mockEventBus.publish).toHaveBeenCalled(); // Updated to publish
  });

  it("should throw error if email already exists", async () => {
    const accountId = AccountId.generate();
    const email = Email.create("test@example.com");
    const credential = Credential.createPassword("hashedPass");

    const mockRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn().mockResolvedValue(true),
      delete: vi.fn(),
    };

    const mockEventBus = {
      publish: vi.fn(),
      publishAll: vi.fn(),
    };

    const useCase = new CreateAccountUseCase(mockRepo, mockEventBus);

    await expect(
      useCase.execute({ accountId, email, credential }),
    ).rejects.toThrow("Email already exists");
  });
});
