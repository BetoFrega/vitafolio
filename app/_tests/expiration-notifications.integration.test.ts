import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDeps } from "./helpers/mockDeps";

describe("Expiration Notifications Integration", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDeps();
    ({ app } = makeExpressApp(deps));
  });

  it("should generate and manage expiration notifications correctly", async () => {
    // This integration test should FAIL until all components are implemented

    // Step 1: Create a collection with items at different expiration stages
    const testCollection = {
      name: "Test Expiration Collection",
      description: "Testing expiration notification functionality",
      schema: {
        fields: [
          { name: "name", type: "string", required: true },
          { name: "category", type: "string", required: true },
        ],
      },
    };

    const createResponse = await supertest(app)
      .post("/api/v1/collections")
      .set("Authorization", "Bearer valid_token")
      .send(testCollection)
      .expect(201);

    const collectionId = createResponse.body.data.id;

    // Step 2: Add items with different expiration scenarios
    const currentDate = new Date();
    const items = [
      {
        name: "Already Expired Item",
        expirationDate: new Date(
          currentDate.getTime() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 1 day ago
        metadata: { name: "Expired Food", category: "Food" },
      },
      {
        name: "Expiring Tomorrow",
        expirationDate: new Date(
          currentDate.getTime() + 1 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 1 day from now
        metadata: { name: "Tomorrow Food", category: "Food" },
      },
      {
        name: "Expiring in 3 Days",
        expirationDate: new Date(
          currentDate.getTime() + 3 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 3 days from now
        metadata: { name: "Three Day Food", category: "Food" },
      },
      {
        name: "Expiring in 7 Days",
        expirationDate: new Date(
          currentDate.getTime() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days from now
        metadata: { name: "Week Food", category: "Food" },
      },
      {
        name: "Long Term Item",
        expirationDate: new Date(
          currentDate.getTime() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days from now
        metadata: { name: "Long Term Food", category: "Food" },
      },
    ];

    const addedItems = [];
    for (const item of items) {
      const addResponse = await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .send(item)
        .expect(201);

      addedItems.push(addResponse.body.data);
    }

    // Step 3: Check initial notifications state (should be empty before generation)
    const initialNotificationsResponse = await supertest(app)
      .get("/api/v1/notifications")
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    // Initially empty since notifications haven't been generated yet
    expect(initialNotificationsResponse.body.data).toEqual([]);

    // Step 4: Trigger notification generation (this would typically be done by a scheduled job)
    // For testing purposes, we'll simulate the notification generation process
    // This step would call the GenerateNotifications use case

    // Step 5: Check notifications after generation
    const notificationsResponse = await supertest(app)
      .get("/api/v1/notifications")
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(notificationsResponse.body.data.length).toBeGreaterThan(0);

    // Step 6: Verify different types of notifications are created
    const notifications = notificationsResponse.body.data;

    // Should have EXPIRATION_ALERT for already expired items
    const expiredAlerts = notifications.filter(
      (n: { type: string }) => n.type === "EXPIRATION_ALERT",
    );
    expect(expiredAlerts.length).toBeGreaterThan(0);

    // Should have EXPIRATION_WARNING for items expiring soon
    const expirationWarnings = notifications.filter(
      (n: { type: string }) => n.type === "EXPIRATION_WARNING",
    );
    expect(expirationWarnings.length).toBeGreaterThan(0);

    // Step 7: Test filtering notifications by type
    const alertsResponse = await supertest(app)
      .get("/api/v1/notifications")
      .query({ type: "EXPIRATION_ALERT" })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(
      alertsResponse.body.data.every(
        (n: { type: string }) => n.type === "EXPIRATION_ALERT",
      ),
    ).toBe(true);

    // Step 8: Test filtering notifications by status
    const unreadResponse = await supertest(app)
      .get("/api/v1/notifications")
      .query({ status: "UNREAD" })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(
      unreadResponse.body.data.every(
        (n: { status: string }) => n.status === "UNREAD",
      ),
    ).toBe(true);

    // Step 9: Verify notification content includes proper item and collection references
    const firstNotification = notifications[0];
    expect(firstNotification).toMatchObject({
      id: expect.any(String),
      type: expect.stringMatching(/^(EXPIRATION_WARNING|EXPIRATION_ALERT)$/),
      status: "UNREAD",
      title: expect.any(String),
      message: expect.any(String),
      itemId: expect.any(String),
      collectionId: collectionId,
      createdAt: expect.any(String),
    });

    // Step 10: Verify that item IDs in notifications match actual items
    const notificationItemIds = notifications.map(
      (n: { itemId: string }) => n.itemId,
    );
    const actualItemIds = addedItems.map((item) => item.id);
    expect(
      notificationItemIds.every((id: string) => actualItemIds.includes(id)),
    ).toBe(true);

    // Step 11: Test notification pagination
    const paginatedResponse = await supertest(app)
      .get("/api/v1/notifications")
      .query({ page: 1, limit: 2 })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(paginatedResponse.body.data.length).toBeLessThanOrEqual(2);
    expect(paginatedResponse.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });

    // Step 12: Verify notifications are properly linked to correct items
    for (const notification of notifications.slice(0, 2)) {
      // Test first 2 notifications
      const itemResponse = await supertest(app)
        .get(`/api/v1/items/${notification.itemId}`)
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(itemResponse.body.data.collectionId).toBe(
        notification.collectionId,
      );
    }

    // Step 13: Test that removing an item affects related notifications
    const itemToRemove = addedItems[0];
    await supertest(app)
      .delete(`/api/v1/items/${itemToRemove.id}`)
      .set("Authorization", "Bearer valid_token")
      .expect(204);

    // After item removal, notifications for that item should be handled appropriately
    // (either removed or marked as resolved - depends on business rules)
    const notificationsAfterDeletion = await supertest(app)
      .get("/api/v1/notifications")
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    // Verify system handles the relationship correctly
    expect(notificationsAfterDeletion.body.data).toEqual(expect.any(Array));
  });
});
