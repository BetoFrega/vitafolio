import type { RegisterAccount } from "@iam/app/RegisterAccount";
import type { Login } from "@iam/app/Login";

export type RegisterAccountDeps = {
  registerAccount: RegisterAccount["execute"];
};

export type LoginDeps = {
  login: Login["execute"];
};

// Placeholder types for collections repositories (will be replaced in T030-T032)
export type CollectionsDeps = {
  collectionRepository: Record<string, unknown>; // TODO: Replace with CollectionRepository in T030
  itemRepository: Record<string, unknown>; // TODO: Replace with ItemRepository in T031
  notificationRepository: Record<string, unknown>; // TODO: Replace with NotificationRepository in T032
};

// Aggregate application dependencies. Keep `Deps` as a composition so
// existing call sites that expect the full set still work.
export type Deps = RegisterAccountDeps & LoginDeps & CollectionsDeps;
