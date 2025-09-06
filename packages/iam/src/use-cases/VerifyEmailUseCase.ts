import { Account } from "../aggregates/Account";
import { AccountId } from "../value-objects/AccountId";
import { AccountRepository } from "../ports/AccountRepository";
import { EventBus } from "../ports/EventBus";

export class VerifyEmailUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private eventBus: EventBus,
  ) {}

  async execute(accountId: AccountId): Promise<Account> {
    // Find the account
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify the email
    const verifiedAccount = account.verifyEmail();

    // Save the updated account
    await this.accountRepository.save(verifiedAccount);

    // Publish domain events
    const events = verifiedAccount.getDomainEvents();
    if (events.length > 0) {
      await this.eventBus.publishAll([...events]);
      verifiedAccount.clearDomainEvents();
    }

    return verifiedAccount;
  }
}
