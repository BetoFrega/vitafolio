import type { RegisterAccount } from "@iam/app/RegisterAccount";

export type Deps = {
  registerAccount: RegisterAccount["execute"];
};
