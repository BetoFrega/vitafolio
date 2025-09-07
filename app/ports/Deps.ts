import type { RegisterAccount } from "@iam/app/RegisterAccount";
import type { Login } from "@iam/app/Login";

export type RegisterAccountDeps = {
  registerAccount: RegisterAccount["execute"];
};

export type LoginDeps = {
  login: Login["execute"];
};

// Aggregate application dependencies. Keep `Deps` as a composition so
// existing call sites that expect the full set still work.
export type Deps = RegisterAccountDeps & LoginDeps;
