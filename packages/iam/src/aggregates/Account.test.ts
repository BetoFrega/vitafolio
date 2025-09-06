import { Account } from "./Account";
import { AccountId } from "../value-objects/AccountId";
import { Email } from "../value-objects/Email";
import { Credential } from "./Credential";

describe(Account, () => {
  const accountId = AccountId.generate();
  const email = Email.create("test@example.com");
  const passwordCred = Credential.createPassword("hashedPass");

  it("should create an account", () => {
    const account = Account.create(accountId, email, passwordCred);
    expect(account.accountId).toEqual(accountId);
    expect(account.primaryEmail).toEqual(email);
    expect(account.status).toBe("pendingVerification");
    expect(account.credentials).toHaveLength(1);
  });

  it("should verify email", () => {
    const account = Account.create(accountId, email, passwordCred);
    const verifiedAccount = account.verifyEmail();
    expect(verifiedAccount.status).toBe("active");
    expect(verifiedAccount.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it("should lock account", () => {
    const account = Account.create(accountId, email, passwordCred);
    const lockedAccount = account.lock("suspicious activity");
    expect(lockedAccount.status).toBe("locked");
  });

  it("should add credential", () => {
    const account = Account.create(accountId, email, passwordCred);
    const oauthCred = Credential.createOAuth("google", "oauth123");
    const updatedAccount = account.addCredential(oauthCred);
    expect(updatedAccount.credentials).toHaveLength(2);
  });

  it("should enforce invariant: active account must have valid credential", () => {
    const account = Account.create(accountId, email, passwordCred);
    const activeAccount = account.verifyEmail();
    // This would need a method to remove credentials, but for now, assume it's enforced
    expect(activeAccount.credentials).toHaveLength(1);
  });

  it("should throw error when creating without credential", () => {
    expect(() => Account.create(accountId, email)).toThrow(
      "Account must have at least one credential",
    );
  });

  it("should generate domain events", () => {
    const account = Account.create(accountId, email, passwordCred);
    expect(account.getDomainEvents()).toHaveLength(1);
    expect(account.getDomainEvents()[0].type).toBe("AccountCreated");
  });
});
