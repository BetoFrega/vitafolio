import type { CollectionRepository } from "@collections/ports/CollectionRepository";
import type { ItemRepository } from "@collections/ports/ItemRepository";
import type { NotificationRepository } from "@collections/ports/NotificationRepository";

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
