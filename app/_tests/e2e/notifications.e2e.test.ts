import supertest from "supertest";
import {
  setupE2ETest,
  createTestCollection,
  createTestItem,
  type E2ETestContext,
} from "../helpers/e2e-setup";
import { TestDataBuilder } from "../helpers/test-data-builders";

describe.skip("Notifications E2E Tests", () => {
  let context: E2ETestContext;

  beforeEach(async () => {
    context = await setupE2ETest();
  });

  describe("Notification Generation", () => {
    let collectionId: string;

    beforeEach(async () => {
      const result = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection(),
      );
      collectionId = result.collectionId;
    });

    it("should generate notifications for individual item deletions", async () => {
      // Create multiple items
      const items = await Promise.all([
        createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.book({ name: "Book 1" }),
        ),
        createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.book({ name: "Book 2" }),
        ),
        createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.book({ name: "Book 3" }),
        ),
      ]);

      // Delete items one by one
      for (let i = 0; i < items.length; i++) {
        await supertest(context.app)
          .delete(`/api/v1/items/${items[i].itemId}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);

        // Check notifications after each deletion
        const notificationsResponse = await supertest(context.app)
          .get("/api/v1/notifications")
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);

        expect(notificationsResponse.body.success).toBe(true);
        expect(notificationsResponse.body.data.notifications).toHaveLength(
          i + 1,
        );

        // Check the latest notification
        const latestNotification =
          notificationsResponse.body.data.notifications[0];
        expect(latestNotification).toMatchObject({
          type: "item_deleted",
          message: expect.stringContaining(`Book ${i + 1}`),
          createdAt: expect.any(String),
        });
      }
    });

    it("should generate notifications for collection deletions", async () => {
      // Create items in the collection
      const itemData = [
        TestDataBuilder.book({ name: "Book A" }),
        TestDataBuilder.book({ name: "Book B" }),
        TestDataBuilder.book({ name: "Book C" }),
      ];

      for (const item of itemData) {
        await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          item,
        );
      }

      // Delete entire collection
      await supertest(context.app)
        .delete(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      // Check notifications for all deleted items
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(3);

      // Verify all items have deletion notifications
      const messages = notificationsResponse.body.data.notifications.map(
        (n: { message: string }) => n.message,
      );

      expect(messages.some((msg: string) => msg.includes("Book A"))).toBe(true);
      expect(messages.some((msg: string) => msg.includes("Book B"))).toBe(true);
      expect(messages.some((msg: string) => msg.includes("Book C"))).toBe(true);
    });

    it("should include proper notification content and timestamps", async () => {
      // Create and delete an item
      const itemData = TestDataBuilder.book({
        name: "Detailed Book Title",
        metadata: {
          title: "Detailed Book Title",
          author: "Test Author",
          genre: "Test Genre",
        },
      });

      const { itemId } = await createTestItem(
        context.app,
        context.accessToken,
        collectionId,
        itemData,
      );

      const beforeDeletion = new Date();

      await supertest(context.app)
        .delete(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      const afterDeletion = new Date();

      // Check notification details
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(1);

      const notification = notificationsResponse.body.data.notifications[0];

      expect(notification).toMatchObject({
        id: expect.any(String),
        type: "item_deleted",
        message: expect.stringContaining("Detailed Book Title"),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify timestamp is within expected range
      const notificationTime = new Date(notification.createdAt);
      expect(notificationTime.getTime()).toBeGreaterThanOrEqual(
        beforeDeletion.getTime(),
      );
      expect(notificationTime.getTime()).toBeLessThanOrEqual(
        afterDeletion.getTime(),
      );
    });
  });

  describe("Notification Listing", () => {
    let collectionId: string;

    beforeEach(async () => {
      const result = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection(),
      );
      collectionId = result.collectionId;
    });

    it("should list notifications in correct chronological order", async () => {
      // Create and delete items with small delays to ensure different timestamps
      const itemNames = ["First Book", "Second Book", "Third Book"];
      const itemIds = [];

      for (const name of itemNames) {
        const { itemId } = await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.book({ name }),
        );
        itemIds.push(itemId);

        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Delete items in order
      for (const itemId of itemIds) {
        await supertest(context.app)
          .delete(`/api/v1/items/${itemId}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);

        // Small delay between deletions
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // List notifications
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(3);

      const notifications = notificationsResponse.body.data.notifications;

      // Notifications should be in reverse chronological order (most recent first)
      const timestamps = notifications.map((n: { createdAt: string }) =>
        new Date(n.createdAt).getTime(),
      );

      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
      }

      // Verify the correct order of notifications (most recent first)
      expect(notifications[0].message).toContain("Third Book");
      expect(notifications[1].message).toContain("Second Book");
      expect(notifications[2].message).toContain("First Book");
    });

    it("should handle empty notifications list", async () => {
      // List notifications when there are none
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(0);
    });

    it("should handle large number of notifications", async () => {
      // Create many items and delete them to generate many notifications
      const numberOfItems = 10;
      const itemIds = [];

      // Create items
      for (let i = 0; i < numberOfItems; i++) {
        const { itemId } = await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.book({ name: `Book ${i + 1}` }),
        );
        itemIds.push(itemId);
      }

      // Delete all items
      for (const itemId of itemIds) {
        await supertest(context.app)
          .delete(`/api/v1/items/${itemId}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);
      }

      // List notifications
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(
        numberOfItems,
      );

      // Verify all notifications are present
      const messages = notificationsResponse.body.data.notifications.map(
        (n: { message: string }) => n.message,
      );

      for (let i = 1; i <= numberOfItems; i++) {
        expect(messages.some((msg: string) => msg.includes(`Book ${i}`))).toBe(
          true,
        );
      }
    });
  });

  describe("Notification Data Integrity", () => {
    let collectionId: string;

    beforeEach(async () => {
      const result = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection(),
      );
      collectionId = result.collectionId;
    });

    it("should maintain notification data consistency", async () => {
      // Create item with specific metadata
      const itemData = TestDataBuilder.book({
        name: "Consistency Test Book",
        metadata: {
          title: "Consistency Test Book",
          author: "Test Author",
          isbn: "978-1234567890",
          pages: 300,
          publishedYear: 2023,
          genre: "Test Fiction",
        },
      });

      const { itemId } = await createTestItem(
        context.app,
        context.accessToken,
        collectionId,
        itemData,
      );

      // Delete the item
      await supertest(context.app)
        .delete(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      // Verify notification contains relevant information
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(1);

      const notification = notificationsResponse.body.data.notifications[0];

      // Check notification structure
      expect(notification).toHaveProperty("id");
      expect(notification).toHaveProperty("type");
      expect(notification).toHaveProperty("message");
      expect(notification).toHaveProperty("createdAt");
      expect(notification).toHaveProperty("updatedAt");

      // Check notification content includes item name
      expect(notification.message).toContain(itemData.name);
      expect(notification.type).toBe("item_deleted");

      // Verify timestamps are valid dates
      expect(new Date(notification.createdAt).toString()).not.toBe(
        "Invalid Date",
      );
      expect(new Date(notification.updatedAt).toString()).not.toBe(
        "Invalid Date",
      );
    });

    it("should not create duplicate notifications", async () => {
      // Create and delete an item
      const { itemId } = await createTestItem(
        context.app,
        context.accessToken,
        collectionId,
        TestDataBuilder.book({ name: "Duplicate Test Book" }),
      );

      await supertest(context.app)
        .delete(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      // Try to delete the same item again (should fail)
      await supertest(context.app)
        .delete(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(404);

      // Verify only one notification exists
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(1);
    });
  });
});
