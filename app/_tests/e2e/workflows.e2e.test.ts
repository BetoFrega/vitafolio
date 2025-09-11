import supertest from "supertest";
import {
  setupE2ETest,
  createTestCollection,
  createTestItem,
  type E2ETestContext,
} from "../helpers/e2e-setup";
import { TestDataBuilder } from "../helpers/test-data-builders";

describe.skip("Complex Workflows E2E Tests", () => {
  let context: E2ETestContext;

  beforeEach(async () => {
    context = await setupE2ETest();
  });

  describe("Metadata Schema Evolution", () => {
    it("should handle metadata schema evolution with existing items", async () => {
      // Create collection with initial schema
      const initialCollection = TestDataBuilder.bookCollection({
        name: "Evolving Book Collection",
        metadataSchema: {
          fields: {
            title: { type: "text", required: true },
            author: { type: "text", required: true },
            pages: { type: "number", required: false },
          },
        },
      });

      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        initialCollection,
      );

      // Add items with initial schema
      const { itemId: item1Id } = await createTestItem(
        context.app,
        context.accessToken,
        collectionId,
        TestDataBuilder.book({
          name: "Book 1",
          metadata: {
            title: "Book 1",
            author: "Author 1",
            pages: 200,
          },
        }),
      );

      const { itemId: item2Id } = await createTestItem(
        context.app,
        context.accessToken,
        collectionId,
        TestDataBuilder.book({
          name: "Book 2",
          metadata: {
            title: "Book 2",
            author: "Author 2",
            // No pages - optional field
          },
        }),
      );

      // Update collection schema (add new fields)
      const updatedSchema = {
        metadataSchema: {
          fields: {
            title: { type: "text", required: true },
            author: { type: "text", required: true },
            pages: { type: "number", required: false },
            isbn: { type: "text", required: false }, // New optional field
            genre: { type: "text", required: false }, // New optional field
            rating: { type: "number", required: false }, // New optional field
          },
        },
      };

      const updateResponse = await supertest(context.app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send(updatedSchema)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // Verify existing items still work
      const item1Response = await supertest(context.app)
        .get(`/api/v1/items/${item1Id}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(item1Response.body.success).toBe(true);
      expect(item1Response.body.data.metadata).toMatchObject({
        title: "Book 1",
        author: "Author 1",
        pages: 200,
      });

      // Add new item with updated schema
      const newItemResponse = await supertest(context.app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send({
          name: "Book 3",
          metadata: {
            title: "Book 3",
            author: "Author 3",
            pages: 350,
            isbn: "978-1234567890",
            genre: "Science Fiction",
            rating: 5,
          },
        })
        .expect(201);

      expect(newItemResponse.body.success).toBe(true);
      expect(newItemResponse.body.data.metadata).toMatchObject({
        title: "Book 3",
        author: "Author 3",
        pages: 350,
        isbn: "978-1234567890",
        genre: "Science Fiction",
        rating: 5,
      });

      // Update existing item with new fields
      const updateItemResponse = await supertest(context.app)
        .put(`/api/v1/items/${item2Id}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send({
          name: "Book 2 Updated",
          metadata: {
            title: "Book 2 Updated",
            author: "Author 2",
            pages: 180,
            genre: "Mystery", // Adding new field to existing item
          },
        })
        .expect(200);

      expect(updateItemResponse.body.success).toBe(true);
      expect(updateItemResponse.body.data.metadata).toMatchObject({
        title: "Book 2 Updated",
        author: "Author 2",
        pages: 180,
        genre: "Mystery",
      });
    });

    it("should validate metadata against updated schema strictly", async () => {
      // Create collection
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection(),
      );

      // Update schema to make more fields required
      const stricterSchema = {
        metadataSchema: {
          fields: {
            title: { type: "text", required: true },
            author: { type: "text", required: true },
            isbn: { type: "text", required: true }, // Now required
            pages: { type: "number", required: true }, // Now required
            publishedYear: { type: "number", required: true }, // Now required
          },
        },
      };

      await supertest(context.app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send(stricterSchema)
        .expect(200);

      // Try to add item with missing required fields
      const invalidItemResponse = await supertest(context.app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send({
          name: "Incomplete Book",
          metadata: {
            title: "Incomplete Book",
            author: "Some Author",
            // Missing required isbn, pages, publishedYear
          },
        })
        .expect(400);

      expect(invalidItemResponse.body.success).toBe(false);

      // Try to add item with invalid field types
      const invalidTypeResponse = await supertest(context.app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send({
          name: "Invalid Type Book",
          metadata: {
            title: "Invalid Type Book",
            author: "Some Author",
            isbn: "978-1234567890",
            pages: "not a number", // Invalid type
            publishedYear: "also not a number", // Invalid type
          },
        })
        .expect(400);

      expect(invalidTypeResponse.body.success).toBe(false);

      // Add valid item with all required fields
      const validItemResponse = await supertest(context.app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send({
          name: "Valid Complete Book",
          metadata: {
            title: "Valid Complete Book",
            author: "Valid Author",
            isbn: "978-1234567890",
            pages: 300,
            publishedYear: 2023,
          },
        })
        .expect(201);

      expect(validItemResponse.body.success).toBe(true);
    });
  });

  describe("Complete Library Management Workflow", () => {
    it("should handle complete book library management scenario", async () => {
      // 1. Create a book collection
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection({
          name: "My Personal Library",
          description: "Books I own and want to track",
        }),
      );

      // 2. Add multiple books
      const books = [
        {
          name: "The Hobbit",
          metadata: {
            title: "The Hobbit",
            author: "J.R.R. Tolkien",
            isbn: "978-0547928227",
            pages: 366,
            publishedYear: 1937,
            genre: "Fantasy",
          },
        },
        {
          name: "1984",
          metadata: {
            title: "1984",
            author: "George Orwell",
            isbn: "978-0451524935",
            pages: 328,
            publishedYear: 1949,
            genre: "Dystopian Fiction",
          },
        },
        {
          name: "Pride and Prejudice",
          metadata: {
            title: "Pride and Prejudice",
            author: "Jane Austen",
            isbn: "978-0141439518",
            pages: 432,
            publishedYear: 1813,
            genre: "Romance",
          },
        },
      ];

      const bookIds = [];
      for (const book of books) {
        const response = await supertest(context.app)
          .post(`/api/v1/collections/${collectionId}/items`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .send(book)
          .expect(201);

        bookIds.push(response.body.data.id);
      }

      // 3. Verify collection contains all books
      const listResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(3);

      // 4. Search for books by genre
      const fantasySearchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ genre: "Fantasy" })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(fantasySearchResponse.body.success).toBe(true);
      expect(fantasySearchResponse.body.data.items).toHaveLength(1);
      expect(fantasySearchResponse.body.data.items[0].metadata.title).toBe(
        "The Hobbit",
      );

      // 5. Search for books by author
      const orwellSearchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ author: "George Orwell" })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(orwellSearchResponse.body.success).toBe(true);
      expect(orwellSearchResponse.body.data.items).toHaveLength(1);
      expect(orwellSearchResponse.body.data.items[0].metadata.title).toBe(
        "1984",
      );

      // 6. Update a book's information
      const updatedBookResponse = await supertest(context.app)
        .put(`/api/v1/items/${bookIds[0]}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send({
          name: "The Hobbit (Anniversary Edition)",
          metadata: {
            title: "The Hobbit (Anniversary Edition)",
            author: "J.R.R. Tolkien",
            isbn: "978-0547928227",
            pages: 366,
            publishedYear: 1937,
            genre: "Fantasy",
          },
        })
        .expect(200);

      expect(updatedBookResponse.body.success).toBe(true);
      expect(updatedBookResponse.body.data.name).toBe(
        "The Hobbit (Anniversary Edition)",
      );

      // 7. Remove a book from collection
      await supertest(context.app)
        .delete(`/api/v1/items/${bookIds[1]}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      // 8. Verify book was removed and notification was created
      const finalListResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(finalListResponse.body.success).toBe(true);
      expect(finalListResponse.body.data.items).toHaveLength(2);

      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(1);
      expect(
        notificationsResponse.body.data.notifications[0].message,
      ).toContain("1984");

      // 9. Update collection information
      const updatedCollectionResponse = await supertest(context.app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .send({
          name: "My Curated Library",
          description: "Carefully selected books that I love",
        })
        .expect(200);

      expect(updatedCollectionResponse.body.success).toBe(true);
      expect(updatedCollectionResponse.body.data.name).toBe(
        "My Curated Library",
      );
    });
  });

  describe("Multi-Collection Workflow", () => {
    it("should handle cross-collection operations", async () => {
      // Create multiple collections
      const { collectionId: booksId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.bookCollection({ name: "Books" }),
      );

      const { collectionId: moviesId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.movieCollection({ name: "Movies" }),
      );

      // Add items to both collections
      await createTestItem(
        context.app,
        context.accessToken,
        booksId,
        TestDataBuilder.book({ name: "Dune" }),
      );

      await createTestItem(
        context.app,
        context.accessToken,
        moviesId,
        TestDataBuilder.movie({ name: "Dune (2021)" }),
      );

      // Search across all collections
      const duneSearchResponse = await supertest(context.app)
        .get("/api/v1/items/search")
        .query({ title: "Dune" })
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(duneSearchResponse.body.success).toBe(true);
      expect(duneSearchResponse.body.data.items).toHaveLength(1); // Should find the book
      expect(duneSearchResponse.body.data.items[0].metadata.title).toBe("Dune");

      // List all collections
      const collectionsResponse = await supertest(context.app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(collectionsResponse.body.success).toBe(true);
      expect(collectionsResponse.body.data.collections).toHaveLength(2);

      const collectionNames = collectionsResponse.body.data.collections.map(
        (c: { name: string }) => c.name,
      );
      expect(collectionNames).toContain("Books");
      expect(collectionNames).toContain("Movies");
    });
  });

  describe("Data Consistency Verification", () => {
    it("should maintain count consistency throughout operations", async () => {
      // Create collection
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.collection({ name: "Count Test Collection" }),
      );

      // Verify initial count is 0
      let collectionResponse = await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(collectionResponse.body.data.itemCount).toBe(0);

      // Add items and verify count updates
      const itemIds = [];
      for (let i = 1; i <= 5; i++) {
        const { itemId } = await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.item({ name: `Item ${i}` }),
        );
        itemIds.push(itemId);

        // Check count after each addition
        collectionResponse = await supertest(context.app)
          .get(`/api/v1/collections/${collectionId}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);

        expect(collectionResponse.body.data.itemCount).toBe(i);
      }

      // Delete items and verify count decreases
      for (let i = 0; i < 3; i++) {
        await supertest(context.app)
          .delete(`/api/v1/items/${itemIds[i]}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);

        // Check count after each deletion
        collectionResponse = await supertest(context.app)
          .get(`/api/v1/collections/${collectionId}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(200);

        expect(collectionResponse.body.data.itemCount).toBe(5 - (i + 1));
      }

      // Final count should be 2
      expect(collectionResponse.body.data.itemCount).toBe(2);
    });

    it("should maintain referential integrity on collection deletion", async () => {
      // Create collection with items
      const { collectionId } = await createTestCollection(
        context.app,
        context.accessToken,
        TestDataBuilder.collection({ name: "Integrity Test Collection" }),
      );

      const itemIds = [];
      for (let i = 1; i <= 3; i++) {
        const { itemId } = await createTestItem(
          context.app,
          context.accessToken,
          collectionId,
          TestDataBuilder.item({ name: `Item ${i}` }),
        );
        itemIds.push(itemId);
      }

      // Delete collection
      await supertest(context.app)
        .delete(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      // Verify collection is gone
      await supertest(context.app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(404);

      // Verify all items are gone
      for (const itemId of itemIds) {
        await supertest(context.app)
          .get(`/api/v1/items/${itemId}`)
          .set("Authorization", `Bearer ${context.accessToken}`)
          .expect(404);
      }

      // Verify notifications were created for all deleted items
      const notificationsResponse = await supertest(context.app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${context.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body.success).toBe(true);
      expect(notificationsResponse.body.data.notifications).toHaveLength(3);
    });
  });
});
