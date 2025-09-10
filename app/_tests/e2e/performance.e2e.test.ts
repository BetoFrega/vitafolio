import supertest from "supertest";
import { setupE2ETest, createTestCollection, createTestItem, type E2ETestContext } from "../helpers/e2e-setup";
import { TestDataBuilder } from "../helpers/test-data-builders";

// Note: These tests use describe.skip since they are not yet implemented
// Remove .skip when performance optimizations are implemented
describe.skip("Performance E2E Tests", () => {
  let context: E2ETestContext;

  beforeEach(async () => {
    context = await setupE2ETest();
  });

  describe("Large Dataset Handling", () => {
    it("should handle collections with many items efficiently", async () => {
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection({ name: "Large Book Collection" }),
      );

      // Add 100 items to the collection
      const itemCount = 100;
      const itemIds = [];

      console.time("Creating 100 items");
      for (let i = 1; i <= itemCount; i++) {
        const { itemId } = await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.book({
            name: `Book ${i}`,
            metadata: {
              title: `Book ${i}`,
              author: `Author ${i % 20}`, // 20 different authors
              genre: i % 2 === 0 ? "Fiction" : "Non-Fiction",
              pages: 200 + (i % 300),
              publishedYear: 1900 + (i % 123),
            },
          }),
        );
        itemIds.push(itemId);
      }
      console.timeEnd("Creating 100 items");

      // Test list operations performance
      console.time("Listing items in large collection");
      const listResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Listing items in large collection");

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(itemCount);

      // Test search performance
      console.time("Searching in large collection");
      const searchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ genre: "Fiction" })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Searching in large collection");

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.items.length).toBeGreaterThan(0);

      // Test individual item access
      console.time("Getting individual item from large collection");
      const itemResponse = await supertest(context.app)
        .get(`/api/v1/items/${itemIds[50]}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Getting individual item from large collection");

      expect(itemResponse.body.success).toBe(true);
      expect(itemResponse.body.data.name).toBe("Book 51");
    });

    it("should handle users with many collections efficiently", async () => {
      const collectionCount = 50;
      const collectionIds = [];

      console.time("Creating 50 collections");
      for (let i = 1; i <= collectionCount; i++) {
        const { collectionId } = await createTestCollection(
          context.app,
          context.accessToken,
          TestDataBuilder.collection({
            name: `Collection ${i}`,
            description: `Description for collection ${i}`,
          }),
        );
        collectionIds.push(collectionId);

        // Add a few items to each collection
        for (let j = 1; j <= 3; j++) {
          await createTestItem(
            context.app,
            context.accessToken,
            collectionId,
            TestDataBuilder.item({
              name: `Item ${j} in Collection ${i}`,
              metadata: {
                title: `Item ${j} in Collection ${i}`,
                category: `Category ${i % 5}`,
              },
            }),
          );
        }
      }
      console.timeEnd("Creating 50 collections");

      // Test list collections performance
      console.time("Listing many collections");
      const listResponse = await supertest(context.app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Listing many collections");

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.collections).toHaveLength(collectionCount);

      // Test search across many collections
      console.time("Searching across many collections");
      const searchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ category: "Category 1" })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Searching across many collections");

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.items.length).toBeGreaterThan(0);

      // Test getting individual collections
      console.time("Getting individual collection from many collections");
      const collectionResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionIds[25]}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Getting individual collection from many collections");

      expect(collectionResponse.body.success).toBe(true);
      expect(collectionResponse.body.data.name).toBe("Collection 26");
    });

    it("should handle bulk operations efficiently", async () => {
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.collection({ name: "Bulk Operations Collection" }),
      );

      // Create many items
      const itemCount = 50;
      const itemIds = [];

      console.time("Bulk creating items");
      for (let i = 1; i <= itemCount; i++) {
        const { itemId } = await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.item({
            name: `Bulk Item ${i}`,
            metadata: {
              title: `Bulk Item ${i}`,
              category: "Bulk",
              index: i,
            },
          }),
        );
        itemIds.push(itemId);
      }
      console.timeEnd("Bulk creating items");

      // Bulk delete items
      console.time("Bulk deleting items");
      for (const itemId of itemIds) {
        await supertest(context.app)
          .delete(`/api/v1/items/${itemId}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);
      }
      console.timeEnd("Bulk deleting items");

      // Verify all items are deleted
      const listResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(0);

      // Verify notifications were created
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(itemCount);
    });
  });

  describe("Search Performance", () => {
    let collectionId: string;
    const itemCount = 200;

    beforeEach(async () => {
      const result = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection({ name: "Search Performance Collection" }),
      );
      collectionId = result.collectionId;

      // Create many items with varied metadata for search testing
      for (let i = 1; i <= itemCount; i++) {
        await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.book({
            name: `Search Book ${i}`,
            metadata: {
              title: `Search Book ${i}`,
              author: `Author ${i % 50}`, // 50 different authors
              genre: ["Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Mystery"][i % 5],
              pages: 100 + (i % 500),
              publishedYear: 1950 + (i % 73),
            },
          }),
        );
      }
    });

    it("should perform text search efficiently", async () => {
      console.time("Text search on large dataset");
      const searchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ author: "Author 10" })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Text search on large dataset");

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.items.length).toBeGreaterThan(0);
    });

    it("should perform range search efficiently", async () => {
      console.time("Range search on large dataset");
      const searchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ 
          publishedYear_gte: 2000,
          publishedYear_lte: 2020,
        })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Range search on large dataset");

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.items.length).toBeGreaterThan(0);
    });

    it("should perform complex multi-field search efficiently", async () => {
      console.time("Complex multi-field search on large dataset");
      const searchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ 
          genre: "Fiction",
          pages_gte: 200,
          publishedYear_gte: 1990,
        })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Complex multi-field search on large dataset");

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe("Memory Usage", () => {
    it("should handle large collections without memory issues", async () => {
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.collection({ name: "Memory Test Collection" }),
      );

      // Create items with large metadata
      const itemCount = 100;
      const largeMetadata = {
        title: "A".repeat(1000), // Large title
        description: "B".repeat(5000), // Large description
        content: "C".repeat(10000), // Large content
        tags: Array.from({ length: 100 }, (_, i) => `tag-${i}`).join(", "),
      };

      console.time("Creating items with large metadata");
      for (let i = 1; i <= itemCount; i++) {
        await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          {
            name: `Large Item ${i}`,
            metadata: {
              ...largeMetadata,
              index: i,
            },
          },
        );
      }
      console.timeEnd("Creating items with large metadata");

      // Test listing with large metadata
      console.time("Listing items with large metadata");
      const listResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);
      console.timeEnd("Listing items with large metadata");

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(itemCount);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent read operations", async () => {
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.collection({ name: "Concurrent Read Test" }),
      );

      // Add some items
      for (let i = 1; i <= 10; i++) {
        await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.item({ name: `Concurrent Item ${i}` }),
        );
      }

      // Perform concurrent read operations
      const concurrentReads = Array.from({ length: 20 }, () =>
        supertest(context.app)
          .get(`/api/v1/collections/${collectionId}/items`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200)
      );

      console.time("Concurrent read operations");
      const results = await Promise.all(concurrentReads);
      console.timeEnd("Concurrent read operations");

      // Verify all reads succeeded
      results.forEach(result => {
        expect(result.body.success).toBe(true);
        expect(result.body.data.items).toHaveLength(10);
      });
    });

    it("should handle concurrent write operations", async () => {
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.collection({ name: "Concurrent Write Test" }),
      );

      // Perform concurrent write operations
      const concurrentWrites = Array.from({ length: 10 }, (_, i) =>
        supertest(context.app)
          .post(`/api/v1/collections/${collectionId}/items`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .send(TestDataBuilder.item({ name: `Concurrent Write Item ${i + 1}` }))
          .expect(201)
      );

      console.time("Concurrent write operations");
      const results = await Promise.all(concurrentWrites);
      console.timeEnd("Concurrent write operations");

      // Verify all writes succeeded
      results.forEach(result => {
        expect(result.body.success).toBe(true);
        expect(result.body.data.id).toBeDefined();
      });

      // Verify all items were created
      const listResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(10);
    });
  });
});
