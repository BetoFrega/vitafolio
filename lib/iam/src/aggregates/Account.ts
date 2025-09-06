import { AccountId } from "../value-objects/AccountId";
import { Email } from "../value-objects/Email";
import { Credential } from "./Credential";

export interface MFAConfig {
  enabled: boolean;
  methods: string[];
}

export enum AccountStatus {
  PendingVerification = "pendingVerification",
  Active = "active",
  Locked = "locked",
}

export class Account {
  private constructor(
    public readonly accountId: AccountId,
    public readonly primaryEmail: Email,
    public readonly emailVerifiedAt: Date | undefined,
    public readonly status: AccountStatus,
    public readonly credentials: readonly Credential[],
    public readonly mfa?: MFAConfig,
  ) {}

  static create(
    accountId: AccountId,
    primaryEmail: Email,
    initialCredential: Credential,
    mfa?: MFAConfig,
  ): Account {
    if (!initialCredential) {
      throw new Error("Account must have at least one credential");
    }

    return new Account(
      accountId,
      primaryEmail,
      undefined,
      AccountStatus.PendingVerification,
      [initialCredential],
      mfa,
    );
  }

  verifyEmail(): Account {
    if (this.status === AccountStatus.Locked) {
      throw new Error("Cannot verify email for locked account");
    }

    const verifiedAt = new Date();
    return new Account(
      this.accountId,
      this.primaryEmail,
      verifiedAt,
      AccountStatus.Active,
      this.credentials,
      this.mfa,
    );
  }

  lock(reason: string): Account {
    return new Account(
      this.accountId,
      this.primaryEmail,
      this.emailVerifiedAt,
      AccountStatus.Locked,
      this.credentials,
      this.mfa,
    );
  }

  addCredential(credential: Credential): Account {
    const newCredentials = [...this.credentials, credential];
    return new Account(
      this.accountId,
      this.primaryEmail,
      this.emailVerifiedAt,
      this.status,
      newCredentials,
      this.mfa,
    );
  }

  // Invariants
  private enforceInvariants(): void {
    if (this.status === AccountStatus.Active && this.credentials.length === 0) {
      throw new Error("Active account must have at least one valid credential");
    }
  }

  equals(other: Account): boolean {
    return this.accountId.equals(other.accountId);
  }
}
