import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDeps } from "./helpers/mockDeps";

/**
 * TODO fix test
 */
describe.skip("Pantry Management Workflow Integration", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDeps();
    ({ app } = makeExpressApp(deps));
  });

  it("should complete full pantry management workflow with expiration tracking", async () => {
    // This integration test should FAIL until all components are implemented

    // Step 1: Create a pantry collection
    const pantryCollection = {
      name: "Kitchen Pantry",
      description: "Food items with expiration tracking",
      schema: {
        fields: [
          { name: "name", type: "string", required: true },
          { name: "brand", type: "string", required: false },
          { name: "category", type: "string", required: true },
          { name: "quantity", type: "number", required: true },
          { name: "unit", type: "string", required: true },
        ],
      },
    };

    const createResponse = await supertest(app)
      .post("/api/v1/collections")
      .set("Authorization", "Bearer valid_token")
      .send(pantryCollection)
      .expect(201);

    expect(createResponse.body.success).toBe(true);
    const collectionId = createResponse.body.data.id;

    // Step 2: Add food items with expiration dates
    const currentDate = new Date();
    const futureDate = new Date(
      currentDate.getTime() + 30 * 24 * 60 * 60 * 1000,
    ); // 30 days from now
    const nearExpirationDate = new Date(
      currentDate.getTime() + 3 * 24 * 60 * 60 * 1000,
    ); // 3 days from now
    const expiredDate = new Date(
      currentDate.getTime() - 1 * 24 * 60 * 60 * 1000,
    ); // 1 day ago

    const foodItems = [
      {
        metadata: {
          name: "Organic Milk",
          brand: "Local Farm",
          category: "Dairy",
          quantity: 1,
          unit: "liter",
        },
        expirationDate: futureDate.toISOString(),
      },
      {
        metadata: {
          name: "Whole Wheat Bread",
          brand: "Bakery Fresh",
          category: "Bakery",
          quantity: 1,
          unit: "loaf",
        },
        expirationDate: nearExpirationDate.toISOString(),
      },
      {
        metadata: {
          name: "Greek Yogurt",
          brand: "Premium Brand",
          category: "Dairy",
          quantity: 500,
          unit: "grams",
        },
        expirationDate: expiredDate.toISOString(),
      },
    ];

    const addedItems = [];
    for (const item of foodItems) {
      const addResponse = await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .send(item)
        .expect(201);

      expect(addResponse.body.success).toBe(true);
      addedItems.push(addResponse.body.data);
    }

    // Step 3: Filter items expiring soon
    const threeDaysFromNow = new Date(
      currentDate.getTime() + 3 * 24 * 60 * 60 * 1000,
    );
    const expiringResponse = await supertest(app)
      .get(`/api/v1/collections/${collectionId}/items`)
      .query({ expirationBefore: threeDaysFromNow.toISOString().split("T")[0] })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(expiringResponse.body.data.length).toBeGreaterThan(0);

    // Step 4: Search by category
    const dairySearchResponse = await supertest(app)
      .get("/api/v1/items/search")
      .query({ q: "Dairy", collectionId })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(dairySearchResponse.body.data.length).toBe(2); // Milk and Yogurt

    // Step 5: Update quantity when consuming items
    const milkItem = addedItems.find(
      (item) => item.metadata.name === "Organic Milk",
    );
    const updateQuantityData = {
      metadata: {
        ...milkItem.metadata,
        quantity: 0.5, // Half consumed
      },
      expirationDate: milkItem.expirationDate,
    };

    const updateResponse = await supertest(app)
      .put(`/api/v1/items/${milkItem.id}`)
      .set("Authorization", "Bearer valid_token")
      .send(updateQuantityData)
      .expect(200);

    expect(updateResponse.body.data.metadata.quantity).toBe(0.5);

    // Step 6: Check for notifications about expiring/expired items
    const notificationsResponse = await supertest(app)
      .get("/api/v1/notifications")
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    // Should have notifications for items expiring soon or expired
    expect(
      notificationsResponse.body.data.some(
        (notif: { type: string }) =>
          notif.type === "EXPIRATION_WARNING" ||
          notif.type === "EXPIRATION_ALERT",
      ),
    ).toBe(true);

    // Step 7: Filter notifications by type
    const expirationNotificationsResponse = await supertest(app)
      .get("/api/v1/notifications")
      .query({ type: "EXPIRATION_WARNING" })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(
      expirationNotificationsResponse.body.data.every(
        (notif: { type: string }) => notif.type === "EXPIRATION_WARNING",
      ),
    ).toBe(true);

    // Step 8: Remove expired item
    const expiredItem = addedItems.find(
      (item) => item.metadata.name === "Greek Yogurt",
    );
    await supertest(app)
      .delete(`/api/v1/items/${expiredItem.id}`)
      .set("Authorization", "Bearer valid_token")
      .expect(204);

    // Step 9: Verify item was removed
    await supertest(app)
      .get(`/api/v1/items/${expiredItem.id}`)
      .set("Authorization", "Bearer valid_token")
      .expect(404);

    // Step 10: Verify collection item count updated
    const finalCollectionResponse = await supertest(app)
      .get(`/api/v1/collections/${collectionId}`)
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(finalCollectionResponse.body.data.itemCount).toBe(2); // One item removed

    // Step 11: Search for items by expiration date range
    const futureSearchResponse = await supertest(app)
      .get("/api/v1/items/search")
      .query({
        collectionId,
        expirationAfter: currentDate.toISOString().split("T")[0],
        expirationBefore: futureDate.toISOString().split("T")[0],
      })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(futureSearchResponse.body.data.length).toBe(2); // Remaining non-expired items
  });
});
