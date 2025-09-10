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
  verify: vi.fn(),
});

// Create properly typed mock use cases for contract testing
const createMockCreateCollection = (): CreateCollection =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as CreateCollection;

const createMockListCollections = (): ListCollections =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as ListCollections;

const createMockGetCollection = (): GetCollection =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as GetCollection;

const createMockUpdateCollection = (): UpdateCollection =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as UpdateCollection;

const createMockDeleteCollection = (): DeleteCollection =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as DeleteCollection;

const createMockAddItemToCollection = (): AddItemToCollection =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as AddItemToCollection;

const createMockListItems = (): ListItems =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as ListItems;

const createMockGetItem = (): GetItem =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as GetItem;

const createMockUpdateItem = (): UpdateItem =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as UpdateItem;

const createMockDeleteItem = (): DeleteItem =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as DeleteItem;

const createMockSearchItems = (): SearchItems =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as SearchItems;

const createMockListNotifications = (): ListNotifications =>
  ({
    deps: {},
    execute: vi.fn(),
  }) as unknown as ListNotifications;

// Create complete mock deps for contract testing (all use cases mocked)
export const createMockDepsForContract = (): Deps => {
  const mockTokenService = createMockTokenService();

  // Mock successful token verification for contract tests
  mockTokenService.verify = vi.fn().mockResolvedValue({
    success: true,
    data: { userId: "test-user-123" },
  });

  return {
    // IAM - all mocked
    registerAccount: vi.fn(),
    login: vi.fn(),
    tokenService: mockTokenService,

    // Repositories - all mocked
    collectionRepository: createMockCollectionRepository(),
    itemRepository: createMockItemRepository(),
    notificationRepository: createMockNotificationRepository(),

    // Collection use cases - all mocked for contract tests
    createCollection: createMockCreateCollection(),
    listCollections: createMockListCollections(),
    getCollection: createMockGetCollection(),
    updateCollection: createMockUpdateCollection(),
    deleteCollection: createMockDeleteCollection(),

    // Item use cases - all mocked for contract tests
    addItemToCollection: createMockAddItemToCollection(),
    listItems: createMockListItems(),
    getItem: createMockGetItem(),
    updateItem: createMockUpdateItem(),
    deleteItem: createMockDeleteItem(),
    searchItems: createMockSearchItems(),

    // Notification use cases - all mocked for contract tests
    listNotifications: createMockListNotifications(),
  };
};

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
