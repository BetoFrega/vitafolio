import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDeps } from "./helpers/mockDeps";

/**
 * TODO fix test
 */
describe.skip("Library Collection Workflow Integration", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDeps();
    ({ app } = makeExpressApp(deps));
  });

  it("should complete full library management workflow", async () => {
    // This integration test should FAIL until all components are implemented

    // Step 1: Create a library collection
    const libraryCollection = {
      name: "My Personal Library",
      description: "Books I own and want to track",
      schema: {
        fields: [
          { name: "title", type: "string", required: true },
          { name: "author", type: "string", required: true },
          { name: "isbn", type: "string", required: false },
          { name: "genre", type: "string", required: false },
          { name: "rating", type: "number", required: false },
        ],
      },
    };

    const createResponse = await supertest(app)
      .post("/api/v1/collections")
      .set("Authorization", "Bearer valid_token")
      .send(libraryCollection)
      .expect(201);

    expect(createResponse.body.success).toBe(true);
    const collectionId = createResponse.body.data.id;

    // Step 2: Add books to the library
    const books = [
      {
        metadata: {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          isbn: "9780743273565",
          genre: "Classic Fiction",
          rating: 5,
        },
      },
      {
        metadata: {
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          isbn: "9780446310789",
          genre: "Classic Fiction",
          rating: 5,
        },
      },
      {
        metadata: {
          title: "1984",
          author: "George Orwell",
          isbn: "9780451524935",
          genre: "Dystopian Fiction",
          rating: 4,
        },
      },
    ];

    const addedBooks = [];
    for (const book of books) {
      const addResponse = await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .send(book)
        .expect(201);

      expect(addResponse.body.success).toBe(true);
      addedBooks.push(addResponse.body.data);
    }

    // Step 3: Verify collection now shows correct item count
    const collectionResponse = await supertest(app)
      .get(`/api/v1/collections/${collectionId}`)
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(collectionResponse.body.data.itemCount).toBe(3);

    // Step 4: List all books in the collection
    const itemsResponse = await supertest(app)
      .get(`/api/v1/collections/${collectionId}/items`)
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(itemsResponse.body.data).toHaveLength(3);
    expect(
      itemsResponse.body.data.every(
        (item: { collectionId: string }) => item.collectionId === collectionId,
      ),
    ).toBe(true);

    // Step 5: Search for books by title
    const searchResponse = await supertest(app)
      .get("/api/v1/items/search")
      .query({ q: "Gatsby" })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(searchResponse.body.data.length).toBeGreaterThan(0);
    expect(
      searchResponse.body.data.some((item: { metadata: { title: string } }) =>
        item.metadata.title.includes("Great Gatsby"),
      ),
    ).toBe(true);

    // Step 6: Update a book's metadata
    const bookToUpdate = addedBooks[0];
    const updateData = {
      metadata: {
        ...bookToUpdate.metadata,
        rating: 4,
        genre: "American Literature",
      },
    };

    const updateResponse = await supertest(app)
      .put(`/api/v1/items/${bookToUpdate.id}`)
      .set("Authorization", "Bearer valid_token")
      .send(updateData)
      .expect(200);

    expect(updateResponse.body.data.metadata.rating).toBe(4);
    expect(updateResponse.body.data.metadata.genre).toBe("American Literature");

    // Step 7: Filter books by genre
    const genreSearchResponse = await supertest(app)
      .get("/api/v1/items/search")
      .query({ q: "Classic Fiction", collectionId })
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(genreSearchResponse.body.data.length).toBeGreaterThan(0);

    // Step 8: Verify we can retrieve individual book details
    const bookDetailResponse = await supertest(app)
      .get(`/api/v1/items/${addedBooks[1].id}`)
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(bookDetailResponse.body.data.metadata.title).toBe(
      "To Kill a Mockingbird",
    );

    // Step 9: Update collection schema to add new field
    const updatedSchema = {
      name: libraryCollection.name,
      description: libraryCollection.description,
      schema: {
        fields: [
          ...libraryCollection.schema.fields,
          { name: "dateRead", type: "date", required: false },
        ],
      },
    };

    const schemaUpdateResponse = await supertest(app)
      .put(`/api/v1/collections/${collectionId}`)
      .set("Authorization", "Bearer valid_token")
      .send(updatedSchema)
      .expect(200);

    expect(schemaUpdateResponse.body.data.schema.fields).toHaveLength(6);

    // Step 10: Verify collection appears in user's collection list
    const allCollectionsResponse = await supertest(app)
      .get("/api/v1/collections")
      .set("Authorization", "Bearer valid_token")
      .expect(200);

    expect(
      allCollectionsResponse.body.data.some(
        (col: { id: string }) => col.id === collectionId,
      ),
    ).toBe(true);
  });
});
