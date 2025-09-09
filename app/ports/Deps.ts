import type { RegisterAccount } from "@iam/app/RegisterAccount";
import type { Login } from "@iam/app/Login";
import type { CollectionRepository } from "@collections/ports/CollectionRepository";
import type { ItemRepository } from "@collections/ports/ItemRepository";
import type { NotificationRepository } from "@collections/ports/NotificationRepository";

export type RegisterAccountDeps = {
  registerAccount: RegisterAccount["execute"];
};

export type LoginDeps = {
  login: Login["execute"];
};

export type CollectionsDeps = {
  collectionRepository: CollectionRepository;
  itemRepository: ItemRepository;
  notificationRepository: NotificationRepository;
};

// Aggregate application dependencies. Keep `Deps` as a composition so
// existing call sites that expect the full set still work.
export type Deps = RegisterAccountDeps & LoginDeps & CollectionsDeps;
