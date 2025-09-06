export type AccountStatus = "pendingVerification" | "active" | "locked";

export interface AccountCreatedEvent {
  type: "AccountCreated";
  accountId: string;
  primaryEmail: string;
}

export interface AccountEmailVerifiedEvent {
  type: "AccountEmailVerified";
  accountId: string;
  verifiedAt: Date;
}

export interface AccountLockedEvent {
  type: "AccountLocked";
  accountId: string;
  reason: string;
}

export interface CredentialLinkedEvent {
  type: "CredentialLinked";
  accountId: string;
  credentialKind: string;
}

export type DomainEvent =
  | AccountCreatedEvent
  | AccountEmailVerifiedEvent
  | AccountLockedEvent
  | CredentialLinkedEvent;
