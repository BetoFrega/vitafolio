import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";

describe("Schema Evolution Integration", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = {
      registerAccount: vi.fn(),
      login: vi.fn(),
      // Placeholder repositories until collections are implemented
      collectionRepository: {},
      // Placeholder repositories until collections are implemented
      itemRepository: {},
      // Placeholder repositories until collections are implemented
      notificationRepository: {},
    };
    ({ app } = makeExpressApp(deps));
  });

  it("should handle collection schema evolution correctly", async () => {
    // This integration test should FAIL until all components are implemented

    // Step 1: Create a collection with initial schema
    const initialCollection = {
      name: "Evolving Library",
      description: "Testing schema evolution",
      schema: {
        fields: [
          { name: "title", type: "string", required: true },
          { name: "author", type: "string", required: true },
        ],
      },
    };

    const createResponse = await supertest(app)
      .post("/api/v1/collections")
      .set("Authorization", "Bearer valid_token")
      .send(initialCollection)
      .expect(201);

    const collectionId = createResponse.body.data.id;

    // Step 2: Add items with initial schema
    const initialItems = [
      {
        metadata: {
          title: "Initial Book 1",
          author: "Author One",
        },
      },
      {
        metadata: {
          title: "Initial Book 2",
          author: "Author Two",
        },
      },
    ];

    const addedItems = [];
    for (const item of initialItems) {
      const addResponse = await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .send(item)
        .expect(201);

      addedItems.push(addResponse.body.data);
    }

    // Step 3: Evolve schema by adding optional fields
    const evolvedSchema = {
      name: initialCollection.name,
      description: initialCollection.description,
      schema: {
        fields: [
          { name: "title", type: "string", required: true },
          { name: "author", type: "string", required: true },
          { name: "isbn", type: "string", required: false }, // New optional field
          { name: "genre", type: "string", required: false }, // New optional field
          { name: "rating", type: "number", required: false }, // New optional field
        ],
      },
    };

    const updateSchemaResponse = await supertest(app)
      .put(`/api/v1/collections/${collectionId}`)
      .set("Authorization", "Bearer valid_token")
      .send(evolvedSchema)
      .expect(200);

    expect(updateSchemaResponse.body.data.schema.fields).toHaveLength(5);

    // Step 4: Verify existing items still work with evolved schema
    const existingItemResponse = await supertest(app)
      .get(`/api/v1/items/${addedItems[0].id}`)
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(existingItemResponse.body.data.metadata).toMatchObject({
      title: "Initial Book 1",
      author: "Author One",
    });

    // Step 5: Add new items using evolved schema
    const newItem = {
      metadata: {
        title: "New Book with Full Schema",
        author: "New Author",
        isbn: "9780123456789",
        genre: "Science Fiction",
        rating: 5,
      },
    };

    const newItemResponse = await supertest(app)
      .post(`/api/v1/collections/${collectionId}/items`)
      .set("Authorization", "Bearer valid_token")
      .send(newItem)
      .expect(201);

    expect(newItemResponse.body.data.metadata).toMatchObject(newItem.metadata);

    // Step 6: Update existing items to use new fields
    const updateExistingItem = {
      metadata: {
        title: addedItems[0].metadata.title,
        author: addedItems[0].metadata.author,
        isbn: "9780987654321",
        genre: "Classic Literature",
      },
    };

    const updateItemResponse = await supertest(app)
      .put(`/api/v1/items/${addedItems[0].id}`)
      .set("Authorization", "Bearer valid_token")
      .send(updateExistingItem)
      .expect(200);

    expect(updateItemResponse.body.data.metadata).toMatchObject(
      updateExistingItem.metadata,
    );

    // Step 7: Search should work across old and new schema fields
    const titleSearchResponse = await supertest(app)
      .get("/api/v1/items/search")
      .query({ q: "Initial", collectionId })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(titleSearchResponse.body.data.length).toBeGreaterThan(0);

    const genreSearchResponse = await supertest(app)
      .get("/api/v1/items/search")
      .query({ q: "Science Fiction", collectionId })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(genreSearchResponse.body.data.length).toBeGreaterThan(0);

    // Step 8: Evolve schema again by making a field required (should handle gracefully)
    const secondEvolution = {
      name: initialCollection.name,
      description: "Testing further evolution",
      schema: {
        fields: [
          { name: "title", type: "string", required: true },
          { name: "author", type: "string", required: true },
          { name: "isbn", type: "string", required: true }, // Made required
          { name: "genre", type: "string", required: false },
          { name: "rating", type: "number", required: false },
          { name: "publicationYear", type: "number", required: false }, // New field
        ],
      },
    };

    // This update might require special handling for existing items without ISBN
    const secondUpdateResponse = await supertest(app)
      .put(`/api/v1/collections/${collectionId}`)
      .set("Authorization", "Bearer valid_token")
      .send(secondEvolution)
      .expect(200);

    expect(secondUpdateResponse.body.data.schema.fields).toHaveLength(6);

    // Step 9: Try adding item with new required field
    const itemWithRequiredFields = {
      metadata: {
        title: "Book with Required ISBN",
        author: "Required Author",
        isbn: "9781234567890",
        publicationYear: 2025,
      },
    };

    const requiredFieldItemResponse = await supertest(app)
      .post(`/api/v1/collections/${collectionId}/items`)
      .set("Authorization", "Bearer valid_token")
      .send(itemWithRequiredFields)
      .expect(201);

    expect(requiredFieldItemResponse.body.data.metadata.isbn).toBe(
      "9781234567890",
    );

    // Step 10: Verify validation works with new required fields
    const invalidItem = {
      metadata: {
        title: "Book without Required ISBN",
        author: "Author Without ISBN",
        // Missing required ISBN field
      },
    };

    await supertest(app)
      .post(`/api/v1/collections/${collectionId}/items`)
      .set("Authorization", "Bearer valid_token")
      .send(invalidItem)
      .expect(400);

    // Step 11: List all items to verify schema evolution didn't break anything
    const allItemsResponse = await supertest(app)
      .get(`/api/v1/collections/${collectionId}/items`)
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(allItemsResponse.body.data.length).toBe(4); // 2 initial + 1 new + 1 with required fields

    // Step 12: Verify collection shows updated schema
    const finalCollectionResponse = await supertest(app)
      .get(`/api/v1/collections/${collectionId}`)
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(finalCollectionResponse.body.data.schema.fields).toHaveLength(6);
    const isbnField = finalCollectionResponse.body.data.schema.fields.find(
      (f: { name: string }) => f.name === "isbn",
    );
    expect(isbnField.required).toBe(true);
  });
});
