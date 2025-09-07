import type { RegisterAccount } from "lib/iam/app/RegisterAccount";

export type Deps = {
  registerAccount: RegisterAccount["execute"];
};
