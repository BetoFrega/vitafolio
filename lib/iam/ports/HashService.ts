import type { NewPassword } from "@iam/domain/value-objects/NewPassword";

export interface HashService {
  hash: (password: NewPassword) => Promise<string>;
  verify: (password: NewPassword, hashedPassword: string) => Promise<boolean>;
  randomUUID: () => Promise<string>;
}
