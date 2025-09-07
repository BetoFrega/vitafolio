import { Account } from "./Account";
import { AccountId } from "../value-objects/AccountId";
import { Credential } from "./Credential";
import { Email } from "@lib/shared";

describe(Account, () => {
  const accountId = AccountId.generate();
  const email = Email.create("test@example.com");
  const passwordCred = Credential.createPassword("hashedPass");

  it("should create an account", () => {
    const account = Account.create(accountId, email, passwordCred);
    expect(account.accountId).toEqual(accountId);
    expect(account.primaryEmail).toEqual(email);
    expect(account.credentials).toHaveLength(1);
  });

  it("should throw error when creating without credential", () => {
    expect(() => Account.create(accountId, email, undefined)).toThrow(
      "Account must have at least one credential",
    );
  });
});
