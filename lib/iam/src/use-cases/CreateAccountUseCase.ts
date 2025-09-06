import { Account } from "../aggregates/Account";
import { AccountId } from "../value-objects/AccountId";
import { Credential } from "../aggregates/Credential";
import { AccountRepository } from "../ports/AccountRepository";
import { Email, EventBus } from "@lib/shared";

export class CreateAccountUseCase {
  constructor(
    private accountRepository: AccountRepository,
    private eventBus: EventBus,
  ) {}

  async execute(input: {
    accountId: AccountId;
    email: Email;
    credential: Credential;
  }): Promise<Account> {
    // Check if email already exists
    const emailExists = await this.accountRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new Error("Email already exists");
    }

    // Create the account
    const account = Account.create(
      input.accountId,
      input.email,
      input.credential,
    );

    // Save the account
    await this.accountRepository.save(account);

    // Publish domain event
    await this.eventBus.publish({
      type: "AccountCreated",
      accountId: input.accountId.getValue(),
      primaryEmail: input.email.getValue(),
    });

    return account;
  }
}
