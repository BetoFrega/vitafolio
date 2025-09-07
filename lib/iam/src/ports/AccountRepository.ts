import { Account } from "../aggregates/Account";
import { AccountId } from "../value-objects/AccountId";
import { Email } from "@lib/shared";

export interface AccountRepository {
  save(account: Account): Promise<void>;
  findById(accountId: AccountId): Promise<Account | null>;
  findByEmail(email: Email): Promise<Account | null>;
  existsByEmail(email: Email): Promise<boolean>;
  delete(accountId: AccountId): Promise<void>;
}
