import { vi } from "vitest";
import type { Deps } from "../../ports/Deps";
import type { CollectionRepository } from "../../../lib/collections/ports/CollectionRepository";
import type { ItemRepository } from "../../../lib/collections/ports/ItemRepository";
import type { NotificationRepository } from "../../../lib/collections/ports/NotificationRepository";
import type { TokenService } from "../../../lib/iam/ports/TokenService";

// Import use case classes
import { CreateCollection } from "../../../lib/collections/app/CreateCollection";
import { ListCollections } from "../../../lib/collections/app/ListCollections";
import { GetCollection } from "../../../lib/collections/app/GetCollection";
import { UpdateCollection } from "../../../lib/collections/app/UpdateCollection";
import { DeleteCollection } from "../../../lib/collections/app/DeleteCollection";
import { AddItemToCollection } from "../../../lib/collections/app/AddItemToCollection";
import { ListItems } from "../../../lib/collections/app/ListItems";
import { GetItem } from "../../../lib/collections/app/GetItem";
import { UpdateItem } from "../../../lib/collections/app/UpdateItem";
import { DeleteItem } from "../../../lib/collections/app/DeleteItem";
import { SearchItems } from "../../../lib/collections/app/SearchItems";
import { ListNotifications } from "../../../lib/collections/app/ListNotifications";

// Mock repositories with all required methods
export const createMockCollectionRepository = (): CollectionRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  findByOwnerId: vi.fn(),
  findByNameAndOwnerId: vi.fn(),
  exists: vi.fn(),
  delete: vi.fn(),
  getItemCount: vi.fn(),
});

export const createMockItemRepository = (): ItemRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  findByCollectionId: vi.fn(),
  findByOwnerId: vi.fn(),
  search: vi.fn(),
  exists: vi.fn(),
  delete: vi.fn(),
  countByCollectionId: vi.fn(),
  findByMetadataField: vi.fn(),
});

export const createMockNotificationRepository = (): NotificationRepository => ({
  save: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  search: vi.fn(),
  findDueNotifications: vi.fn(),
  findByItemId: vi.fn(),
  exists: vi.fn(),
  delete: vi.fn(),
  deleteByItemId: vi.fn(),
  findPendingBefore: vi.fn(),
});

export const createMockTokenService = (): TokenService => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verify: vi.fn().mockImplementation(() => ({ success: true,data: { userId: "user-1" } })),
});

// Create complete mock deps for testing
export const createMockDeps = (): Deps => {
  const collectionRepository = createMockCollectionRepository();
  const itemRepository = createMockItemRepository();
  const notificationRepository = createMockNotificationRepository();

  return {
    // IAM
    registerAccount: vi.fn(),
    login: vi.fn(),
    tokenService: createMockTokenService(),

    // Repositories
    collectionRepository,
    itemRepository,
    notificationRepository,

    // Collection use cases - create real instances with mocked repos
    createCollection: new CreateCollection({ collectionRepository }),
    listCollections: new ListCollections({ collectionRepository }),
    getCollection: new GetCollection({ collectionRepository }),
    updateCollection: new UpdateCollection({
      collectionRepository,
      itemRepository,
    }),
    deleteCollection: new DeleteCollection({
      collectionRepository,
      itemRepository,
      notificationRepository,
    }),

    // Item use cases - create real instances with mocked repos
    addItemToCollection: new AddItemToCollection({
      collectionRepository,
      itemRepository,
    }),
    listItems: new ListItems({ itemRepository }),
    getItem: new GetItem({ itemRepository }),
    updateItem: new UpdateItem({ itemRepository, collectionRepository }),
    deleteItem: new DeleteItem({ itemRepository, notificationRepository }),
    searchItems: new SearchItems({ itemRepository }),

    // Notification use cases
    listNotifications: new ListNotifications({ notificationRepository }),
  };
};
