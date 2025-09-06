import { AccountId } from "../value-objects/AccountId";
import { Email } from "../value-objects/Email";
import { Credential } from "./Credential";
import { DomainEvent, AccountStatus } from "./DomainEvents";

export interface MFAConfig {
  enabled: boolean;
  methods: string[];
}

export class Account {
  private readonly domainEvents: DomainEvent[] = [];

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

    const account = new Account(
      accountId,
      primaryEmail,
      undefined,
      "pendingVerification",
      [initialCredential],
      mfa,
    );

    account.addDomainEvent({
      type: "AccountCreated",
      accountId: accountId.getValue(),
      primaryEmail: primaryEmail.getValue(),
    });

    return account;
  }

  verifyEmail(): Account {
    if (this.status === "locked") {
      throw new Error("Cannot verify email for locked account");
    }

    const verifiedAt = new Date();
    const account = new Account(
      this.accountId,
      this.primaryEmail,
      verifiedAt,
      "active",
      this.credentials,
      this.mfa,
    );

    account.addDomainEvent({
      type: "AccountEmailVerified",
      accountId: this.accountId.getValue(),
      verifiedAt,
    });

    return account;
  }

  lock(reason: string): Account {
    const account = new Account(
      this.accountId,
      this.primaryEmail,
      this.emailVerifiedAt,
      "locked",
      this.credentials,
      this.mfa,
    );

    account.addDomainEvent({
      type: "AccountLocked",
      accountId: this.accountId.getValue(),
      reason,
    });

    return account;
  }

  addCredential(credential: Credential): Account {
    const newCredentials = [...this.credentials, credential];
    const account = new Account(
      this.accountId,
      this.primaryEmail,
      this.emailVerifiedAt,
      this.status,
      newCredentials,
      this.mfa,
    );

    account.addDomainEvent({
      type: "CredentialLinked",
      accountId: this.accountId.getValue(),
      credentialKind: credential.kind,
    });

    return account;
  }

  // Invariants
  private enforceInvariants(): void {
    if (this.status === "active" && this.credentials.length === 0) {
      throw new Error("Active account must have at least one valid credential");
    }
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): readonly DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents.length = 0;
  }

  equals(other: Account): boolean {
    return this.accountId.equals(other.accountId);
  }
}
