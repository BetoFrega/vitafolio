// IAM bounded context exports
export { Role } from "./value-objects/Role";
export { AccountId } from "./value-objects/AccountId";
export { Account } from "./aggregates/Account";
export {
  Credential,
  type CredentialKind,
  type CredentialData,
} from "./aggregates/Credential";
export type { DomainEvent, AccountStatus } from "./aggregates/DomainEvents";
export type { AccountRepository } from "./ports/AccountRepository";
export { CreateAccountUseCase } from "./use-cases/CreateAccountUseCase";
