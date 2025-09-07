import type { RegisterAccount } from "@iam/app/RegisterAccount";

export type RegisterAccountDeps = {
  registerAccount: RegisterAccount["execute"];
};

// Aggregate application dependencies. Keep `Deps` as a composition so
// existing call sites that expect the full set still work.
export type Deps = RegisterAccountDeps;
