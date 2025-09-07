import { Email } from "@lib/shared";
import { AccountId } from "../value-objects/AccountId";
import { Credential } from "./Credential";

export class Account {
  private constructor(
    public readonly accountId: AccountId,
    public readonly primaryEmail: Email,
    public readonly credentials: readonly Credential[],
  ) {}

  static create(
    accountId: AccountId,
    primaryEmail: Email,
    initialCredential: Credential,
  ): Account {
    if (!initialCredential) {
      throw new Error("Account must have at least one credential");
    }

    return new Account(accountId, primaryEmail, [initialCredential]);
  }

  equals(other: Account): boolean {
    return this.accountId.equals(other.accountId);
  }
}
