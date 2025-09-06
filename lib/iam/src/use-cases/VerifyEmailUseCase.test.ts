import { VerifyEmailUseCase } from "./VerifyEmailUseCase";
import { Account } from "../aggregates/Account";
import { AccountId } from "../value-objects/AccountId";
import { Email } from "../value-objects/Email";
import { Credential } from "../aggregates/Credential";
import { AccountRepository } from "../ports/AccountRepository";
import { EventBus } from "../ports/EventBus";

describe(VerifyEmailUseCase, () => {
  it("should verify email and publish events", async () => {
    const accountId = AccountId.generate();
    const email = Email.create("test@example.com");
    const credential = Credential.createPassword("hashedPass");
    const account = Account.create(accountId, email, credential);

    const mockRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(account),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
    };

    const mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      publishAll: vi.fn(),
    };

    const useCase = new VerifyEmailUseCase(mockRepo, mockEventBus);
    const verifiedAccount = await useCase.execute(accountId);

    expect(verifiedAccount.status).toBe("active");
    expect(verifiedAccount.emailVerifiedAt).toBeInstanceOf(Date);
    expect(mockRepo.save).toHaveBeenCalledWith(verifiedAccount);
    expect(mockEventBus.publish).toHaveBeenCalled(); // Updated to publish
  });

  it("should throw error if account not found", async () => {
    const accountId = AccountId.generate();

    const mockRepo = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn(),
      existsByEmail: vi.fn(),
      delete: vi.fn(),
    };

    const mockEventBus = {
      publish: vi.fn(),
      publishAll: vi.fn(),
    };

    const useCase = new VerifyEmailUseCase(mockRepo, mockEventBus);

    await expect(useCase.execute(accountId)).rejects.toThrow(
      "Account not found",
    );
  });
});
