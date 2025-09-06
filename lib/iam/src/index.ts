// IAM bounded context exports
export { Role } from "./value-objects/Role";
export { AccountId } from "./value-objects/AccountId";
export { Email } from "./value-objects/Email";
export { Account } from "./aggregates/Account";
export {
  Credential,
  type CredentialKind,
  type CredentialData,
} from "./aggregates/Credential";
export type { DomainEvent, AccountStatus } from "./aggregates/DomainEvents";
export type { MFAConfig } from "./aggregates/Account";
export type { AccountRepository } from "./ports/AccountRepository";
export type { EventBus } from "./ports/EventBus";
export { CreateAccountUseCase } from "./use-cases/CreateAccountUseCase";
export { VerifyEmailUseCase } from "./use-cases/VerifyEmailUseCase";
